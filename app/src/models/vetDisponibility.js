const mongoose = require("mongoose");

const VetDisponibilitySchema  = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    bookingStatus: {
        type: Boolean,
        required: true,
        default: false
    },
    service: {
        type: String,
    },
    veterinary: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    client: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    requestDate: {
        type: Date,
    },
    pet: {
        type: mongoose.Types.ObjectId,
        ref: 'Pet'
    },
})


module.exports = mongoose.model("VetDisponibility", VetDisponibilitySchema);
