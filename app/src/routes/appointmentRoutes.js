const {authUser, authVet} = require("../services/authService")
const {getMyAppointment, boookVet, postVetDispo,
    getVetDisponibility, deleteBoookVet, delteVetDispo, getVetDisponibilityList} = require("../controllers/appointmentController")
const {disponibilityValidation, bookDisponibilityValidation} = require("../services/appointmentService")

const router = require("express").Router();

router.get("/", authUser, getMyAppointment);

router.get("/vet-disponibility/:id", authUser, getVetDisponibility);
router.post("/vet-disponibility", authUser, authVet, disponibilityValidation, postVetDispo);
router.post("/disponibility-list/:id", authUser, getVetDisponibilityList);
router.delete("/vet-disponibility/:id", authUser, authVet, delteVetDispo);

router.post("/book/:id", authUser, bookDisponibilityValidation, boookVet);
router.delete("/book/:id", authUser, deleteBoookVet);


module.exports = router;
