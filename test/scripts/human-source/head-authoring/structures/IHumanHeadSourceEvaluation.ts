import type { IHumanHeadSourceNasalSection } from "./IHumanHeadSourceNasalSection.ts";

/** One complete native shared-head evaluation with owned arrays and source receipts.
 * Positions and joint witnesses remain Blender XYZ metres; polygon IDs retain
 * original native support and deterministically appended section population.
 * @author Samchon
 */
export interface IHumanHeadSourceEvaluation {
  positions: Float64Array;

  joints: Float64Array;

  polygons: number[][];

  /** Source chart support/quantity observations, without clinical certification. */
  envelope: Record<string, unknown>;

  /** Paired source-pinna chart observations. */
  ears: Record<string, unknown>[];

  /** Paired exact native cap and source-binding observations. */
  nasal: IHumanHeadSourceNasalSection[];
}
