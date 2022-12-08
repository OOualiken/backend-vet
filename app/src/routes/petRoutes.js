const {authUser, authVet} = require("../services/authService")
const {postNewPet, putPet, getPet, deletePet} = require("../controllers/petController")
const {petValidation, idValidation} = require("../services/petService")

const router = require("express").Router();

router.post("/", authUser, petValidation, postNewPet);
router.put("/", authUser, petValidation, idValidation, putPet);
router.delete("/:id", authUser, deletePet);
router.get("/:id", authUser, getPet);


module.exports = router;
