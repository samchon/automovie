/** Current head rows from a verified recipe or explicit native residual carry.
 * @author Samchon
 */
export interface IHumanSourceLipClosureRows {
  /** Original public closure endpoint identity. */
  endpoint: string;

  /** Accepted upstream state identity; null for explicit residual carry. */
  recipe: string | null;

  /** Accepted extraction-frame shift, metres; null for residual carry. */
  frameShiftMetres: number[] | null;

  /** Distinguishes upstream recovery from the prototype transport convention. */
  provenance: "upstreamRecipe" | "carriedNativeResidual";

  /** Actual best original recipe residual, metres, even when not accepted. */
  recoveryMaximumMetres: number;

  /** Sparse [current head vertex, dx, dy, dz] metre rows. */
  rows: number[];
}
