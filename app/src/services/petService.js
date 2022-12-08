const User = require("../models/user");
const {check} = require("express-validator");
const pet = require("../models/pet");
const Appointment = require("../models/appointment");
const userService = require("./userService")
const {deleteAppointmentByHRId} = require("./appointmentService")
const {ValidationError, UserDoesntExistError, UserError, HRExistError, HRError} = require("../configs/customError")
const {ANIMALTYPE, SEX, ROLE} = require("../models/enum/enum")
const {validateBirthDate} = require("../configs/validation")


exports.petValidation = [
    check("type", "type is required").not().isEmpty(),
    check("name", "name is required").not().isEmpty(),
    check("race", "race is required").not().isEmpty(),
    check("sex", "sex is required").not().isEmpty(),
    check("sterilised", "sterilised is required").not().isEmpty(),
    check("sterilised", "sterilised is not a boolean").isBoolean(),
    check("birthDate", "birthDate is required").not().isEmpty(),
];

exports.idValidation = [
    check("_id", "Id is required").not().isEmpty(),
];

exports.updatePet = async(pet, userId) => {
    let hr = await validateUserRightOnHR(userId, pet._id, "put")

    return updateHR(pet)
}

exports.deletePet = async(hrId, userId) => {
    let hr = await validateUserRightOnHR(userId, hrId, "delete")

    deleteHr(hrId)
    await deleteAppointmentByHRId(hrId)

    let user = await User.findById(userId)

    return userService.removePet(hrId, userId)
}

exports.getPetById = async(hrId, userId) => {
    let hr = await validateUserRightOnHR(userId, hrId, "get")
    return hrToDto(hr)
}

exports.hrFindById = async(hrId) => {
    let hr = await pet.findById(hrId)
    return hrToDto(hr)
}

exports.addNewPet = async(pet, userId) => {
    let user = await User.findById(userId)
    if(!user) throw new UserDoesntExistError()

    let nHr = newPet(pet)

    nHr = await nHr.save()
    user.pets.push(nHr.id)


    await user.save()

    return nHr
}

async function validateUserRightOnHR(userId, hrId, action){
    let hr = await pet.findById(hrId)

    if(!hr) throw new HRExistError()
    if(hr.deleted && action!=="get") throw new HRError("This HR is deleted, you can't access it!")


    let user = await User.findById(userId)
    if(!user) throw new UserDoesntExistError()


    if(user.role===ROLE.veterinary) return hr

    if(!(user.pets.find(e => e.toString() === hrId))) throw new UserError("User cant access to this HR")

    return hr
}

function newPet(pet) {
    return new pet({
        type: validateAnimalType(pet.type),
        name: pet.name,
        race: pet.race,
        sex: validateAnimalSex(pet.sex),
        sterilised: pet.sterilised,
        birthDate: validateBirthDate(pet.birthDate),
        vaccins: pet.vaccins,
        notes: pet.notes,
    })
}

function updateHR(pet) {
    return pet.updateOne({
            _id: pet._id
        },
        {
        type: validateAnimalType(pet.type),
        name: pet.name,
        race: pet.race,
        sex: validateAnimalSex(pet.sex),
        sterilised: pet.sterilised,
        birthDate: validateBirthDate(pet.birthDate),
        vaccins: pet.vaccins,
        notes: pet.notes,
    })
}

function deleteHr(hrId){
    return pet.updateOne({
        _id: hrId
    }, {
        deleted: true
    })
}

exports.getHRById = async(id) => {
    let hr = await pet.findById(id)
    if(!hr) throw new HRExistError()
    return hr
}

function validateAnimalType(type){
    for(const a of Object.values(ANIMALTYPE)){
        if(a.toLowerCase() === type.toLowerCase()){
            return a
        }
    }
    throw new ValidationError("Animal type doesnt exist.")
}

function validateAnimalSex(sex){
    for(const s of Object.values(SEX)){
        if(s.toLowerCase() === sex.toLowerCase()){
            return s
        }
    }
    throw new ValidationError("Animal sex doesnt exist.")
}

function hrToDto(hr){
    return {
        id: hr._id,
        type: hr.type,
        name: hr.name,
        race: hr.race,
        sex: hr.sex,
        sterilised: hr.sterilised,
        birthDate: hr.birthDate,
        vaccins: hr.vaccins,
        notes: hr.notes,
        deleted: hr.deleted
    }
}
