const {check} = require("express-validator");
const User = require("../models/user");
const Appointment = require("../models/appointment");
const VetDisponibility = require("../models/vetDisponibility");
const Pet = require("../models/pet");
const {ValidationError, UserDoesntExistError, AuthError, AppointmentError, UserError, HRExistError} = require("../configs/customError")
const {ROLE, MAILACTION} = require("../models/enum/enum")
const {validateAppointmentDate} = require("../configs/validation")
const {userToDto, getUserById} = require("../services/userService")
const petService = require("./petService")

const moment = require("moment")

exports.appointmentValidation = [
    check("date", "date is required").not().isEmpty(),
    check("veterinary", "veterinary is required").not().isEmpty(),
    check("pet", "Pet is required").not().isEmpty(),
];

exports.disponibilityValidation = [
    check("date", "date is required").not().isEmpty(),
];
exports.bookDisponibilityValidation = [
    check("service", "pet is required").not().isEmpty(),
    check("pet", "pet is required").not().isEmpty()
];

exports.appointmentUserUpdateValidation = [
    check("date", "date is required").not().isEmpty(),
    check("date", "date is required").isDate(),
    check("pet", "Pet is required").not().isEmpty(),
];

exports.newAppointment = async(body, userId) => {
    let user = await User.findById(userId)
    if(!user) throw new UserDoesntExistError()

    let vet = await User.findById(body.veterinary)
    if(!vet) throw new UserDoesntExistError()
    if(vet.role !== ROLE.veterinary) throw UserError("Can't book an appointment with a user that is not a veterinary.")
    if(!vet.active) throw UserError("Can't book an appointment with a veterinary without an active account.")

    let hr = await Pet.findById(body.pet)
    if(!hr) throw new HRExistError()

    if(!(await isAppointmentAvailable(vet, new Date(body.date)))) throw new AppointmentError("Vet not available at this time.")


    let appointment = new Appointment({
        date: validateAppointmentDate(body.date),
        client: user._id,
        veterinary: vet._id,
        appointmentType: verifyAppointmentType(vet, body.appointmentType),
        requestDate: new Date(),
        Pet: body.pet,
    })


    return appointment.save()
}

exports.newVetDispo = async(body, userId) => {
    let user = await User.findById(userId)
    if(!user) throw new UserDoesntExistError()

    if(user.role !== ROLE.veterinary) throw UserError("Can't create a disponibility with a user that is not a veterinary.")
    if(!user.active) throw UserError("Can't create a disponibility with a veterinary without an active account.")

    console.log(body.date)

    if(!(await isAppointmentAvailable(user, new Date(body.date)))) throw new AppointmentError("Vet not available at this time.")


    let appointment = new VetDisponibility({
        date: validateAppointmentDate(body.date),
        veterinary: userId,
        bookingStatus: false
    })
    return appointment.save()
}

exports.deleteVetDispo = async(vetDispoId, userId) => {
    let user = await User.findById(userId)
    if(!user) throw new UserDoesntExistError()

    let dispo = await VetDisponibility.findById(vetDispoId)
    if(!dispo) throw new AppointmentError("Disponibility doesnt exist")

    if(userId !== dispo.veterinary.toString()) throw new AuthError("You dont have the right to delete the disponibility")

    return VetDisponibility.deleteOne({_id: vetDispoId})
}

exports.getVetDispo = async(vetDispoId, userId) => {
    let user = await User.findById(userId)
    if(!user) throw new UserDoesntExistError()

    let dispo = await VetDisponibility.findById(vetDispoId)
    if(!dispo) throw new AppointmentError("Disponibility doesnt exist")

    if(dispo.veterinary.toString() === userId) return dispo

    if(dispo.client.toString() !== userId) throw new AuthError("You dont have the right to view the disponibility")

    return dispo
}

exports.bookVetDispo = async(body, userId, vetDispoId) => {
    let user = await User.findById(userId)
    if(!user) throw new UserDoesntExistError()

    let dispo = await VetDisponibility.findById(vetDispoId)
    if(!dispo) throw new AppointmentError("Disponibility doesnt exist")

    if(dispo.bookingStatus) throw new AppointmentError("Appointment already booked")

    return VetDisponibility.updateOne({_id: vetDispoId},
        {
            service: body.service,
            client: userId,
            requestDate: new Date(),
            pet: body.pet,
            bookingStatus: true
        })
}

exports.deleteBookingVetDispo = async(userId, vetDispoId) => {
    let user = await User.findById(userId)
    if(!user) throw new UserDoesntExistError()

    let dispo = await VetDisponibility.findById(vetDispoId)
    if(!dispo) throw new AppointmentError("Disponibility doesnt exist")

    return VetDisponibility.updateOne({_id: vetDispoId},
        {
            service: null,
            client: null,
            requestDate: null,
            pet: null,
            bookingStatus: false
        })
}

exports.getAppointmentById = async(appId, userId) => {
    return validateRightOnAppointment(appId, userId)
}

exports.getAppointmentByUserId = async(userId) => {
    let user = await User.findById(userId)
    if(!user) throw new UserDoesntExistError()

    let appList = []

    if(user.role === ROLE.client){
        appList = await VetDisponibility.find({
            client: userId
        })
    }else if(user.role === ROLE.veterinary){
        appList = await VetDisponibility.find({
            veterinary: userId,
            bookingStatus: true
        })
    }

    let past = []
    let future = []

    for(const a of appList){
        if(a.date<new Date()){
            past.push(await appointmentDto(a, userId))
        }else{
            future.push(await appointmentDto(a, userId))
        }
    }
    return {
        past,
        future
    }

}

exports.adminGetAppointmentByUserId = async(userId) => {
    let user = await getUserById(userId)

    let appList = []

    if(user.role === ROLE.client){
        appList = await Appointment.find({
            client: userId
        })
    }else if(user.role === ROLE.veterinary){
        appList = await Appointment.find({
            veterinary: userId
        })
    }

    let res = []

    for(const a of appList){
        res.push(await appointmentDto(a, userId))
    }
    return res

}

exports.deleteAppointmentById = async (appId, userId) => {

    let app = await validateRightOnAppointment(appId, userId)
    if(!(app.client.equals(userId) || app.veterinary.equals(userId))) throw new AuthError("You don't have the rights to delete this appointment.")


    let user = await User.findById(app.client)
    let vet = await User.findById(app.veterinary)

    let del = await Appointment.deleteOne({_id: app._id})

    return del
}

exports.deleteAppointmentByHRId = async (hrId) => {

    return Appointment.deleteMany({Pet: hrId})
}

exports.moveAppointmentDate = async(body, appId, userId) => {
    let app = await validateRightOnAppointment(appId, userId)

    if(!app.client.equals(userId)) throw new AuthError("You don't have the rights to move this appointment.")

    let user = await User.findById(app.client)
    let vet = await User.findById(app.veterinary)

    if(!(await isAppointmentAvailable(vet, new Date(body.date)))) throw new AppointmentError("Vet not available at this time.")


    return Appointment.updateOne({
        _id: appId
        },
        {
        date: validateAppointmentDate(body.date),
        requestDate: new Date(),
    })
}

exports.getVetDisponibility = async(vetId, date) => {
    let vet = await User.findById(vetId)
    if(!vet) throw new UserDoesntExistError()

    return getDisponibilityForVet(vet, new Date(date))
}

exports.getAllDisponibility = async(date) => {
    let momentDate = moment(date)
    let dateStart = momentDate.set({
        hour:   0,
        minute: 0,
        second: 0
    })


    let dispoList = await VetDisponibility.find({
        date: {
            $gte: dateStart,
            $lt: moment(dateStart).add(1, 'd'),
        },
        bookingStatus: false
    })

    return Promise.all(dispoList.map(async e => {
        return appointmentDto(e)
    }))
}
exports.retrivePossibleDate = async (filter) =>{
    let date = new Date(filter.date)

    let vetList


    if(filter.postalCode === null || filter.postalCode.length===0){
        vetList = await User.find({
            role: ROLE.veterinary,
            active: true,
            speciality: filter.speciality.toLowerCase(),
            city: filter.city.toLowerCase()
        })
    }else {

        vetList = await User.find({
            role: ROLE.veterinary,
            active: true,
            postalCode: filter.postalCode,
            speciality: filter.speciality.toLowerCase(),
            city: filter.city.toLowerCase()
        })
    }


    let appointmentList = []
    for(const v of vetList){
        let dispo = await getDisponibilityForVet(v, new Date(date))

        if(dispo.dispoList.length>0){
            appointmentList.push(dispo)
        }

    }
    return appointmentList

}

async function appointmentDto(app, userId) {
    let vet = await getUserById(app.veterinary)

    let client = null
    let pet = null
    let requestDate = null
    let service = null
    if(!(app.client === null || app.client === undefined)){
        console.log(app)
        client = await getUserById(app.client)
        pet = await petService.hrFindById(app.pet.toString(), userId)
        requestDate = app.requestDate
        service = app.service
    }

    return {
        id: app._id,
        date: app.date,
        bookingStatus: false,
        veterinary: vet,
        client: client,
        pet: pet,
        requestDate: requestDate,
        service: service
    }
}

exports.appToDto = async (app, userId) => {
    return appointmentDto(app, userId)
}

async function getDisponibilityForVet(vet, date){
    let userDto = await userToDto(vet)
    let momentDate = moment(date)
    let dateStart = momentDate.set({
        hour:   0,
        minute: 0,
        second: 0
    })

    let dispoList = await VetDisponibility.find({
        veterinary: vet._id,
        date: {
            $gte: dateStart,
            $lt: moment(dateStart).add(1, 'd'),
        },
        bookingStatus: false
    })

    let dispoDto = await Promise.all(dispoList.map(async e => {
        return appointmentDto(e)
    }))

    return {
        dispoList: dispoDto,
        vet: userDto
    }

}
function checkDateIsBeforeToday(date) {
    return moment(date).isAfter(new Date());
}

async function isAppointmentAvailable(vet, date){
    if(date<new Date()) return false


    let dispo = await VetDisponibility.find({
        veterinary: vet._id,
        date: {
            $gte: moment(date).subtract(29, 'm'),
            $lt: moment(date).add(29, 'm')
        }
    })


    return dispo.length===0
}

function isBetweenWorkingHour(vet, date){
    let startingHourSplit = vet.schedule.startingHour.split(":")
    let pauseStartSplit = vet.schedule.pauseStart.split(":")

    let startingHour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startingHourSplit[0], startingHourSplit[1])
    let pauseStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), pauseStartSplit[0], pauseStartSplit[1])

    let pauseFinishSplit = vet.schedule.pauseFinish.split(":")
    let finishingHourSplit = vet.schedule.finishingHour.split(":")

    let pauseFinish = new Date(date.getFullYear(), date.getMonth(), date.getDate(), pauseFinishSplit[0], pauseFinishSplit[1])
    let finishingHour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), finishingHourSplit[0], finishingHourSplit[1])

    return (moment(pauseStart).isSameOrAfter(date) && moment(startingHour).isSameOrBefore(date)) ||
        (moment(finishingHour).isSameOrAfter(date) && moment(pauseFinish).isSameOrBefore(date))
}

function getDisponibilityList(possibleAppointment, appointments){
    let disponibilityList = []
    if(appointments.length === 0) return possibleAppointment

    for(const strDate of possibleAppointment){

        const d = new Date(strDate)


        let exist = false

        for(let date of appointments){

            if((moment(d).add(29, 'm').isAfter(date) && moment(d).isBefore(date)) ||
                moment(d).subtract(29, 'm').isBefore(date) && moment(d).isAfter(date) || moment(d).isSame(date)){
                exist = true
            }
        }

        if(!(exist)){
            disponibilityList.push(d)
        }
    }
    return disponibilityList
}

function getPossibleAppoinmentList(hourA, hourB){
    let possibleAppointment = []

    for(let i = hourA ; i<hourB; ){
        possibleAppointment.push(i)
        i = moment(i).add(30, 'm').toDate()
    }
    return possibleAppointment
}

function verifyAppointmentType(vet, appointmentType) {
    let f = vet.appointmentType.find(e => e.toLowerCase() === appointmentType.toLowerCase())
    if(!f) throw ValidationError("Appointment type doesnt exist.")
    return f

}

async function validateRightOnAppointment(appId, userId){
    let user = await User.findById(userId)
    if(!user) throw new UserDoesntExistError()

    let app = await Appointment.findById(appId)
    if(!app) throw new AppointmentError("Appointment doesnt exist")

    if(!(app.client.equals(userId) || app.veterinary.equals(userId))) throw new AuthError("You cant access this appointment.")

    return app
}

function findAppointmentWithDateFilter(hourA, hourB, vetId){
    return Appointment.find({
        veterinary: vetId,
        date: {
            $gte: hourA,
            $lt: hourB
        }
    })
}
