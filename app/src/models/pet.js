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
    race: {
        type: String,
        required: true,
    },
    sex: {
        type: String,
        required: true,
    },
    sterilised: {
        type: Boolean,
        required: true,
    },
    birthDate: {
        type: Date,
        required: true,
    },
    vaccins: [
        {
            name: {
                type: String,
                required: true,
            },
            dateVaccin: {
                type: Date,
                required: true,
            },
            dateRecall: {
                type: Date,
            }
        }
    ],
    notes: [
        {
            informations: {
                type: String,
                required: true,
            },
            date: {
                type: Date,
                required: true,
            },
        }
    ],
    deleted: {type: Boolean, default: false}
})


module.exports = mongoose.model("Pet", petSchema);
