import type { IHumanSourceLoss } from "./IHumanSourceLoss.ts";
import type { IHumanSourceReproductionRow } from "./IHumanSourceReproductionRow.ts";

/**
 * The reproduction record of one generation: every published row with its
 * regeneration and carry errors, every loss, and the measured checks of each
 * stage (cut identity, coverage, maps, counts).
 *
 * @author Samchon
 */
export interface IHumanSourceReproductionReport {
  generation: string;
  rows: IHumanSourceReproductionRow[];
  losses: IHumanSourceLoss[];
  checks: Record<string, Record<string, number | boolean | string>>;
}
