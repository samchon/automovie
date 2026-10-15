import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { levelCell } from "../../geometry/levelCell";
import { templeRoofRules } from "../roofs/templeRoofRules";
import { templeLevels as y } from "../templeLevels";
import { templeCourtyardPlan } from "./templeCourtyardPlan";
/**
 * Open courtyard and fountain consumer inputs
 * Finite cell caps assign observations; they are not ceiling meshes, shadows or clipping.
 * Later prototypes/systems own the basin and jet; this owner copies no geometry.
 */
export const templeCourtyard = (): IAutoMovieBuiltSpace => ({
  id: "courtyard", kind: "courtyard", parent: y.storey, fidelity: "exact",
  cells: [levelCell("courtyard.body", templeCourtyardPlan, y.courtyard, templeRoofRules.courtEave)],
});

