/** A candidate field and its internal optimization residuals.
 * No member certifies geometry. The field owner must verify canonical posed
 * graph, actual aperture, central seats and original movement budget.
 *
 * @author Samchon
 */
export interface IHumanFaceNativeClosureStep {
  /** Candidate native gain departures, before actual geometric verification. */
  field: number[];

  /** Internal maximum affine aperture violation, not an admitted clearance. */
  apertureSlack: number;

  /** Internal graph-spacing preference, not an anatomical minimum. */
  spacingSlack: number;
}
