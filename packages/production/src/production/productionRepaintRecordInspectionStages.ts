import { AutoMovieRepaintRecordInspectionStage } from "./AutoMovieRepaintRecordInspectionStage";

/** Module-owned stage vocabulary shared by classified-error construction and re-admission. Internal consumers must preserve this Set; its exported internal binding is not a runtime freeze. */
export const productionRepaintRecordInspectionStages: Set<AutoMovieRepaintRecordInspectionStage> = new Set<AutoMovieRepaintRecordInspectionStage>([
  "enumeration",
  "pointer",
  "selection",
  "receipt",
  "currentness",
  "output",
]);
