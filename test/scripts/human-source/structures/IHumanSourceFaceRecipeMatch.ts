/** Exact best sampled recipe and its common extraction-frame shift, metres.
 * Acceptance remains with the existing recipe residual threshold.
 * @author Samchon
 */
export interface IHumanSourceFaceRecipeMatch {
  /** Best original sampled state; acceptance is not implied by selection. */
  state: string;

  /** Largest vertex residual after subtracting the common shift, metres. */
  maximumMetres: number;

  /** Common extraction-frame XYZ shift subtracted from that candidate, metres. */
  shiftMetres: number[];
}
