const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    service: {
        type: String,
        required: true,
    },
    client: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requestDate: {
        type: Date,
        required: true,
    },
    pet: {
        type: mongoose.Types.ObjectId,
        ref: 'Pet',
        required: true,
    },
})


module.exports = mongoose.model("Appointment", appointmentSchema);
