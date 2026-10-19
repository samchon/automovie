import type { IAutoMovieRecoveryInput } from "@automovie/interface/recovery";

/**
 * Publish only the declared observation policy, never undeclared caller payloads.
 * Numerical values and vector references are retained without defaults or conversion.
 * Input objects can contain extra runtime properties even when their static type is
 * narrower; object-rest publication would accidentally retain source populations.
 *
 * @evidence contracts/common.md#principled-implementation Explicit declared fields separate saved observation policy from the original registered mesh and other caller-owned data without changing numerical parameters.
 * @evidence contracts/common.md#clear-and-simple-design One publication owner selects the supported policy while observation and fitting retain their existing input and arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate, face, normal, unknown property, policy default or replacement geometry is copied into saved policy.
 * @evidence contracts/common.md#meaningful-documentation States runtime extra-property exclusion, unchanged physical values and borrowed vector references.
 * @evidence contracts/performance.md#efficient-algorithms Selection uses a fixed number of fields and constant auxiliary storage independently of source population.
 * @evidence contracts/performance.md#reuse-equivalent-work The operation borrows the already admitted vectors and scalar policy without recomputing observations or fitting.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned policy owns a small record and borrows axis/reference vectors; no source populations, handles or caches are retained.
 */
export function createRecoveryObservationPolicy(
  input: IAutoMovieRecoveryInput,
): Omit<IAutoMovieRecoveryInput, "verticesMm" | "triangles"> {
  return {
    axis: input.axis,
    reference: input.reference,
    stepMm: input.stepMm,
    toleranceMm: input.toleranceMm,
    chordToleranceMm: input.chordToleranceMm,
    maxSections: input.maxSections,
    maxSpans: input.maxSpans,
    exactCoordinateAliases: input.exactCoordinateAliases,
    sourceOrientationSign: input.sourceOrientationSign,
    cornerDegrees: input.cornerDegrees,
    ...(input.criticalPolicy === undefined
      ? {}
      : { criticalPolicy: input.criticalPolicy }),
  };
}
