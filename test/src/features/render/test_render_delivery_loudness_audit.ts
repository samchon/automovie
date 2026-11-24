import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";
import { auditAutoMovieDeliveryContent } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/** The audit's input. */
type Audit = IAutoMovieDeliveryContentAudit.IProps;

/** One finding of the audit. */
type Finding = IAutoMovieDeliveryContentAudit.Finding;

/**
 * The delivery audit checks the decoded audio's measured loudness and true peak
 * against the commissioned targets.
 *
 * Scenarios:
 *
 * 1. At a −23 LUFS target with a 0.5 LU tolerance and a −1 dBTP limit, a delivered
 *    file at −24.2 LUFS misses by 1.2 LU and blocks with a loudness finding
 *    that carries the measured value.
 * 2. A delivered file at −23.2 LUFS with a −3 dBTP true peak passes.
 * 3. A delivered true peak of −0.3 dBTP exceeds −1 dBTP and blocks with a
 *    true-peak finding.
 * 4. A decoded stream with no loudness measurement blocks when targets apply, and
 *    the same stream without targets passes with no loudness finding.
 * 5. Targets with a negative tolerance are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the worked delivered measurements, the targets and the expected findings.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported pure audit with decoded audio evidence and asserts its findings and verdicts. An audit that ignores the tolerance, compares sample peak or skips an unmeasured stream gives a different verdict.
 * @evidence contracts/development/testing.md#independent-expectations Values are the worked cases of #4053 and EBU R 128's −23 LUFS, ±0.5 LU and −1 dBTP; the expected miss is the arithmetic distance from the target.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a miss beyond the tolerance, a pass inside it, a true peak over the limit, an absent measurement with and without targets, and malformed targets; the measurement itself belongs to `test_engine_sound_loudness_meter` and the decode to the CLI tests.
 * @evidence contracts/development/testing.md#execution-ownership Uses in-memory inputs and starts no process, browser, renderer or device.
 */
export function test_render_delivery_loudness_audit(): void {
  const targets: NonNullable<Audit["expected"]["loudness"]> = {
    integratedLufs: -23,
    toleranceLu: 0.5,
    maximumTruePeakDbtp: -1,
  };
  const props: (
    loudness:
      | { integratedLufs: number | null; truePeakDbtp: number | null }
      | undefined,
    expected?: Audit["expected"]["loudness"] | null,
  ) => Audit = (
    loudness:
      | { integratedLufs: number | null; truePeakDbtp: number | null }
      | undefined,
    // Null states no targets; an omitted argument takes the default ones.
    expected: Audit["expected"]["loudness"] | null = targets,
  ): Audit => ({
    source: { file: "film.partial.mp4", sha256: "ad".repeat(32) },
    expected: {
      frameCount: 30,
      frameRate: [30, 1],
      audioRequired: true,
      ...(expected === null ? {} : { loudness: expected }),
    },
    thresholds: {
      black: {
        minimumDuration: { ticks: 1, timeBase: [1, 5] },
        minimumPictureRatio: 0.98,
        maximumPixelThreshold: 0.1,
      },
      frozen: {
        minimumDuration: { ticks: 1, timeBase: [1, 2] },
        maximumMeanDifference: 0.001,
      },
      silence: {
        minimumDuration: { ticks: 1, timeBase: [1, 2] },
        maximumAmplitude: 0.001,
      },
    },
    streams: {
      video: {
        status: "decoded",
        index: 0,
        start: { ticks: 0, timeBase: [1, 30] },
        end: { ticks: 30, timeBase: [1, 30] },
        continuous: true,
        observations: [],
      },
      audio: {
        status: "decoded",
        index: 1,
        start: { ticks: 0, timeBase: [1, 48_000] },
        end: { ticks: 48_000, timeBase: [1, 48_000] },
        sampleRate: 48_000,
        continuous: true,
        observations: [],
        ...(loudness === undefined ? {} : { loudness }),
      },
    },
  });
  const kinds: (findings: readonly Finding[]) => string[] = (
    findings: readonly Finding[],
  ): string[] => findings.map((finding: Finding): string => finding.kind);

  const quiet: IAutoMovieDeliveryContentAudit.IResult =
    auditAutoMovieDeliveryContent(
      props({ integratedLufs: -24.2, truePeakDbtp: -3 }),
    );
  const miss: Finding | undefined = quiet.findings[0];
  TestValidator.predicate(
    "−24.2 LUFS misses −23 by 1.2 LU and blocks",
    quiet.passed === false &&
      quiet.findings.length === 1 &&
      miss?.kind === "loudness" &&
      miss.blocking &&
      miss.measuredLufs === -24.2 &&
      miss.targetLufs === -23 &&
      miss.toleranceLu === 0.5 &&
      miss.reason.includes("1.20 LU"),
  );

  const near: IAutoMovieDeliveryContentAudit.IResult =
    auditAutoMovieDeliveryContent(
      props({ integratedLufs: -23.2, truePeakDbtp: -3 }),
    );
  TestValidator.equals(
    "−23.2 LUFS passes",
    [near.passed, kinds(near.findings)],
    [true, []],
  );

  const hot: IAutoMovieDeliveryContentAudit.IResult =
    auditAutoMovieDeliveryContent(
      props({ integratedLufs: -23, truePeakDbtp: -0.3 }),
    );
  const over: Finding | undefined = hot.findings[0];
  TestValidator.predicate(
    "−0.3 dBTP exceeds −1 dBTP and blocks",
    hot.passed === false &&
      hot.findings.length === 1 &&
      over?.kind === "true-peak" &&
      over.measuredDbtp === -0.3 &&
      over.maximumDbtp === -1,
  );

  const unmeasured: IAutoMovieDeliveryContentAudit.IResult =
    auditAutoMovieDeliveryContent(props(undefined));
  const unchecked: IAutoMovieDeliveryContentAudit.IResult =
    auditAutoMovieDeliveryContent(props(undefined, null));
  TestValidator.equals(
    "an unmeasured stream blocks only when targets apply",
    [
      unmeasured.passed,
      kinds(unmeasured.findings),
      unchecked.passed,
      kinds(unchecked.findings),
    ],
    [false, ["loudness"], true, []],
  );

  TestValidator.predicate(
    "a negative tolerance is refused",
    (() => {
      try {
        auditAutoMovieDeliveryContent(
          props(
            { integratedLufs: -23, truePeakDbtp: -3 },
            { ...targets, toleranceLu: -1 },
          ),
        );
        return false;
      } catch (error) {
        return error instanceof Error && error.message.includes("loudness");
      }
    })(),
  );
}
