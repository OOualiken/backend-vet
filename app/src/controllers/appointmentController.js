const {newVetDispo, getVetDispo, deleteVetDispo, getAppointmentByUserId, bookVetDispo,
    retrivePossibleDate, getVetDisponibility, adminGetAppointmentByUserId, deleteBookingVetDispo} = require("../services/appointmentService")
const { validationResult } = require("express-validator");
const {ValidationError, UserDoesntExistError, AuthError, AppointmentError, UserError} = require("../configs/customError")

exports.postVetDispo = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: "Validation errors",
            errors
        });
    }
    try{
        let result = await newVetDispo(req.body, req.userId)
        return res.status(201).json({result});
    }catch (err){
        handleErrorMessage(err, res)
    }
}

exports.getVetDisponibility = async (req, res) => {
    try{
        let result = await getVetDispo(req.params.id, req.userId)
        return res.status(200).json({result});
    }catch (err){
        handleErrorMessage(err, res)
    }
}

exports.getMyAppointment = async (req, res) => {
    try{
        let result = await getAppointmentByUserId(req.userId)
        return res.status(200).json(result);
    }catch (err){
        handleErrorMessage(err, res)
    }
}

exports.getAppointmentByUserId = async (req, res) => {
    try{
        let result = await adminGetAppointmentByUserId(req.params.userId)
        return res.status(200).json(result);
    }catch (err){
        handleErrorMessage(err, res)
    }
}

exports.delteVetDispo = async (req, res) => {
    try{
        let result = await deleteVetDispo(req.params.id, req.userId)
        return res.status(200).json({result});
    }catch (err){
        handleErrorMessage(err, res)
    }
}

exports.boookVet = async (req, res) => {
    try{
        let result = await bookVetDispo(req.body, req.userId, req.params.id)
        return res.status(200).json({result});
    }catch (err){
        handleErrorMessage(err, res)
    }
}

exports.deleteBoookVet = async (req, res) => {
    try{
        let result = await deleteBookingVetDispo(req.userId, req.params.id)
        return res.status(200).json({result});
    }catch (err){
        handleErrorMessage(err, res)
    }
}

exports.getRequestAppointment = async (req, res) => {
    try{
        let result = await retrivePossibleDate(req.body.filter)
        return res.status(200).json(result)
    }catch (err){
        console.error(err.message);
        return res.status(400).json(err.message);
    }
}


exports.getVetDisponibilityList = async (req, res) => {
    try{
        let result = await getVetDisponibility(req.params.id, req.body.date)
        return res.status(200).json(result)
    }catch (err){
        console.error(err.message);
        return res.status(400).json(err.message);
    }
}


function handleErrorMessage(err, res){
    console.error(err.message);
    if(err instanceof UserDoesntExistError || err instanceof AppointmentError){
        return res.status(404).json(err.message);
    }
    else if(err instanceof AuthError || err instanceof UserError || err instanceof ValidationError){
        return res.status(412).json(err.message);
    }
    else{
        return res.status(400).json(err.message);
    }
}
