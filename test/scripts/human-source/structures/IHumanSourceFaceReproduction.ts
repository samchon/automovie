import type { IHumanSourceLoss } from "./IHumanSourceLoss.ts";
import type { IHumanSourceReproductionRow } from "./IHumanSourceReproductionRow.ts";

/**
 * Face reproduction result. `g1Targets` holds every published face skin
 * endpoint in one-skin vertex ids, ascending; `recipes` names the upstream
 * state and frame shift of each recipe-matched endpoint.
 */
export interface IHumanSourceFaceReproduction {
  rows: IHumanSourceReproductionRow[];
  losses: IHumanSourceLoss[];
  g1Targets: Record<string, number[]>;
  recipes: Record<string, string>;
  checks: Record<string, number | boolean | string>;
}
