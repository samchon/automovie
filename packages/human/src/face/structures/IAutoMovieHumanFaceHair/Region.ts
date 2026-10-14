/**
 * Axis-aligned Gaussian envelope in the neutral head's metre coordinates.
 * Root sampling and parting use the same arithmetic but independent inputs.
 * It stores six field coefficients, never a root list or curve samples.
 *
 * @evidence contracts/common.md#principled-implementation The shared exp(-0.5*sum(((point-center)/spread)^2)) envelope gives root preference and parting influence from neutral metre coordinates without prescribing personal root positions.
 * @evidence contracts/common.md#clear-and-simple-design A centre and three independent positive spreads express an axis-aligned field rather than a second growth-domain boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts assertHumanFaceHair rejects nonfinite centres and nonpositive spreads; Gaussian preference cannot enlarge the admitted anatomical domain or guarantee a retained root when sampling underflows.
 * @evidence contracts/common.md#meaningful-documentation Spread is a metre-space standard deviation, not a clipping radius or measured follicle density.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record does not evaluate exponentials or perform rejection sampling.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared field arithmetic belongs to humanFaceHairEnvelope, with no memoization in this declaration.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Six caller-owned numbers retain no sampled population or mesh query.
 *
 * @author Samchon
 */
export interface Region {
  /** Finite centre coordinates in neutral head metres. */
  center: [number, number, number];

  /** Positive metre-space standard deviations, not a hard clipping radius. */
  spread: [number, number, number];
}
