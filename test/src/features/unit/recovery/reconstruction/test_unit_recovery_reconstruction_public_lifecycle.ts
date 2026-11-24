import type {
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";
import {
  observeAutoMovieRecovery,
  reconstructAutoMovieRecoveryModel,
} from "@automovie/recovery";
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
 * 6. Undeclared caller mesh payloads never enter saved policy.
 * 7. Cancellation predicates fail on exceptions, without being called again during failure classification.
 * 8. A progress callback that requests cancellation and then throws remains failed.
 */
export function test_unit_recovery_reconstruction_public_lifecycle(): void {
  const input: Parameters<typeof observeAutoMovieRecovery>[0] = {
    verticesMm: [
      [0, 0, 0],
      [3, 0, 0],
      [3, 3, 0],
      [0, 3, 0],
      [0, 0, 3],
      [3, 0, 3],
      [3, 3, 3],
      [0, 3, 3],
    ],
    triangles: [
      [0, 2, 1],
      [0, 3, 2],
      [4, 5, 6],
      [4, 6, 7],
      [0, 1, 5],
      [0, 5, 4],
      [1, 2, 6],
      [1, 6, 5],
      [3, 7, 6],
      [3, 6, 2],
      [0, 4, 7],
      [0, 7, 3],
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
    loft: { sections: [], intervals: [], events: [], chordToleranceMm: 0.01 },
    reports: [],
    diagnostics: [],
    topologyGaps: [],
    unconsumedEvents: [],
    policy: {
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
    },
    summary: { observations: 0, spans: 0, sections: 0, events: 0, aliases: 0 },
  };
  Object.assign(input, {
    unregisteredPositions: input.verticesMm,
    unregisteredFaces: input.triangles,
  });
  const original: string = JSON.stringify(input);
  const emptyOriginal: string = JSON.stringify(empty);
  const controller: AbortController = new AbortController();
  controller.abort();
  let progress: number = 0;
  const observeProgress: () => void = (): void => {
    progress++;
  };
  const cancelledObservation: ReturnType<typeof observeAutoMovieRecovery> =
    observeAutoMovieRecovery(input, {
      cancelled: (): boolean => controller.signal.aborted,
      onProgress: observeProgress,
    });
  const cancelledReconstruction: ReturnType<
    typeof reconstructAutoMovieRecoveryModel
  > = reconstructAutoMovieRecoveryModel(empty, {
    cancelled: (): boolean => controller.signal.aborted,
    onProgress: observeProgress,
  });
  for (const result of [cancelledObservation, cancelledReconstruction]) {
    TestValidator.equals("pre-abort terminal", result.status, "cancelled");
    TestValidator.predicate(
      "cancelled operations publish no value",
      !("value" in result),
    );
    TestValidator.predicate(
      "cancellation is explained",
      result.diagnostics.length > 0,
    );
  }
  TestValidator.equals("pre-abort executes no observer", progress, 0);

  const missingContinuation: Parameters<
    typeof reconstructAutoMovieRecoveryModel
  >[0] = {
    ...empty,
    loft: { sections: [], events: [], chordToleranceMm: 0.01 },
  };
  const refused: ReturnType<typeof reconstructAutoMovieRecoveryModel> =
    reconstructAutoMovieRecoveryModel(missingContinuation, {
      onProgress: observeProgress,
    });
  TestValidator.equals(
    "missing explicit incidence refuses",
    refused.status,
    "refused",
  );
  TestValidator.predicate("refusal has no value", !("value" in refused));
  TestValidator.predicate(
    "refusal is explained",
    refused.diagnostics.length > 0,
  );
  TestValidator.equals("refusal starts no work observer", progress, 0);
  const failed: ReturnType<typeof reconstructAutoMovieRecoveryModel> =
    reconstructAutoMovieRecoveryModel(empty, {
      onProgress: (): void => {
        progress++;
        throw new Error("caller progress failed");
      },
    });
  TestValidator.equals("observer exception is failed", failed.status, "failed");
  TestValidator.predicate(
    "failed operation publishes no value",
    !("value" in failed),
  );
  TestValidator.equals("caller failure survives", failed.diagnostics, [
    "caller progress failed",
  ]);
  TestValidator.equals("failure stops after the first callback", progress, 1);

  const during: AbortController = new AbortController();
  const cancelledDuring: ReturnType<typeof reconstructAutoMovieRecoveryModel> =
    reconstructAutoMovieRecoveryModel(empty, {
      cancelled: (): boolean => during.signal.aborted,
      onProgress: (): void => {
        progress++;
        during.abort();
      },
    });
  TestValidator.equals(
    "accepted cooperative cancellation",
    cancelledDuring.status,
    "cancelled",
  );
  TestValidator.predicate(
    "cooperative cancellation publishes no value",
    !("value" in cancelledDuring),
  );
  TestValidator.equals("cancellation stops further callbacks", progress, 2);

  // Predicate failures are execution failures, not cancellation or retry requests.
  const operations: readonly ((
    options: IAutoMovieRecoveryOptions,
  ) => IAutoMovieRecoveryResult<unknown>)[] = [
    (options: IAutoMovieRecoveryOptions): IAutoMovieRecoveryResult<unknown> =>
      observeAutoMovieRecovery(input, options),
    (options: IAutoMovieRecoveryOptions): IAutoMovieRecoveryResult<unknown> =>
      reconstructAutoMovieRecoveryModel(empty, options),
  ];
  for (const run of operations) {
    for (const afterProgress of [false, true]) {
      let entered: boolean = false;
      let failures: number = 0;
      let notifications: number = 0;
      const result: IAutoMovieRecoveryResult<unknown> = run({
        cancelled: (): boolean => {
          if (!afterProgress || entered) {
            failures++;
            throw new Error("predicate failure");
          }
          return false;
        },
        onProgress: (): void => {
          entered = true;
          notifications++;
        },
      });
      TestValidator.equals(
        "predicate exception fails",
        result.status,
        "failed",
      );
      TestValidator.equals(
        "failing predicate is not re-read in catch",
        failures,
        1,
      );
      TestValidator.equals(
        "failure stops progress",
        notifications,
        afterProgress ? 1 : 0,
      );
      TestValidator.equals("predicate exception survives", result.diagnostics, [
        "predicate failure",
      ]);
      TestValidator.predicate(
        "predicate failure has no value",
        !("value" in result),
      );
    }
    let cancellation: boolean = false;
    let probes: number = 0;
    let probesAtFailure: number = 0;
    const progressFailure: IAutoMovieRecoveryResult<unknown> = run({
      cancelled: (): boolean => {
        probes++;
        return cancellation;
      },
      onProgress: (): void => {
        cancellation = true;
        probesAtFailure = probes;
        throw new Error("progress failure after cancellation request");
      },
    });
    TestValidator.equals(
      "progress exception outranks unobserved cancellation",
      progressFailure.status,
      "failed",
    );
    TestValidator.equals(
      "failure classification does not invoke predicate",
      probes,
      probesAtFailure,
    );
    TestValidator.predicate(
      "progress failure has no value",
      !("value" in progressFailure),
    );
  }

  const observed: ReturnType<typeof observeAutoMovieRecovery> =
    observeAutoMovieRecovery(input);
  TestValidator.predicate(
    "valid registered cube returns a usable observation",
    observed.status === "complete" || observed.status === "partial",
  );
  if (!("value" in observed))
    throw new Error("The valid cube returned no saved observation");
  TestValidator.predicate(
    "undeclared source populations cannot enter saved policy",
    !Object.values(observed.value.policy).some(
      (value: unknown): boolean =>
        value === input.verticesMm || value === input.triangles,
    ),
  );
  TestValidator.predicate(
    "closed cube interior produces saved closed courses",
    observed.value.loft.sections.some(
      (section: (typeof observed.value.loft.sections)[number]): boolean =>
        section.coordinateMm > 0 &&
        section.coordinateMm < 3 &&
        section.loops.length > 0,
    ),
  );
  for (const result of [
    cancelledObservation,
    cancelledReconstruction,
    refused,
    failed,
    cancelledDuring,
    observed,
  ]) {
    TestValidator.equals(
      "operator is explicit",
      result.operator,
      "legacy-contour-v1",
    );
  }
  TestValidator.equals(
    "source input is borrowed unchanged",
    JSON.stringify(input),
    original,
  );
  TestValidator.equals(
    "saved input survives non-success terminals",
    JSON.stringify(empty),
    emptyOriginal,
  );
}
