import express from "express";
const router = express.Router();
import * as ctrl from "../controllers/vehicleStatusLog.controller.js";
import * as v from "../validators/vehicleStatusLog.validator.js";
import validate from "../middleware/validate.js";

router.get("/", validate(v.listSchema), ctrl.getVehicleStatusLogs);
router.post("/", validate(v.createSchema), ctrl.createVehicleStatusLog);
// Must be before /:id to avoid route conflict
router.get(
  "/vehicle/:vehicle_id",
  validate(v.vehicleIdParamSchema),
  ctrl.getVehicleHistory,
);
router.get("/:id", validate(v.idParamSchema), ctrl.getVehicleStatusLogById);
router.delete("/:id", validate(v.idParamSchema), ctrl.deleteVehicleStatusLog);

export default router;
