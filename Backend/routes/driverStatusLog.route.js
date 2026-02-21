import express from "express";
const router = express.Router();
import * as ctrl from "../controllers/driverStatusLog.controller.js";
import * as v from "../validators/driverStatusLog.validator.js";
import validate from "../middleware/validate.js";

router.get("/", validate(v.listSchema), ctrl.getDriverStatusLogs);
router.post("/", validate(v.createSchema), ctrl.createDriverStatusLog);
// Must be before /:id to avoid route conflict
router.get(
  "/driver/:driver_id",
  validate(v.driverIdParamSchema),
  ctrl.getDriverHistory,
);
router.get("/:id", validate(v.idParamSchema), ctrl.getDriverStatusLogById);
router.delete("/:id", validate(v.idParamSchema), ctrl.deleteDriverStatusLog);

export default router;
