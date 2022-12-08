const mongoose = require("mongoose");

const petSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    breed: {
        type: String,
        required: true,
    },
    sex: {
        type: String,
        required: true,
    },
    weight: {
        type: Number
    },
    vaccinationRecord: [
        {
            name: {
                type: String,
                required: true,
            },
            dateVaccin: {
                type: Date,
                required: true,
            },
        }
    ],
    medicalRecord: [
        {
            type: String
        }
    ],
})


module.exports = mongoose.model("Pets", petSchema);
