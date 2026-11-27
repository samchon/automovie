import type { IAutoMovieRecoveryInput } from "@automovie/interface";

/*
 * Publish only the declared observation policy, never undeclared caller
 * payloads. Numerical values and vector references are retained without
 * defaults or conversion. Input objects can contain extra runtime properties
 * even when their static type is narrower; object-rest publication would
 * accidentally retain source populations.
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
