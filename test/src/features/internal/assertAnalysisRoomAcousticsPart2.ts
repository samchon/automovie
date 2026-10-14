import type {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisWarning,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieAcousticRequest } from "../../../../packages/engine/src/analysis/IAutoMovieAcousticRequest";

/** Execute the next ordered assertions of test_analysis_room_acoustics.
 *
 * Scenarios:
 * 1. a source whose power overflows leaves a gap that names the overflow, not silence.
 * 2. a room with no partition, or with one that transmits nothing, gaps the composite loss.
 * 3. declared targets judge the reverberation time in its own unit.
 * 4. a target naming a metric the study never reports is stated, not dropped.
 *
 * Finite +/-4000dB values expose binary64 energy underflow/overflow rather than legitimate silent/infinitely loud answers; zero summed transmission leaves logarithmic loss undefined. The previously established 0.322s reverberation lies below 0.5s and above 0.2s, and declared key membership distinguishes an unknown target from an unsupported metric. No propagation measurement or provider output is the oracle.
 * Overflowed source power, absent/perfectly blocking partitions, passing/failing reverberation targets and unknown versus reported-but-unmeasured metric keys retain separate gaps/warnings. Part1 owns finite acoustic arithmetic and Part3 owns malformed schema decisions.
 */
export function assertAnalysisRoomAcousticsPart2(
  study: (
    overrides?: Partial<IAutoMovieAcousticRequest>,
  ) => IAutoMovieAnalysisRun,
  metrics: (run: IAutoMovieAnalysisRun) => IAutoMovieAnalysisMetric[],
  statusOf: (run: IAutoMovieAnalysisRun, key: string) => string,
): void {
  const deafening: IAutoMovieAnalysisRun = study({
    sources: [
      {
        id: "fan",
        position: { x: 0, y: 0, z: 0 },
        soundPower: 4000,
        directivity: 1,
      },
    ],
  });
  TestValidator.equals(
    "a source whose power overflows leaves a gap that names the overflow, not silence",
    {
      level: statusOf(deafening, "room.soundPressureLevel"),
      reason: metrics(deafening)
        .find(
          (metric: IAutoMovieAnalysisMetric): boolean =>
            metric.key === "room.soundPressureLevel",
        )
        ?.gap?.reason.includes("exceeds the range of double precision"),
      samples:
        deafening.outcome.status === "solved"
          ? deafening.outcome.samples
          : null,
    },
    { level: "not-run", reason: true, samples: [] },
  );

  const bare: IAutoMovieAnalysisRun = study({ partitions: [] });
  const perfect: IAutoMovieAnalysisRun = study({
    partitions: [{ id: "vault", area: 10, transmissionLoss: 4000 }],
  });
  TestValidator.equals(
    "a room with no partition, or with one that transmits nothing, gaps the composite loss",
    {
      bare: [
        statusOf(bare, "partition.compositeTransmissionLoss"),
        metrics(bare)
          .find(
            (metric: IAutoMovieAnalysisMetric): boolean =>
              metric.key === "partition.compositeTransmissionLoss",
          )
          ?.gap?.reason.includes("declares no partition"),
      ],
      perfect: [
        statusOf(perfect, "partition.compositeTransmissionLoss"),
        metrics(perfect)
          .find(
            (metric: IAutoMovieAnalysisMetric): boolean =>
              metric.key === "partition.compositeTransmissionLoss",
          )
          ?.gap?.reason.includes("transmits nothing at all"),
      ],
    },
    { bare: ["not-run", true], perfect: ["not-run", true] },
  );

  TestValidator.equals(
    "declared targets judge the reverberation time in its own unit",
    {
      met: statusOf(
        study({
          targets: [
            {
              key: "room.reverberationTime",
              unit: "s",
              value: 0.5,
              comparison: "at-most",
            },
          ],
        }),
        "room.reverberationTime",
      ),
      missed: statusOf(
        study({
          targets: [
            {
              key: "room.reverberationTime",
              unit: "s",
              value: 0.2,
              comparison: "at-most",
            },
          ],
        }),
        "room.reverberationTime",
      ),
    },
    { met: "meets", missed: "misses" },
  );

  const codesOf: (run: IAutoMovieAnalysisRun) => [string, string | null][] = (
    run: IAutoMovieAnalysisRun,
  ): [string, string | null][] =>
    run.outcome.status === "solved"
      ? run.outcome.warnings.map(
          (warning: IAutoMovieAnalysisWarning): [string, string | null] => [
            warning.code,
            warning.subject,
          ],
        )
      : [];
  const hopeful: IAutoMovieAnalysisRun = study({
    targets: [
      { key: "room.clarity", unit: "dB", value: 0, comparison: "at-least" },
      {
        key: "room.reverberationTime",
        unit: "s",
        value: 0.5,
        comparison: "at-most",
      },
    ],
  });
  // A key the study does report but could not measure is not unknown: that
  // metric already carries its own reason and reaches the report as a gap, so
  // warning about it would name the same absence twice.
  const unmeasured: IAutoMovieAnalysisRun = study({
    targets: [
      {
        key: "room.speechTransmissionIndex",
        unit: "ratio",
        value: 0.6,
        comparison: "at-least",
      },
    ],
  });
  TestValidator.equals(
    "a target naming a metric the study never reports is stated, not dropped",
    {
      unknown: codesOf(hopeful),
      // The target that does name a metric still judges it, so the warning is
      // about the unmatched key alone and not about targets in general.
      judged: statusOf(hopeful, "room.reverberationTime"),
      unmeasured: codesOf(unmeasured),
      unmeasuredStatus: statusOf(unmeasured, "room.speechTransmissionIndex"),
    },
    {
      unknown: [["target-key-unknown", "room.clarity"]],
      judged: "meets",
      unmeasured: [],
      unmeasuredStatus: "unsupported",
    },
  );
}
