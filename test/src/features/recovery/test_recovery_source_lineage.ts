import {
  type IAutoMovieRecoverySourceLineage,
  observeAutoMovieRecovery,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * Acquisition lineage preserves original face ordinals without entering source-free geometry.
 *
 * Scenarios:
 * 1. An interior tetrahedron cut identifies the three original side faces and its published closed curve.
 * 2. An open triangle identifies its published open report, while exhausted fitting reports a failed contour.
 * 3. Mutating a delivered face-ID copy leaves subsequent observation and source arrays unchanged.
 * 4. A thrown callback fails the whole operation; callback-triggered and prior cancellation publish no value.
 * 5. A nonfunction lineage observer is refused before progress.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises public observation with and without lineage, checks original source ordinals and publication addresses, observes open and failed contour delivery, and checks error and cancellation terminal states.
 * @evidence contracts/testing.md#independent-expectations A tetrahedron's face 2 lies entirely at Y=0, while faces 0, 1 and 3 meet every interior horizontal cut. A single triangle has one open interior intersection. These authored incidence facts define expected lineage independently of extraction; matching enabled and disabled coefficient values verifies observational noninterference rather than source fidelity.
 * @evidence contracts/testing.md#distinguishing-cases Separates closed, open and failed local contours; face-copy mutation, observer throw, cooperative abort, pre-abort and malformed callback distinguish source lifetime and terminal outcomes. Exact contact geometry and fitting accuracy remain owned by existing recovery observation tests.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_source_lineage entry uses tiny generic CPU meshes and synchronous callbacks, starts no process or renderer, and consumes no Human data. The central runner owns execution.
 */
export function test_recovery_source_lineage(): void {
  const input: Parameters<typeof observeAutoMovieRecovery>[0] = {
    verticesMm: [
      [0, 0, 0],
      [3, 0, 0],
      [0, 0, 3],
      [0, 3, 0],
    ],
    triangles: [
      [0, 3, 1],
      [0, 2, 3],
      [0, 1, 2],
      [1, 3, 2],
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
  const before: string = JSON.stringify(input);
  const baseline: ReturnType<typeof observeAutoMovieRecovery> =
    observeAutoMovieRecovery(input);
  const records: IAutoMovieRecoverySourceLineage[] = [];
  const observed: ReturnType<typeof observeAutoMovieRecovery> =
    observeAutoMovieRecovery(input, {
      onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
        records.push({
          ...record,
          sourceTriangleIds: [...record.sourceTriangleIds],
        });
        (record.sourceTriangleIds as number[]).fill(-1);
      },
    });
  if (!("value" in baseline) || !("value" in observed))
    throw new Error(
      "Generic tetrahedron observation must publish coefficients",
    );
  TestValidator.equals(
    "observer leaves source-free result unchanged",
    JSON.stringify(observed.value),
    JSON.stringify(baseline.value),
  );
  TestValidator.equals(
    "source arrays remain unchanged",
    JSON.stringify(input),
    before,
  );
  const interior: IAutoMovieRecoverySourceLineage[] = records.filter(
    (record: IAutoMovieRecoverySourceLineage): boolean =>
      record.coordinateMm > 0 && record.coordinateMm < 3,
  );
  TestValidator.predicate("interior cuts deliver lineage", interior.length > 0);
  for (const record of interior) {
    TestValidator.equals(
      "original side ordinals survive",
      [...record.sourceTriangleIds].sort(
        (a: number, b: number): number => a - b,
      ),
      [0, 1, 3],
    );
    TestValidator.equals(
      "interior cut is closed",
      record.publication.kind,
      "closed",
    );
    if (record.publication.kind !== "closed")
      throw new Error("Closed tetrahedron cut expected");
    const section: (typeof observed.value.loft.sections)[number] | undefined =
      observed.value.loft.sections.find(
        (candidate: (typeof observed.value.loft.sections)[number]): boolean =>
          candidate.coordinateMm === record.coordinateMm,
      );
    TestValidator.equals(
      "lineage names its published curve",
      section?.loops[record.publication.loopIndex]?.curve.name,
      record.publication.curveName,
    );
  }
  const open: Parameters<typeof observeAutoMovieRecovery>[0] = {
    ...input,
    verticesMm: [
      [0, 0, 0],
      [3, 0, 0],
      [0, 3, 0],
    ],
    triangles: [[0, 1, 2]],
  };
  const openRecords: IAutoMovieRecoverySourceLineage[] = [];
  const opened: ReturnType<typeof observeAutoMovieRecovery> =
    observeAutoMovieRecovery(open, {
      onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
        openRecords.push(record);
      },
    });
  if (!("value" in opened))
    throw new Error("Open triangle must retain its partial observation");
  TestValidator.predicate(
    "open contours deliver lineage",
    openRecords.some(
      (record: IAutoMovieRecoverySourceLineage): boolean =>
        record.publication.kind === "open",
    ),
  );
  for (const record of openRecords) {
    if (record.publication.kind !== "open") continue;
    TestValidator.equals(
      "open source face ordinal",
      record.sourceTriangleIds,
      [0],
    );
    const report: (typeof opened.value.reports)[number] | undefined =
      opened.value.reports.find(
        (candidate: (typeof opened.value.reports)[number]): boolean =>
          candidate.coordinateMm === record.coordinateMm,
      );
    TestValidator.equals(
      "lineage names its open report",
      report?.open[record.publication.reportIndex]?.curve.name,
      record.publication.curveName,
    );
  }
  const failedRecords: IAutoMovieRecoverySourceLineage[] = [];
  observeAutoMovieRecovery(
    { ...input, maxSpans: 1 },
    {
      onSourceLineage: (record: IAutoMovieRecoverySourceLineage): void => {
        failedRecords.push(record);
      },
    },
  );
  TestValidator.predicate(
    "local fitting failure retains lineage",
    failedRecords.some(
      (record: IAutoMovieRecoverySourceLineage): boolean =>
        record.publication.kind === "failed" &&
        record.publication.diagnostic.length > 0,
    ),
  );
  let delivered: number = 0;
  const failed: ReturnType<typeof observeAutoMovieRecovery> =
    observeAutoMovieRecovery(input, {
      onSourceLineage: (): void => {
        delivered++;
        throw new Error("lineage observer failed");
      },
    });
  TestValidator.equals(
    "callback exception fails observation",
    failed.status,
    "failed",
  );
  TestValidator.equals(
    "observer exception remains visible",
    failed.diagnostics,
    ["lineage observer failed"],
  );
  TestValidator.equals("failed callback stops delivery", delivered, 1);
  TestValidator.predicate(
    "failed observer publishes no value",
    !("value" in failed),
  );
  const during: AbortController = new AbortController();
  const cancelled: ReturnType<typeof observeAutoMovieRecovery> =
    observeAutoMovieRecovery(input, {
      signal: during.signal,
      onSourceLineage: (): void => {
        delivered++;
        during.abort();
      },
    });
  TestValidator.equals(
    "callback abort cancels observation",
    cancelled.status,
    "cancelled",
  );
  TestValidator.equals("abort stops further delivery", delivered, 2);
  TestValidator.predicate(
    "cancelled observation publishes no value",
    !("value" in cancelled),
  );
  const preaborted: ReturnType<typeof observeAutoMovieRecovery> =
    observeAutoMovieRecovery(input, {
      signal: during.signal,
      onSourceLineage: (): void => {
        delivered++;
      },
    });
  TestValidator.equals(
    "pre-abort preserves cancellation",
    preaborted.status,
    "cancelled",
  );
  TestValidator.equals("pre-abort delivers no lineage", delivered, 2);
  let progress: number = 0;
  const refused: ReturnType<typeof observeAutoMovieRecovery> =
    observeAutoMovieRecovery(input, {
      onSourceLineage: 1 as unknown as (
        record: IAutoMovieRecoverySourceLineage,
      ) => void,
      onProgress: (): void => {
        progress++;
      },
    });
  TestValidator.equals(
    "nonfunction observer refused",
    refused.status,
    "refused",
  );
  TestValidator.equals("invalid observer starts no work", progress, 0);
}
