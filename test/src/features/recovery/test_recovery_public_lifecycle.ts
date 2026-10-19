import { observeAutoMovieRecovery, reconstructAutoMovieRecoveryModel } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * Public memory operations distinguish cancellation, refusal and callback failure.
 * A small registered cube exercises observation without a host or publication.
 *
 * Scenarios:
 * 1. Pre-aborted observation and reconstruction return no value or progress.
 * 2. Missing explicit continuation refuses before progress or generation.
 * 3. A caller progress exception becomes a structured failed terminal outcome.
 * 4. Cancellation accepted at a progress point returns no generated value.
 * 5. Valid cube observation retains saved courses and borrows its input unchanged.
 * 6. Unknown curve schemas refuse and undeclared caller mesh payloads never enter saved policy.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls only the public memory operations and observes terminal tags, diagnostics, value absence, callback population, retained courses and input nonmutation; cancellation or a thrown observer must not appear as successful completion.
 * @evidence contracts/testing.md#independent-expectations Caller-owned AbortController state and a literal observer error independently determine cancellation and failure. The cube has closed interior cuts, so a usable observation must retain section courses; no fitting residual, triangle snapshot or appearance oracle is inferred from this test.
 * @evidence contracts/testing.md#distinguishing-cases Separates pre-work cancellation, missing continuation or unknown-version refusal, admitted callback failure, cooperative cancellation and valid observation carrying extra caller metadata. Reconstruction geometry, local unsupported-domain preservation and physical area belong to test_recovery_source_free; Node publication and installed CLI belong to host integration.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_public_lifecycle entry owns all cases, uses resident general arrays and synchronous callbacks, and starts no process, filesystem operation, timer, renderer or native build. Its tiny cube is intended for the strict under-500-ms scenario budget; execution remains with the central validator.
 */
export function test_recovery_public_lifecycle(): void {
  const input: Parameters<typeof observeAutoMovieRecovery>[0] = {
    verticesMm: [
      [0, 0, 0], [3, 0, 0], [3, 3, 0], [0, 3, 0],
      [0, 0, 3], [3, 0, 3], [3, 3, 3], [0, 3, 3],
    ],
    triangles: [
      [0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7],
      [0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5],
      [3, 7, 6], [3, 6, 2], [0, 4, 7], [0, 7, 3],
    ],
    axis: [0, 1, 0],
    reference: [1, 0, 0],
    stepMm: 1,
    toleranceMm: 0.01,
    chordToleranceMm: 0.01,
    maxSections: 32,
    maxSpans: 32,
    exactCoordinateAliases: false,
    sourceOrientationSign: 1,
    cornerDegrees: 45,
  };
  const empty: Parameters<typeof reconstructAutoMovieRecoveryModel>[0] = {
    schema: "automovie-recovery-curves-v1",
    loft: { sections: [], intervals: [], events: [], chordToleranceMm: 0.01 },
    reports: [],
    diagnostics: [],
    topologyGaps: [],
    unconsumedEvents: [],
    policy: {
      axis: [0, 1, 0], reference: [1, 0, 0], stepMm: 1,
      toleranceMm: 0.01, chordToleranceMm: 0.01,
      maxSections: 32, maxSpans: 32, exactCoordinateAliases: false,
      sourceOrientationSign: 1, cornerDegrees: 45,
    },
    summary: { observations: 0, spans: 0, sections: 0, events: 0, aliases: 0 },
  };
  Object.assign(input, { unregisteredPositions: input.verticesMm, unregisteredFaces: input.triangles });
  const original: string = JSON.stringify(input);
  const emptyOriginal: string = JSON.stringify(empty);
  const controller: AbortController = new AbortController();
  controller.abort();
  let progress: number = 0;
  const observeProgress: () => void = (): void => { progress++; };
  const cancelledObservation: ReturnType<typeof observeAutoMovieRecovery> =
    observeAutoMovieRecovery(input, { signal: controller.signal, onProgress: observeProgress });
  const cancelledReconstruction: ReturnType<typeof reconstructAutoMovieRecoveryModel> =
    reconstructAutoMovieRecoveryModel(empty, { signal: controller.signal, onProgress: observeProgress });
  for (const result of [cancelledObservation, cancelledReconstruction]) {
    TestValidator.equals("pre-abort terminal", result.status, "cancelled");
    TestValidator.predicate("cancelled operations publish no value", !("value" in result));
    TestValidator.predicate("cancellation is explained", result.diagnostics.length > 0);
  }
  TestValidator.equals("pre-abort executes no observer", progress, 0);

  const missingContinuation: Parameters<typeof reconstructAutoMovieRecoveryModel>[0] = {
    ...empty,
    loft: { sections: [], events: [], chordToleranceMm: 0.01 },
  };
  const refused: ReturnType<typeof reconstructAutoMovieRecoveryModel> =
    reconstructAutoMovieRecoveryModel(missingContinuation, { onProgress: observeProgress });
  TestValidator.equals("missing explicit incidence refuses", refused.status, "refused");
  TestValidator.predicate("refusal has no value", !("value" in refused));
  TestValidator.predicate("refusal is explained", refused.diagnostics.length > 0);
  TestValidator.equals("refusal starts no work observer", progress, 0);
  const futureInput: typeof empty = { ...empty };
  Object.assign(futureInput, { schema: "automovie-recovery-curves-unknown" });
  const future: ReturnType<typeof reconstructAutoMovieRecoveryModel> = reconstructAutoMovieRecoveryModel(futureInput, { onProgress: observeProgress });
  TestValidator.equals("unknown saved schema refuses", future.status, "refused");
  TestValidator.predicate("unknown version creates no value or progress", !("value" in future) && progress === 0);

  const failed: ReturnType<typeof reconstructAutoMovieRecoveryModel> =
    reconstructAutoMovieRecoveryModel(empty, {
      onProgress: (): void => {
        progress++;
        throw new Error("caller progress failed");
      },
    });
  TestValidator.equals("observer exception is failed", failed.status, "failed");
  TestValidator.predicate("failed operation publishes no value", !("value" in failed));
  TestValidator.equals("caller failure survives", failed.diagnostics, ["caller progress failed"]);
  TestValidator.equals("failure stops after the first callback", progress, 1);

  const during: AbortController = new AbortController();
  const cancelledDuring: ReturnType<typeof reconstructAutoMovieRecoveryModel> =
    reconstructAutoMovieRecoveryModel(empty, {
      signal: during.signal,
      onProgress: (): void => { progress++; during.abort(); },
    });
  TestValidator.equals("accepted cooperative cancellation", cancelledDuring.status, "cancelled");
  TestValidator.predicate("cooperative cancellation publishes no value", !("value" in cancelledDuring));
  TestValidator.equals("cancellation stops further callbacks", progress, 2);

  const observed: ReturnType<typeof observeAutoMovieRecovery> = observeAutoMovieRecovery(input);
  TestValidator.predicate(
    "valid registered cube returns a usable observation",
    observed.status === "complete" || observed.status === "partial",
  );
  if (!("value" in observed))
    throw new Error("The valid cube returned no saved observation");
  TestValidator.predicate("undeclared source populations cannot enter saved policy", !Object.values(observed.value.policy).some((value: unknown): boolean => value === input.verticesMm || value === input.triangles));
  TestValidator.predicate(
    "closed cube interior produces saved closed courses",
    observed.value.loft.sections.some(
      (section: (typeof observed.value.loft.sections)[number]): boolean =>
        section.coordinateMm > 0 && section.coordinateMm < 3 && section.loops.length > 0,
    ),
  );
  for (const result of [cancelledObservation, cancelledReconstruction, refused, future, failed, cancelledDuring, observed]) {
    TestValidator.equals("operation schema is explicit", result.schema, "automovie-recovery-operation-v1");
    TestValidator.equals("operator is explicit", result.operator, "legacy-contour-v1");
  }
  TestValidator.equals("source input is borrowed unchanged", JSON.stringify(input), original);
  TestValidator.equals("saved input survives non-success terminals", JSON.stringify(empty), emptyOriginal);
}
