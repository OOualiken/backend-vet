const {UserDoesntExistError, UserError, HRExistError} = require("../configs/customError")
const { validationResult } = require("express-validator");
const {addNewPet, updatePet, deletePet, getPetById} = require("../services/petService")

exports.postNewPet = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json(errors.array());
    }
    try{
        let result = await addNewPet(req.body, req.userId)
        return res.status(201).json(result)
    }catch (err){
        console.error(err.message);
        return res.status(400).json(err.message);
    }
}

exports.putPet = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json(errors.array());
    }
    try{
        let result = await updatePet(req.body, req.userId)
        return res.status(200).json(result)
    }catch (err){
        console.error(err.message);

        if(err instanceof UserDoesntExistError || HRExistError){
            return res.status(404).json(err.message);
        }
        else if(err instanceof UserError){
            return res.status(400).json(err.message);
        }

        return res.status(400).json(err.message);
    }
}

exports.deletePet = async (req, res) => {
    try{
        let result = await deletePet(req.params.id, req.userId)
        return res.status(200).json(result)
    }catch (err){
        console.error(err.message);

        if(err instanceof UserDoesntExistError || HRExistError){
            return res.status(404).json(err.message);
        }
        else if(err instanceof UserError){
            return res.status(400).json(err.message);
        }

        return res.status(400).json(err.message);
    }
}

exports.getPet = async (req, res) => {
    try{
        let result = await getPetById(req.params.id, req.userId)
        return res.status(200).json(result)
    }catch (err){
        console.error(err.message);

        if(err instanceof UserDoesntExistError || HRExistError){
            return res.status(404).json(err.message);
        }
        else if(err instanceof UserError){
            return res.status(400).json(err.message);
        }

        return res.status(400).json(err.message);
    }
}
