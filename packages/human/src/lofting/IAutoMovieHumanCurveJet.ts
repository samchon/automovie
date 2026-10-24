/**
 * Position and physical first/second derivatives of one addressed cubic span.
 * Translation changes only `point`; derivatives keep the stored phase units.
 *
 * @evidence contracts/common.md#principled-implementation Separates a point's coordinate origin from derivatives with respect to physical phase; the evaluator retains the source interval and literal endpoint jets.
 * @evidence contracts/common.md#clear-and-simple-design One result record contains the three quantities used together by a surface boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no specimen, source mesh, fallback, or alternate curve coefficients.
 * @evidence contracts/common.md#meaningful-documentation States the frame translation and the units of every member.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A structural result type chooses no computation strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A structural result type coordinates no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A structural result type owns no retained state or handles.
 */
export interface IAutoMovieHumanCurveJet {
  /** Position in millimetres relative to the requested origin. */
  point: [number, number, number];

  /** Position derivative per physical phase millimetre, dimensionless. */
  tangent: [number, number, number];

  /** Second position derivative per squared phase millimetre, in mm^-1. */
  second: [number, number, number];
}
