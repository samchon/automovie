import type { IHumanSourceLoss } from "./IHumanSourceLoss.ts";
import type { IHumanSourceReproductionRow } from "./IHumanSourceReproductionRow.ts";

/** Rows with their final provenance and the losses the classification adds. */
export interface IHumanSourceClassification {
  rows: IHumanSourceReproductionRow[];
  losses: IHumanSourceLoss[];
}
