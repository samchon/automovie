import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import { reduceAutoMovieInspectionEpisodes } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** An obligation that was fully checked for one sample. */
const CHECKED: IAutoMovieInspectionDiagnostics.ICoverage = {
  check: "penetration",
  key: "actor/arm+bed/frame",
  required: true,
  status: "checked",
};

/**
 * Ordered production observations retain honest evidence and required coverage.
 *
 * Scenarios:
 *
 * 1. Repeating a capture cell does not raise the sample count. Consecutive
 *    findings preserve the first observation and the strongest confirmed
 *    witness. A clear sample ends an episode.
 * 2. Concurrent shot occurrences keep separate episodes. Missing frame indices,
 *    omitted check coverage and explicit deferral break continuity.
 * 3. A between-frame witness and native timestamp keep their clocks. Sparse
 *    off-grid samples remain isolated and never gain an output frame.
 * 4. Candidate errors, confirmed warnings, authored exclusions and optional
 *    unsupported rows stay distinct from confirmed errors and missing required
 *    coverage.
 * 5. Unordered samples and conflicting repeats are refused.
 */
export function test_render_scene_reduce_inspection_episodes(): void {
  const repeated: IAutoMovieInspectionDiagnostics = frame(
    1,
    observation(99, "candidate"),
  );
  const impact: IAutoMovieInspectionDiagnostics.IAudit =
    reduceAutoMovieInspectionEpisodes(
      [
        frame(0),
        repeated,
        structuredClone(repeated),
        frame(2, observation(2)),
        frame(3, observation(2)),
        frame(4),
        frame(5, observation(4)),
      ],
      6,
    );
  TestValidator.equals(
    "one output count per repeated cell",
    impact.observedOutputFrames,
    6,
  );
  TestValidator.equals(
    "clear sample starts a separate episode",
    impact.episodes.length,
    2,
  );
  TestValidator.equals(
    "source order, evidence precedence and earlier winning tie",
    impact.episodes.map((episode: IAutoMovieInspectionDiagnostics.IEpisode) => [
      episode.first.time.outputFrame,
      episode.first.finding.confidence,
      episode.worst.time.outputFrame,
      episode.last.outputFrame,
      episode.samples,
    ]),
    [
      [1, "candidate", 2, 3, 3],
      [5, "confirmed", 5, 5, 1],
    ],
  );
  TestValidator.equals(
    "one checked range spans the known six frames",
    impact.coverage.map(coverageInterval),
    [["room/shot", "checked", 0, 5, 6]],
  );
  TestValidator.equals(
    "unaddressed film samples keep clock provenance too",
    impact.coverage[0]?.sampledShotClock,
    true,
  );
  TestValidator.equals(
    "confirmed error blocks known coverage",
    impact.hasBlockingFinding,
    true,
  );
  TestValidator.equals(
    "all declared output frames were inspected",
    impact.unresolvedRequiredCoverage,
    false,
  );

  const deferred: IAutoMovieInspectionDiagnostics.ICoverage = {
    ...CHECKED,
    status: "deferred",
    reason: "Required narrow-phase check did not run.",
  };
  const interrupted: IAutoMovieInspectionDiagnostics.IAudit =
    reduceAutoMovieInspectionEpisodes([
      frame(0, observation(1)),
      frame(0, observation(1), "other/shot"),
      frame(1, observation(2)),
      frame(1, undefined, "other/shot", [deferred]),
      frame(2, observation(3), "room/shot", []),
      frame(2, observation(4), "other/shot"),
      frame(4, observation(5)),
      frame(5, observation(6), "next/shot"),
    ]);
  TestValidator.equals(
    "overlapping shots, unchecked observations, gaps and cuts split correctly",
    interrupted.episodes.map(
      (episode: IAutoMovieInspectionDiagnostics.IEpisode) => [
        episode.scope,
        episode.first.time.outputFrame,
        episode.last.outputFrame,
        episode.samples,
      ],
    ),
    [
      ["room/shot", 0, 1, 2],
      ["other/shot", 0, 0, 1],
      ["room/shot", 2, 2, 1],
      ["other/shot", 2, 2, 1],
      ["room/shot", 4, 4, 1],
      ["next/shot", 5, 5, 1],
    ],
  );
  TestValidator.equals(
    "coverage loss and output gaps do not become checked ranges",
    interrupted.coverage.map(coverageInterval),
    [
      ["room/shot", "checked", 0, 1, 2],
      ["other/shot", "checked", 0, 0, 1],
      ["other/shot", "deferred", 1, 1, 1],
      ["other/shot", "checked", 2, 2, 1],
      ["room/shot", "checked", 4, 4, 1],
      ["next/shot", "checked", 5, 5, 1],
    ],
  );
  TestValidator.equals(
    "required deferral is visible",
    interrupted.unresolvedRequiredCoverage,
    true,
  );

  const swept: IAutoMovieInspectionDiagnostics.IFinding = {
    ...observation(2),
    witness: {
      rank: 2,
      time: { filmSeconds: 0.875, shot: { path: "room/shot", seconds: 0.375 } },
      interval: { from: 0.75, to: 0.9375 },
      point: { x: 1, y: 2, z: 3 },
      measurements: [
        { name: "pts", value: "9007199254740993", unit: "1/48000 s" },
      ],
    },
  };
  const sparse: IAutoMovieInspectionDiagnostics.IAudit =
    reduceAutoMovieInspectionEpisodes([
      { ...frame(1, swept), time: { filmSeconds: 1 } },
      { ...frame(2, observation(3)), time: { filmSeconds: 1.125 } },
    ]);
  const witness: IAutoMovieInspectionDiagnostics.IObservation =
    sparse.episodes[0]!.first;
  TestValidator.equals(
    "off-grid samples never invent adjacency or frames",
    [
      sparse.episodes.length,
      sparse.observedOutputFrames,
      witness.time.outputFrame,
    ],
    [2, 0, undefined],
  );
  TestValidator.predicate(
    "actual witness keeps film and shot clocks",
    (): boolean =>
      nclose(witness.time.filmSeconds, 0.875) &&
      nclose(witness.time.shot?.seconds ?? -1, 0.375),
  );
  TestValidator.equals(
    "native decimal value survives",
    witness.finding.witness.measurements?.[0]?.value,
    "9007199254740993",
  );

  const complete: IAutoMovieInspectionDiagnostics.IAudit =
    reduceAutoMovieInspectionEpisodes(
      [
        frame(0, observation(1, "candidate"), "room/shot", [
          CHECKED,
          {
            ...deferred,
            key: "optional corner",
            status: "unsupported",
            required: false,
          },
        ]),
        frame(1, { ...observation(2), category: "warning" }, "room/shot", [
          CHECKED,
          {
            ...deferred,
            key: "managed interior",
            status: "excluded",
            reason: "Formation owner excludes internal pairs.",
          },
        ]),
      ],
      2,
    );
  TestValidator.equals(
    "candidate, warning and explicit exclusion leave the gate clear",
    [complete.hasBlockingFinding, complete.unresolvedRequiredCoverage],
    [false, false],
  );
  const incomplete: IAutoMovieInspectionDiagnostics.IAudit =
    reduceAutoMovieInspectionEpisodes([frame(0), frame(2)], 3);
  TestValidator.equals(
    "a missing output index is unresolved even with checked samples",
    [incomplete.observedOutputFrames, incomplete.unresolvedRequiredCoverage],
    [2, true],
  );

  TestValidator.error("decreasing film seconds are refused", (): void => {
    reduceAutoMovieInspectionEpisodes([frame(1), frame(0)]);
  });
  TestValidator.error(
    "changed evidence at the same scoped sample is refused",
    (): void => {
      reduceAutoMovieInspectionEpisodes([
        frame(1, observation(1)),
        frame(1, observation(2)),
      ]);
    },
  );
  TestValidator.error(
    "one output index cannot name two film times",
    (): void => {
      reduceAutoMovieInspectionEpisodes([
        frame(1),
        {
          ...frame(1, undefined, "other/shot"),
          time: { filmSeconds: 0.5, outputFrame: 1 },
        },
      ]);
    },
  );

  const placed: IAutoMovieInspectionDiagnostics.IAudit =
    reduceAutoMovieInspectionEpisodes(
      [28, 29, 30].map(
        (outputFrame: number): IAutoMovieInspectionDiagnostics => {
          const filmSeconds: number = outputFrame / 24;
          return {
            ...frame(outputFrame, observation(1)),
            time: {
              filmSeconds,
              outputFrame,
              shot: { path: "room/shot", seconds: filmSeconds - 0.17 },
            },
          };
        },
      ),
    );
  TestValidator.equals(
    "one 24 fps shot stays compact when subtracting from its nonzero origin",
    [
      placed.coverage.map((range) => [range.samples, range.sampledShotClock]),
      placed.episodes.map((episode) => [
        episode.samples,
        episode.sampledShotClock,
      ]),
    ],
    [[[3, true]], [[3, true]]],
  );
}

/** Supply one simple output-clock sample and its penetration obligation. */
function frame(
  outputFrame: number,
  finding?: IAutoMovieInspectionDiagnostics.IFinding,
  scope: string = "room/shot",
  coverage: readonly IAutoMovieInspectionDiagnostics.ICoverage[] = [CHECKED],
): IAutoMovieInspectionDiagnostics {
  return {
    scope,
    time: { filmSeconds: outputFrame / 4, outputFrame },
    findings: finding === undefined ? [] : [finding],
    coverage,
  };
}

/** Supply one observation of the same canonical part pair. */
function observation(
  rank: number,
  confidence: IAutoMovieInspectionDiagnostics.IFinding["confidence"] = "confirmed",
): IAutoMovieInspectionDiagnostics.IFinding {
  return {
    check: CHECKED.check,
    key: CHECKED.key,
    code: "scene.penetration",
    paths: ["actor/arm", "bed/frame"],
    category: "error",
    confidence,
    message: "The arm passes into the bed frame.",
    witness: { rank },
  };
}

/** Read the coverage interval's identity and observed frame count. */
function coverageInterval(
  range: IAutoMovieInspectionDiagnostics.ICoverageRange,
): readonly [string, string, number | undefined, number | undefined, number] {
  return [
    range.scope,
    range.coverage.status,
    range.first.outputFrame,
    range.last.outputFrame,
    range.samples,
  ];
}
