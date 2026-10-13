/**
 * One document's existing rest, lean and performed arrays supplied to the surface sag calculation. Arrays share source order; distances are metres and softness remains the existing scalar.
 *
 * @evidence contracts/common.md#principled-implementation Matched document-rest, lean and performed arrays plus transported down directions define the existing source-order sag operands.
 * @evidence contracts/common.md#clear-and-simple-design One internal carrier isolates sag inputs from rig resolution and public body measurements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The dimensionless softness parameter is an existing source response, not a measured tissue modulus or a substitute cloth simulation.
 * @evidence contracts/common.md#meaningful-documentation Members state source-order correspondence, meter positions, finite-difference hanging responses and scalar softness meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Sag input typing performs no displacement calculation or transported-direction evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Matched arrays describe reusable evaluated operands without implementing sag-result caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed sag arrays acquire no deformed output buffer or material-physics task.
 * @author Samchon
 */
export interface IHumanBodySurfaceSagInput {
  /** Document-rest positions in source order. */
  rest: number[];

  /** Matching lean-shape positions. */
  lean: number[];

  /** Current performed positions before sag. */
  skinned: number[];

  /** Dimensionless posed finite-difference response per metre of rest-down travel; not normalized, per source vertex. */
  hanging: number[];

  /** Existing dimensionless softness value. */
  softness: number;
}
