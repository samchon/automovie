import type { IHumanFaceHairStemRefusal } from "./IHumanFaceHairStemRefusal";

/**
 * Why a hair root refused: the integrator's attempted exit elevations did not
 * let its stem clear the skin. Intermediate elevations remain untested.
 *
 * `lowest` and `highest` are the root's cited elevation interval in degrees
 * (`humanFaceHairEmergenceRange`). `tried` lists every elevation walked, in
 * order, each of which ended in a stem refusal; `stem` is the record of the
 * stem refusal at the range top, the steepest exit the source allows.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootRefusal {
  /** Lower end of the cited range, in degrees. */
  lowest: number;

  /** Upper end of the cited range, in degrees. */
  highest: number;

  /** Every elevation walked, in order, in degrees. */
  tried: number[];

  /** The stem refusal at the range top. */
  stem: IHumanFaceHairStemRefusal;
}
