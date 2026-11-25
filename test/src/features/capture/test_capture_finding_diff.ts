import type {
  IAutoMovieCaptureCell,
  IAutoMovieCaptureDrawing,
  IAutoMovieCaptureFindingDiff,
  IAutoMovieCapturePlan,
  IAutoMovieCaptureRecord,
  IAutoMovieCaptureSubject,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";
import {
  AutoMovieCaptureFolder,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  runAutoMovieCapture,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createCaptureMemory } from "./createCaptureMemory";

/** A subject of four seconds at 10 fps, drawn 32 by 18. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "s",
  durationSeconds: 4,
  fps: 10,
  width: 32,
  height: 18,
  views: [],
  drawables: [],
  marks: [],
};

/** What one sample reports: its findings and the coverage of its obligations. */
type ISample = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;

/**
 * A capture compared with an earlier round diffs the two rounds' recorded
 * findings and decides the round outcome from its errors.
 *
 * Scenarios:
 *
 * 1. An earlier confirmed error gone while its obligation is still checked at its
 *    second is `fixed`, and the outcome is `better`.
 * 2. One identity at rank 0.02 and then 0.05 is `carried` and `worse`, and the
 *    outcome is `worse`.
 * 3. A candidate at rank 0.5 that becomes confirmed at rank 0.1 is `worse`,
 *    because confidence orders before rank.
 * 4. An identity without a rank and then with rank 0.01 is `worse`, because an
 *    absent rank orders below any present one.
 * 5. A finding absent because this round deferred its obligation is `unmatched`
 *    with cause `deferred`, and the outcome is `same`, not `better`.
 * 6. A finding absent because this round sampled only another second is
 *    `unmatched` with cause `not-sampled`.
 * 7. One error fixed and another unmatched gives the outcome `same`.
 * 8. An error at a second the earlier round also checked, with no earlier finding,
 *    is `new`, and the outcome is `worse`.
 * 9. A new warning with no change in errors is listed as `new` and leaves the
 *    outcome `same`.
 * 10. Two episodes of one identity, at 1 s and 2 s with ranks 0.1 and 0.3, give one
 *     entry at the rank 0.3 observation.
 * 11. An earlier record without diagnostics gives no finding diff and names the
 *     earlier round as lacking them.
 * 12. Two observations of one identity at disjoint times are unmatched and keep
 *     both observations.
 * 13. Rechecking only the milder of two earlier episodes is unmatched.
 * 14. A real improvement is kept, but a carried error with deferred coverage
 *     prevents the round from counting as better.
 * 15. A finding at the same film second in a different occurrence gives two
 *     unmatched entries.
 * 16. A rebuilt round that covers both moments still needs the earlier round to
 *     have observed the rebuilt finding's interval.
 * 17. Equal ranks at the same checked sample leave the finding unchanged.
 * 18. A slower capture checks the same time bounds as a faster one but omits its
 *     failing sample. Carried, fixed and new classifications all need that
 *     sample, while a shared exact second and a same-grid interior sample
 *     remain comparable.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs real rounds through the public planner, folder and run against in-memory storage with drawn cells that supply diagnostics packets, and reads the diff from the completed comparison. It observes comparison of recorded witnesses instead of calculating the result in the test harness.
 * @evidence contracts/development/testing.md#independent-expectations Every finding, rank and coverage row is chosen here, so each state follows from the severity order and which seconds each round actually checks. A 2 fps capture of 0 s to 1 s observes 0 s, 0.5 s and 1 s. It cannot decide an error at 0.1 s on the 10 fps grid.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts missing with checked observations, comparable with disjoint, partially checked and changed occurrences, and missed frames inside matching time bounds with points and spans actually checked on the matching grid. It also covers confidence order, missing rank, warnings and an absent audit. Pixel pairing is owned by `test_capture_round_comparison` and episode grouping by `test_inspection_diagnostic_episodes`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_finding_diff`; it draws in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario, its input and the state or outcome it pins.
 */
export async function test_capture_finding_diff(): Promise<void> {
  const memory: createCaptureMemory.IMemory = createCaptureMemory();
  const pixels: Uint8ClampedArray = new Uint8ClampedArray(32 * 18 * 4).fill(
    128,
  );
  const capture: (
    text: string,
    sample: ((seconds: number) => ISample) | null,
    scope?: string,
    fps?: number,
    shotSeconds?: (seconds: number) => number,
  ) => Promise<IAutoMovieCaptureFindingDiff | undefined> = async (
    text: string,
    sample: ((seconds: number) => ISample) | null,
    scope: string = "shot",
    fps: number = SUBJECT.fps,
    shotSeconds?: (seconds: number) => number,
  ): Promise<IAutoMovieCaptureFindingDiff | undefined> => {
    const plan: IAutoMovieCapturePlan = planAutoMovieCapture({
      request: parseAutoMovieCapturePlanRequest(new URLSearchParams(text)),
      subject: { ...SUBJECT, fps },
      cuts: [],
    });
    const record: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
      await runAutoMovieCapture({
        plan,
        draw: async (
          cell: IAutoMovieCaptureCell,
        ): Promise<IAutoMovieCaptureDrawing> => ({
          picture: { width: 32, height: 18, pixels: pixels.slice() },
          labels: [],
          backend: "cpu",
          ...(sample === null
            ? {}
            : {
                diagnostics: {
                  scope,
                  time: {
                    filmSeconds: cell.time.seconds,
                    ...(shotSeconds === undefined
                      ? {}
                      : {
                          shot: {
                            path: scope,
                            seconds: shotSeconds(cell.time.seconds),
                          },
                        }),
                  },
                  ...sample(cell.time.seconds),
                },
              }),
        }),
        folder: await AutoMovieCaptureFolder.open({
          storage: memory.storage,
          root: "out",
          round: plan.request.round,
          compare: plan.request.compare,
        }),
        revision: "r",
        match: "cell",
      });
    return record.comparison?.findings;
  };
  const finding: (
    key: string,
    rank?: number,
    confidence?: "candidate" | "confirmed",
    category?: "error" | "warning",
  ) => IAutoMovieInspectionDiagnostics.IFinding = (
    key: string,
    rank?: number,
    confidence: "candidate" | "confirmed" = "confirmed",
    category: "error" | "warning" = "error",
  ): IAutoMovieInspectionDiagnostics.IFinding => ({
    check: "probe",
    key,
    code: `probe-${key}`,
    paths: [key],
    category,
    confidence,
    message: `probe ${key}`,
    witness: rank === undefined ? {} : { rank },
  });
  const row: (
    key: string,
    status?: "checked" | "deferred",
  ) => IAutoMovieInspectionDiagnostics.ICoverage = (
    key: string,
    status: "checked" | "deferred" = "checked",
  ): IAutoMovieInspectionDiagnostics.ICoverage =>
    status === "checked"
      ? { check: "probe", key, required: true, status }
      : { check: "probe", key, required: true, status, reason: "budget" };
  const fixed: (
    findings: IAutoMovieInspectionDiagnostics.IFinding[],
    coverage: IAutoMovieInspectionDiagnostics.ICoverage[],
  ) => (seconds: number) => ISample =
    (
      findings: IAutoMovieInspectionDiagnostics.IFinding[],
      coverage: IAutoMovieInspectionDiagnostics.ICoverage[],
    ): ((seconds: number) => ISample) =>
    (): ISample => ({ findings, coverage });
  const states: (
    diff: IAutoMovieCaptureFindingDiff | undefined,
  ) => [string, string[]] | null = (
    diff: IAutoMovieCaptureFindingDiff | undefined,
  ): [string, string[]] | null =>
    diff?.state === "compared"
      ? [
          diff.outcome,
          diff.entries.map(
            (entry: IAutoMovieCaptureFindingDiff.IEntry): string =>
              `${entry.key}:${entry.state}${
                entry.state === "carried"
                  ? `:${entry.change}`
                  : entry.state === "unmatched"
                    ? `:${entry.cause}`
                    : ""
              }`,
          ),
        ]
      : null;

  // 1. A fixed error.
  await capture("at=1&round=f1", fixed([finding("a")], [row("a")]));
  TestValidator.equals(
    "a gone error still checked is fixed",
    states(await capture("at=1&round=f2&compare=f1", fixed([], [row("a")]))),
    ["better", ["a:fixed"]],
  );

  // 2. A deeper rank.
  await capture("at=1&round=w1", fixed([finding("a", 0.02)], [row("a")]));
  TestValidator.equals(
    "a deeper rank is carried worse",
    states(
      await capture(
        "at=1&round=w2&compare=w1",
        fixed([finding("a", 0.05)], [row("a")]),
      ),
    ),
    ["worse", ["a:carried:worse"]],
  );

  // 3. Confidence before rank.
  await capture(
    "at=1&round=c1",
    fixed([finding("a", 0.5, "candidate")], [row("a")]),
  );
  TestValidator.equals(
    "a confirmed finding at a lower rank is worse than a candidate",
    states(
      await capture(
        "at=1&round=c2&compare=c1",
        fixed([finding("a", 0.1)], [row("a")]),
      ),
    ),
    ["worse", ["a:carried:worse"]],
  );

  // 4. An absent rank.
  await capture("at=1&round=n1", fixed([finding("a")], [row("a")]));
  TestValidator.equals(
    "a rank that appears is worse than none",
    states(
      await capture(
        "at=1&round=n2&compare=n1",
        fixed([finding("a", 0.01)], [row("a")]),
      ),
    ),
    ["worse", ["a:carried:worse"]],
  );

  // 5. A deferred obligation.
  await capture("at=1&round=d1", fixed([finding("a")], [row("a")]));
  TestValidator.equals(
    "an absence under deferred coverage is unmatched",
    states(
      await capture(
        "at=1&round=d2&compare=d1",
        fixed([], [row("a", "deferred")]),
      ),
    ),
    ["same", ["a:unmatched:deferred"]],
  );

  // 6. An unsampled second.
  await capture("at=1&round=s1", fixed([finding("a")], [row("a")]));
  TestValidator.equals(
    "an absence at an unsampled second is unmatched",
    states(await capture("at=2&round=s2&compare=s1", fixed([], [row("a")]))),
    ["same", ["a:unmatched:not-sampled"]],
  );

  // 7. One fixed and one unmatched error.
  await capture(
    "at=1&round=m1",
    fixed([finding("a"), finding("b")], [row("a"), row("b")]),
  );
  TestValidator.equals(
    "an unmatched error keeps a fix from making the round better",
    states(
      await capture(
        "at=1&round=m2&compare=m1",
        fixed([], [row("a"), row("b", "deferred")]),
      ),
    ),
    ["same", ["a:fixed", "b:unmatched:deferred"]],
  );

  // 8. A new error.
  await capture("at=1&round=e1", fixed([], [row("a")]));
  TestValidator.equals(
    "an error where the earlier round checked and found none is new",
    states(
      await capture(
        "at=1&round=e2&compare=e1",
        fixed([finding("a")], [row("a")]),
      ),
    ),
    ["worse", ["a:new"]],
  );

  // 9. A new warning.
  await capture("at=1&round=v1", fixed([], [row("v")]));
  TestValidator.equals(
    "a new warning leaves the outcome unchanged",
    states(
      await capture(
        "at=1&round=v2&compare=v1",
        fixed([finding("v", 0.1, "confirmed", "warning")], [row("v")]),
      ),
    ),
    ["same", ["v:new"]],
  );

  // 10. Two episodes of one identity.
  await capture(
    "at=1,2&round=p1",
    (seconds: number): ISample => ({
      findings: [finding("a", seconds === 1 ? 0.1 : 0.3)],
      coverage: [row("a")],
    }),
  );
  const split: IAutoMovieCaptureFindingDiff | undefined = await capture(
    "at=1,2&round=p2&compare=p1",
    fixed([finding("a", 0.2)], [row("a")]),
  );
  TestValidator.equals(
    "two episodes give one entry at the worse observation",
    split?.state === "compared"
      ? split.entries.map(
          (entry: IAutoMovieCaptureFindingDiff.IEntry): unknown[] => [
            entry.state,
            entry.state === "carried" ? entry.change : null,
            entry.earlier?.finding.witness.rank,
            entry.earlier?.time.filmSeconds,
          ],
        )
      : null,
    [["carried", "better", 0.3, 2]],
  );

  // 11. An earlier record without diagnostics.
  await capture("at=1&round=o1", null);
  TestValidator.equals(
    "a record without diagnostics omits the diff and names it",
    await capture("at=1&round=o2&compare=o1", fixed([], [row("a")])),
    { state: "omitted", lacking: ["earlier"] },
  );

  // 12. A lower rank at a different time is not a measured improvement.
  await capture("at=1&round=t1", fixed([finding("a", 0.3)], [row("a")]));
  const disjoint: IAutoMovieCaptureFindingDiff | undefined = await capture(
    "at=2&round=t2&compare=t1",
    fixed([finding("a", 0.1)], [row("a")]),
  );
  TestValidator.equals(
    "carried observations at disjoint times are unmatched",
    states(disjoint),
    ["same", ["a:unmatched:not-sampled"]],
  );
  const unmatched: IAutoMovieCaptureFindingDiff.IEntry | undefined =
    disjoint?.state === "compared" ? disjoint.entries[0] : undefined;
  TestValidator.equals(
    "both observations remain available",
    [
      unmatched?.earlier?.time.filmSeconds,
      unmatched?.current?.time.filmSeconds,
    ],
    [1, 2],
  );

  // 13. A common sample cannot establish what happened at an omitted episode.
  const partial: IAutoMovieCaptureFindingDiff | undefined = await capture(
    "at=1&round=p3&compare=p1",
    fixed([finding("a", 0.05)], [row("a")]),
  );
  TestValidator.equals(
    "omitting the earlier worst episode does not improve the round",
    states(partial),
    ["same", ["a:unmatched:not-sampled"]],
  );
  const omittedWorst: IAutoMovieCaptureFindingDiff.IEntry | undefined =
    partial?.state === "compared" ? partial.entries[0] : undefined;
  TestValidator.equals(
    "the omitted earlier witness still points at two seconds",
    omittedWorst?.earlier?.time.filmSeconds,
    2,
  );

  // 14. Returning a finding in a deferred sample does not check its obligation.
  await capture(
    "at=1&round=q1",
    fixed([finding("a", 0.3), finding("b", 0.3)], [row("a"), row("b")]),
  );
  TestValidator.equals(
    "a deferred carried error prevents an otherwise real improvement",
    states(
      await capture(
        "at=1&round=q2&compare=q1",
        fixed(
          [finding("a", 0.1), finding("b", 0.1)],
          [row("a"), row("b", "deferred")],
        ),
      ),
    ),
    ["same", ["a:carried:better", "b:unmatched:deferred"]],
  );

  // 15. Equal film seconds in different occurrences cannot establish coverage.
  TestValidator.equals(
    "an occurrence change leaves both observations unmatched",
    states(
      await capture(
        "at=1&round=t3&compare=t1",
        fixed([finding("a", 0.1)], [row("a")]),
        "another-shot",
      ),
    ),
    ["same", ["a:unmatched:not-sampled", "a:unmatched:not-sampled"]],
  );

  // 16. The old round must also cover the moments this round observed.
  TestValidator.equals(
    "earlier coverage is required even when the rebuilt round covered both moments",
    states(
      await capture(
        "at=1,2&round=t4&compare=t1",
        (seconds: number): ISample => ({
          findings: seconds === 2 ? [finding("a", 0.1)] : [],
          coverage: [row("a")],
        }),
      ),
    ),
    ["same", ["a:unmatched:not-sampled"]],
  );

  // 17. The same checked rank does not change the round.
  TestValidator.equals(
    "equal ranks at the same checked sample are carried unchanged",
    states(
      await capture(
        "at=1&round=t5&compare=t1",
        fixed([finding("a", 0.3)], [row("a")]),
      ),
    ),
    ["same", ["a:carried:same"]],
  );

  // 18. Equal elapsed bounds can enclose different sampled frames.
  const dense: string = "at=0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1";
  const sparse: string = "at=0,0.5,1";
  const atTenth: (seconds: number) => ISample = (seconds: number): ISample => ({
    findings: seconds === 0.1 ? [finding("a", 9)] : [],
    coverage: [row("a")],
  });
  await capture(`${dense}&round=g1`, atTenth);
  const carriedAcrossGrids: IAutoMovieCaptureFindingDiff | undefined =
    await capture(
      `${sparse}&round=g2&compare=g1`,
      (seconds: number): ISample => ({
        findings: seconds === 0.5 ? [finding("a", 1)] : [],
        coverage: [row("a")],
      }),
      "shot",
      2,
    );
  const fixedAcrossGrids: IAutoMovieCaptureFindingDiff | undefined =
    await capture(
      `${sparse}&round=g3&compare=g1`,
      fixed([], [row("a")]),
      "shot",
      2,
    );
  const newAcrossGrids: IAutoMovieCaptureFindingDiff | undefined =
    await capture(`${dense}&round=g4&compare=g3`, atTenth);
  TestValidator.equals(
    "a slower capture cannot classify a finding at a frame it missed",
    [carriedAcrossGrids, fixedAcrossGrids, newAcrossGrids].map(states),
    Array.from({ length: 3 }, (): [string, string[]] => [
      "same",
      ["a:unmatched:not-sampled"],
    ]),
  );
  TestValidator.equals(
    "the same cadence covers an interior finding sample",
    states(
      await capture(`${dense}&round=g5&compare=g1`, fixed([], [row("a")])),
    ),
    ["better", ["a:fixed"]],
  );
  await capture("at=0.5&round=g6", fixed([finding("a", 2)], [row("a")]));
  TestValidator.equals(
    "an exactly observed second can match across output indices",
    states(
      await capture(
        "at=0.5&round=g7&compare=g6",
        fixed([], [row("a")]),
        "shot",
        2,
      ),
    ),
    ["better", ["a:fixed"]],
  );

  const shotTime = (seconds: number): number => seconds;
  await capture(
    "at=1&round=k1",
    fixed([finding("a", 5)], [row("a")]),
    "shot",
    2,
    shotTime,
  );
  const rebuilt = async (
    round: string,
    shotSeconds: (seconds: number) => number,
  ): Promise<IAutoMovieCaptureFindingDiff | undefined> =>
    capture(
      `at=0.5,1,1.5&round=${round}&compare=k1`,
      fixed([], [row("a")]),
      "shot",
      2,
      shotSeconds,
    );
  TestValidator.equals(
    "only the matching shot clock covers the interior former error",
    [
      await rebuilt("k2", (seconds: number): number => seconds + 0.25),
      await rebuilt("k3", (seconds: number): number =>
        seconds === 1 ? 1.25 : seconds,
      ),
      await rebuilt("k4", shotTime),
    ].map(states),
    [
      ["same", ["a:unmatched:not-sampled"]],
      ["same", ["a:unmatched:not-sampled"]],
      ["better", ["a:fixed"]],
    ],
  );

  const legacyPath: string = "out/rounds/k4/record.json";
  const legacy: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    JSON.parse(memory.text(legacyPath));
  await memory.storage.writeFile(
    legacyPath,
    JSON.stringify({
      ...legacy,
      diagnostics: {
        ...legacy.diagnostics,
        coverage: legacy.diagnostics?.coverage.map((range) => ({
          ...range,
          sampledShotClock: undefined,
        })),
      },
    }),
  );
  const atLegacy = async (
    seconds: string,
    round: string,
  ): Promise<IAutoMovieCaptureFindingDiff | undefined> =>
    capture(
      `at=${seconds}&round=${round}&compare=k4`,
      fixed([finding("a", 5)], [row("a")]),
      "shot",
      2,
      shotTime,
    );
  TestValidator.equals(
    "a legacy range can prove a recorded endpoint but not its interior clock",
    [await atLegacy("1", "k5"), await atLegacy("0.5", "k6")].map(states),
    [
      ["same", ["a:unmatched:not-sampled"]],
      ["worse", ["a:new"]],
    ],
  );

  const addressed: IAutoMovieInspectionDiagnostics.IFinding = {
    ...finding("a", 1),
    witness: {
      rank: 1,
      time: {
        filmSeconds: 1,
        outputFrame: 2,
        shot: { path: "shot", seconds: 1 },
      },
    },
  };
  const layered = (seconds: number): ISample => ({
    findings: [seconds === 1 ? addressed : finding("a", 9)],
    coverage: [row("a")],
  });
  await capture("at=0.5,1,1.5&round=l1", layered, "shot", 2);
  const filmOnly: IAutoMovieCaptureFindingDiff | undefined = await capture(
    "at=0.5,1,1.5&round=l2&compare=l1",
    fixed([], [row("a")]),
    "shot",
    2,
  );
  await capture("at=0.5,1,1.5&round=l3", layered, "shot", 2, shotTime);
  const sourceAligned: IAutoMovieCaptureFindingDiff | undefined = await capture(
    "at=0.5,1,1.5&round=l4&compare=l3",
    fixed([], [row("a")]),
    "shot",
    2,
    shotTime,
  );
  TestValidator.equals(
    "coverage cannot resolve a shot-addressed witness through film time alone",
    [filmOnly, sourceAligned].map(states),
    [
      ["same", ["a:unmatched:not-sampled"]],
      ["better", ["a:fixed"]],
    ],
  );
}
