import express from "express";
const router = express.Router();
import * as ctrl from "../controllers/fuelLog.controller.js";
import * as v from "../validators/fuelLog.validator.js";
import validate from "../middleware/validate.js";

router.get("/", validate(v.listSchema), ctrl.getFuelLogs);
router.post("/", validate(v.createSchema), ctrl.createFuelLog);
router.get("/:id", validate(v.idParamSchema), ctrl.getFuelLogById);
router.patch("/:id", validate(v.updateSchema), ctrl.updateFuelLog);
router.delete("/:id", validate(v.idParamSchema), ctrl.deleteFuelLog);

export default router;
