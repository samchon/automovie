import { prepareAutoMovieRecoveryInput } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * Registered indexed-triangle admission checks dense physical data without conversion.
 *
 * Scenarios:
 * 1. Explicit applied registration admits a small triangle and borrows its arrays unchanged.
 * 2. Sparse applied matrices, coordinate tuples, face tuples and outer arrays refuse.
 * 3. Invalid indices, nonfinite values, metadata types and unknown registration versions refuse.
 * 4. A JSON null input returns refusal without escaping the public operation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public registration admission and observes terminal outcomes, diagnostics, reference identity and input nonmutation. Deleting an own array slot must not bypass finite or index checks through sparse-array iteration.
 * @evidence contracts/testing.md#independent-expectations A registered triangle uses explicit finite millimetre triples and indices zero through two. Its already applied translation metadata must not transform its coordinates again; a missing slot, invalid address or unknown version cannot supply that physical record.
 * @evidence contracts/testing.md#distinguishing-cases Covers valid borrowing, sparse matrix/tuple/outer populations, nonfinite and out-of-range numbers, malformed string metadata and an unknown schema. Observation, fitting and reconstruction are separate tests; no surface-quality claim follows from admission.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_registered_input entry uses small resident arrays and own-record mutations only, with no source file, renderer, process, global replacement or host installation.
 */
export function test_recovery_registered_input(): void {
  type Input = Parameters<typeof prepareAutoMovieRecoveryInput>[0];
  const makeInput: () => Input = (): Input => ({
    registration: {
      schema: "automovie-recovery-registration-v1", units: "mm", frame: "registered-triangle",
      handedness: "right-handed", sourceToRegistered: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 5, 6, 1],
      evaluatedPose: "fixed", componentPolicy: "all-evaluated", uncertainty: ["visibility is caller supplied"],
    },
    verticesMm: [[4, 5, 6], [7, 5, 6], [4, 7, 6]], triangles: [[0, 1, 2]],
    policy: { axis: [0, 1, 0], reference: [1, 0, 0], stepMm: 1, toleranceMm: 0.01,
      chordToleranceMm: 0.01, maxSections: 16, maxSpans: 16, exactCoordinateAliases: false,
      sourceOrientationSign: 1, cornerDegrees: 45 },
  });
  const input: Input = makeInput();
  const original: string = JSON.stringify(input);
  const admitted: ReturnType<typeof prepareAutoMovieRecoveryInput> = prepareAutoMovieRecoveryInput(input);
  TestValidator.equals("registered triangle admitted", admitted.status, "complete");
  if (!("value" in admitted)) throw new Error("Expected registered triangle admission");
  TestValidator.predicate("coordinates and topology are borrowed without a second transform", admitted.value.observation.verticesMm === input.verticesMm && admitted.value.observation.triangles === input.triangles && admitted.value.registration === input.registration);
  TestValidator.equals("registration and geometry stay unchanged", JSON.stringify(input), original);
  const variants: Input[] = [];
  for (const target of ["matrix", "point", "face", "vertices", "triangles", "uncertainty"] as const) {
    const malformed: Input = makeInput();
    const array: unknown[] = target === "matrix" ? malformed.registration.sourceToRegistered
      : target === "point" ? malformed.verticesMm[0]!
      : target === "face" ? malformed.triangles[0]!
      : target === "vertices" ? malformed.verticesMm
      : target === "triangles" ? malformed.triangles : malformed.registration.uncertainty;
    Reflect.deleteProperty(array, "0");
    variants.push(malformed);
  }
  const invalidIndex: Input = makeInput(); invalidIndex.triangles[0]![2] = 3; variants.push(invalidIndex);
  const nonfinite: Input = makeInput(); nonfinite.verticesMm[0]![0] = Infinity; variants.push(nonfinite);
  const wrongFrame: Input = makeInput(); Object.assign(wrongFrame.registration, { frame: 42 }); variants.push(wrongFrame);
  const wrongVersion: Input = makeInput(); Object.assign(wrongVersion.registration, { schema: "unknown-registration" }); variants.push(wrongVersion);
  variants.push(JSON.parse("null"));
  for (const malformed of variants) {
    const result: ReturnType<typeof prepareAutoMovieRecoveryInput> = prepareAutoMovieRecoveryInput(malformed);
    TestValidator.equals("invalid registered representation refuses", result.status, "refused");
    TestValidator.predicate("refusal has no value and explains admission", !("value" in result) && result.diagnostics.length > 0);
  }
}
