const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        minlength: 2,
        maxlength: 255,
        trim: true,
    },
    lastName: {
        type: String,
        minlength: 2,
        maxlength: 255,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        minlength: 5,
        maxlength: 255,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 255,
    },
    role: {
        type: String,
        required: true,
        default: "client"
    },
    active: {
        type: Boolean,
        default: false,
        required: true
    },
    verifiedAt: {
        type: Date,
    },
    phoneNb: {
        type: String,
        minlength: 9,
        maxlength: 12,
    },
    speciality: {
        type: String,
        maxlength: 255,
    },
    street: {
        type: String,
        maxlength: 255,
    },
    postalCode: {
        type: String,
        maxlength: 255,
    },
    city: {
        type: String,
        maxlength: 255,
    },
    pets: [
        {
            type: mongoose.Types.ObjectId,
            ref: "Pet"
        }
    ]
})

userSchema.methods.generateAuthToken = async function(expirationTime) {
    const user = this;
    const token = jwt.sign({_id: user._id, email: user.email}, process.env.JWT_KEY, {expiresIn: expirationTime })
    await user.save()
    return token
}

module.exports = mongoose.model("User", userSchema);
