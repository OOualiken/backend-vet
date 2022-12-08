const User = require("../models/user");
const {check} = require("express-validator");
const bcrypt = require("bcryptjs");
const {UserDoesntExistError, UserError, ValidationError} = require("../configs/customError")
const {ROLE} = require("../models/enum/enum")
const stripe = require('stripe')(process.env.STRIPE_SECRET_API_KEY);
const {MAILACTION} = require("../models/enum/enum")

exports.scheduleVerification = [
    check("startingHour", "startingHour is required").not().isEmpty(),
    check("pauseStart", "pauseStart is required").not().isEmpty(),
    check("pauseFinish", "pauseFinish is required").not().isEmpty(),
    check("finishingHour", "finishingHour is required").not().isEmpty(),
    check("workingDay", "workingDay is not correct").isArray()
];

exports.getCurrent = async (userId) =>{
    let user = await User.findOne({_id: userId});
    if (!user) throw new UserDoesntExistError()
    return userToUserInfo(user)
}

exports.getUserById = async (userId) =>{
    let user = await User.findOne({_id: userId});
    if (!user) throw new UserDoesntExistError()
    return userToUserInfo(user)
}

exports.getUserByRole = async (role) =>{
    if(!Object.values(ROLE).includes(role)) throw new UserError("Role doesnt exist")

    let userList = await User.find({role: role})

    let resList = []
    for(let i = 0; i<userList.length; i++){
        resList.push(userToUserInfo(userList[i]))
    }

    return resList
}

exports.getNotActiveVet = async () =>{
    let userList = await User.find({role: ROLE.veterinary, active: false})

    let resList = []
    for(let i = 0; i<userList.length; i++){
        resList.push(userToUserInfo(userList[i]))
    }

    return resList
}

exports.updateCurrent = async (user, id) => {
    let userDb = await User.findOne({_id: id});

    if(userDb.role === ROLE.veterinary){
        let updVet = await newVet(user, id, userDb)

        return updVet
    }
    else if(userDb.role === ROLE.client || userDb.role === ROLE.admin){
        let updUser = await newUser(user, id, userDb)

        return  updUser
    }
    throw new UserError("Role doesn't exist.")
}

exports.deleteCurrent = async (id) => {
    return User.deleteOne({_id: id})
}

exports.deleteUserById = async (id) => {
    let userDb = await User.findOne({_id: id});
    if(!userDb) throw new UserDoesntExistError()


    return User.deleteOne({_id: id})
}

exports.updateVetSchedule = async (userId, schedule) => {
    if(schedule.workingDay.length !== 7) throw new ValidationError("The working day list is not good!");

    if(!validateScheduleHour(schedule.startingHour)) throw new ValidationError("The starting hour is not numeric!");
    if(!validateScheduleHour(schedule.pauseStart)) throw new ValidationError("The pause start hour is not numeric!");
    if(!validateScheduleHour(schedule.pauseFinish)) throw new ValidationError("The pause finish hour is not numeric!");
    if(!validateScheduleHour(schedule.finishingHour)) throw new ValidationError("The finishing hour hour is not numeric!");

    return User.updateOne({_id: userId},
        {
            schedule: {
                startingHour: schedule.startingHour,
                pauseStart: schedule.pauseStart,
                pauseFinish: schedule.pauseFinish,
                finishingHour: schedule.finishingHour,
                workingDay: schedule.workingDay
            }
        });

}

exports.userToDto = (user) => {
    return userToUserInfo(user)
}

exports.removePet = async (hrId, userId) => {
    let userDb = await User.findOne({_id: userId});

    userDb.Pets = userDb.Pets.filter(function(elem) {
        return elem.toString() != hrId
    })
    return userDb.save()
}

exports.createSession = async (userId) =>{
    let user = await User.findById(userId);
    if (!user) throw new UserDoesntExistError()

    const priceId = process.env.PRICE_ID;

    return stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: process.env.WEBSECURE+process.env.FRONT_URI+'#/success',
        cancel_url: process.env.WEBSECURE+process.env.FRONT_URI+'#/fail',
        customer: user.customerId,
        subscription_data:{
            metadata : {
                user_id: user._id.toString()
            }
        }
    });
}

function validateScheduleHour(hour){
    let str = hour.split(":")

    if(str.length !== 2) return false

    return !((isNaN(parseInt(str[0])) || isNaN(parseInt(str[1])))
        || (str[0].length !== 2 || str[1].length !== 2));


}

async function newUser(user, id, oldUser){
    let password = oldUser.password

    if(!(user.password === undefined || user.password === null || user.password ==="")){
        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(user.password, salt);
    }

    return User.updateOne({_id: id},
        {
        _id: id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNb: user.phoneNb,
        password: password
    })
}

async function newVet(user, id, oldUser){
    let password = oldUser.password

    if((user.password !== undefined && user.password !== null) || user.password !==""){
        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(user.password, salt);
    }

    return  User.updateOne({_id: id},
        {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            //birthdate: user.birthdate,
            phoneNb: user.phoneNb,
            password: password,
            //TODO pour le moment on laisse, quand mail de vérif on avisera
            speciality: user.speciality.toLowerCase(),
            street: user.street,
            postalCode: user.postalCode,
            city: user.city,
        })
}

function userToUserInfo(user){

    return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        speciality: user.speciality,
        street: user.street,
        postalCode: user.postalCode,
        active: user.active,
        city: user.city,
        phoneNb: user.phoneNb,
        Pets: user.Pets,
    }
}

