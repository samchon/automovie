import { prepareAutoMovieRecoveryInput } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * Registered indexed triangles are prepared without conversion.
 *
 * Scenarios:
 * 1. Explicit applied registration prepares a small triangle and borrows its arrays unchanged.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls public registration preparation and observes its terminal outcome, reference identity and input nonmutation.
 * @evidence contracts/development/testing.md#independent-expectations A registered triangle uses explicit finite millimetre triples and indices zero through two. Its already applied translation metadata must not transform its coordinates again.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates borrowing the declared arrays from transforming them a second time. Observation, fitting and reconstruction are separate tests; no surface-quality claim follows from preparation.
 * @evidence contracts/development/testing.md#execution-ownership The portable test_recovery_registered_input entry uses small resident arrays only, with no source file, renderer, process, global replacement or host installation.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 1 numbered scenario it runs, its sentence naming the input and the behavior it pins (first: Explicit applied registration prepares a small triangle and borrows its arrays unchanged.).
 */
export function test_recovery_registered_input(): void {
  type Input = Parameters<typeof prepareAutoMovieRecoveryInput>[0];
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
  const admitted: ReturnType<typeof prepareAutoMovieRecoveryInput> =
    prepareAutoMovieRecoveryInput(input);
  TestValidator.equals(
    "registered triangle admitted",
    admitted.status,
    "complete",
  );
  if (!("value" in admitted))
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
