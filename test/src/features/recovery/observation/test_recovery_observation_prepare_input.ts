import {
  AutoMovieRecoveryObservation,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * Registered indexed triangles are prepared without conversion.
 *
 * Scenarios:
 *
 * 1. Explicit applied registration prepares a small triangle and borrows its
 *    arrays unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the applied registration and borrowed source lifetime.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares one indexed triangle and checks references, registration and coordinate preservation.
 * @evidence contracts/development/testing.md#independent-expectations The fixture supplies one explicitly registered triangle and its original geometry identities. A second transform would change those known coordinates.
 */
export function test_recovery_observation_prepare_input(): void {
  type Input = Parameters<typeof AutoMovieRecoveryObservation.prepareInput>[0];
  const makeInput: () => Input = (): Input => ({
    registration: {
      units: "mm",
      frame: "registered-triangle",
      handedness: "right-handed",
      sourceToRegistered: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 5, 6, 1],
      evaluatedPose: "fixed",
      componentPolicy: "all-evaluated",
      uncertainty: ["visibility is caller supplied"],
    },
    verticesMm: [
      [4, 5, 6],
      [7, 5, 6],
      [4, 7, 6],
    ],
    triangles: [[0, 1, 2]],
    policy: {
      axis: [0, 1, 0],
      reference: [1, 0, 0],
      stepMm: 1,
      toleranceMm: 0.01,
      chordToleranceMm: 0.01,
      maxSections: 16,
      maxSpans: 16,
      exactCoordinateAliases: false,
      sourceOrientationSign: 1,
      cornerDegrees: 45,
    },
  });
  const input: Input = makeInput();
  const original: string = JSON.stringify(input);
  const admitted: ReturnType<typeof AutoMovieRecoveryObservation.prepareInput> =
    AutoMovieRecoveryObservation.prepareInput(input);
  TestValidator.equals(
    "registered triangle admitted",
    admitted.status,
    "complete",
  );
  if (admitted.status !== "complete" && admitted.status !== "partial")
    throw new Error("Expected registered triangle admission");
  TestValidator.predicate(
    "coordinates and topology are borrowed without a second transform",
    admitted.value.observation.verticesMm === input.verticesMm &&
      admitted.value.observation.triangles === input.triangles &&
      admitted.value.registration === input.registration,
  );
  TestValidator.equals(
    "registration and geometry stay unchanged",
    JSON.stringify(input),
    original,
  );
}
