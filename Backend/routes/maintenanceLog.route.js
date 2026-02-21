import express from "express";
const router = express.Router();
import * as ctrl from "../controllers/maintenanceLog.controller.js";
import * as v from "../validators/maintenanceLog.validator.js";
import validate from "../middleware/validate.js";

router.get("/", validate(v.listSchema), ctrl.getMaintenanceLogs);
router.post("/", validate(v.createSchema), ctrl.createMaintenanceLog);
router.get("/:id", validate(v.idParamSchema), ctrl.getMaintenanceLogById);
router.patch("/:id", validate(v.updateSchema), ctrl.updateMaintenanceLog);
router.patch(
  "/:id/status",
  validate(v.updateStatusSchema),
  ctrl.updateMaintenanceLogStatus,
);
router.delete("/:id", validate(v.idParamSchema), ctrl.deleteMaintenanceLog);

export default router;
