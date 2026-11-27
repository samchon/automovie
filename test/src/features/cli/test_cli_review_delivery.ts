import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliFile, AutoMovieCliReview } from "automovie";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Review issues stay on the exact publication, decoded clock and cut
 * occurrence.
 *
 * Scenarios:
 *
 * 1. A point within the second occurrence of a repeated shot records its frame and
 *    exact fractional presentation time separately from the requested point.
 * 2. A review corrects the same issue at an explicitly selected retake range. The
 *    new receipt retains the old address, neither overwrites it nor accepts a
 *    current file as the old one, and records the new reviewer's scoped
 *    choice.
 * 3. A blocked report and unchanged historical film cannot acquire a new mark.
 * 4. A boundary interval spanning two cut occurrences stays ambiguous. Missing or
 *    unproven timing keeps the mark visible with no observed frame, and
 *    incomplete cut data leaves verified native timing usable.
 * 5. The receipt reader rejects a whole-film Boolean verdict, an invalid clock and
 *    a mark whose observed clock excludes the selected time. A still decision
 *    covers only one verified frame.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the review file command's implementation with ordinary files and producer-shaped reports, checks receipts and refusals, and exercises the same parser the CLI uses. The installed delivery fixture owns actual browser, encoder and file capture.
 * @evidence contracts/development/testing.md#independent-expectations Uses a 24000/1001 presentation and its integral 1001 native ticks per frame. Authored occurrence bounds, changed bytes and explicit retake times decide the expected result.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts actual and requested time, repeated and ambiguous cuts, current and stale publications, timing and cut gaps, and a scoped named decision against an unsupported flag.
 * @evidence contracts/development/testing.md#execution-ownership A portable filesystem test discovered as test_cli_review_delivery. Each fixture lives in its own temporary folder and starts no external decoder.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the five outcomes, why timestamp projection is exact and the fixture's host boundary.
 */
export async function test_cli_review_delivery(): Promise<void> {
  const root: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-review-"),
  );
  const file: string = path.join(root, "film.mp4");
  const report: string = path.join(root, "render-report.json");

  // The reported audit witnessed six frames at 24000/1001 frames per second.
  const original = {
    subject: "scene",
    video: "film.mp4",
    status: "published",
    source: { sha256: "" },
    delivery: {
      source: { sha256: "" },
      passed: true,
      expected: { frameCount: 6, frameRate: [24000, 1001] },
      streams: {
        video: {
          status: "decoded",
          continuous: true,
          start: { ticks: 0, timeBase: [1, 24000] },
          end: { ticks: 6006, timeBase: [1, 24000] },
        },
      },
    },
    cut: [
      {
        entry: 0,
        shot: "repeat",
        start: 0,
        played: (2 * 1001) / 24000,
        liveFrames: [0, 2],
      },
      {
        entry: 1,
        shot: "middle",
        start: (2 * 1001) / 24000,
        played: (2 * 1001) / 24000,
        liveFrames: [2, 4],
      },
      {
        entry: 2,
        shot: "repeat",
        start: (4 * 1001) / 24000,
        played: (2 * 1001) / 24000,
        liveFrames: [4, 6],
      },
    ],
  };
  const request = async (
    pairs: [string, string][],
  ): ReturnType<typeof AutoMovieCliReview.reviewFile> => {
    const options = AutoMovieCliReview.readOptions(new Map(pairs));
    if ("url" in options) throw new Error("The fixture requires file mode");
    return AutoMovieCliReview.reviewFile({ options, root, env: {} });
  };
  const publish = async (bytes: string): Promise<void> => {
    await fs.writeFile(file, bytes);
    const digest: string = await AutoMovieCliFile.hash(file);
    original.source.sha256 = digest;
    original.delivery.source.sha256 = digest;
    await fs.writeFile(report, JSON.stringify(original));
  };
  const before: [string, string][] = [
    ["file", "film.mp4"],
    ["at", "0.18"],
    ["note", "The second repeat lands early"],
    ["out", "before"],
  ];
  try {
    await publish("original");
    const first = await request(before);
    if (process.platform === "win32") {
      const alias = await request([
        ["file", "Film.MP4"],
        ["at", "0.18"],
        ["note", "Open the same publication with different casing"],
        ["out", "case-alias"],
      ]);
      TestValidator.equals(
        "same Windows file clock",
        alias.observed,
        first.observed,
      );
    }
    await fs.copyFile(file, path.join(root, "other.mp4"));
    await TestValidator.error(
      "identical bytes at another path cannot mint a mark",
      async () => {
        await request([
          ["file", "other.mp4"],
          ["at", "0.18"],
          ["note", "A different path for the same bytes"],
          ["out", "copy"],
        ]);
      },
    );
    TestValidator.equals(
      "the request keeps its own timestamp",
      first.requested,
      { from: 0.18, to: null },
    );
    TestValidator.equals("exact output ticks of frame four", first.observed, {
      firstFrame: 4,
      endFrame: 5,
      frameCount: 6,
      start: { ticks: 4004, timeBase: [1, 24000] },
      end: { ticks: 5005, timeBase: [1, 24000] },
    });
    TestValidator.equals(
      "the second occurrence is identified by entry",
      first.cut,
      {
        state: "resolved",
        entry: 2,
        shot: "repeat",
      },
    );
    const saved: string = await fs.readFile(
      path.join(root, "before", "review.json"),
      "utf8",
    );
    const still = await request([
      ...before.filter(([key]): boolean => key !== "out"),
      ["out", "still"],
      ["reviewer", "Director"],
      ["decision", "accepted"],
      ["viewed", "still"],
    ]);
    TestValidator.equals(
      "a still decision addresses the single decoded frame at the selected point",
      [still.viewed, still.requested, still.observed],
      ["still", first.requested, first.observed],
    );
    const legacyStill = { ...still, requested: { from: 0.18, to: 0.19 } };
    TestValidator.equals(
      "an earlier still interval is admissible when it proves exactly one frame",
      AutoMovieCliReview.readObservation(legacyStill),
      legacyStill,
    );

    // A changed replacement cannot masquerade as the original receipt.
    await publish("retake");
    await TestValidator.error("same path with new bytes is stale", async () => {
      await request([["mark", "before/review.json"]]);
    });
    await fs.writeFile(
      report,
      JSON.stringify({
        ...original,
        cut: [{ ...original.cut[0], shot: "replacement", liveFrames: [0, 6] }],
      }),
    );
    const absent = await request([["mark", "before/review.json"]]).catch(
      (error: unknown): unknown => error,
    );
    TestValidator.predicate(
      "an absent shot is grounded in the replacement cut and retains the original address",
      absent instanceof Error &&
        absent.message.includes("requested 0.18 s") &&
        absent.message.includes(
          "Shot repeat is absent from the replacement cut",
        ),
    );
    original.cut = [
      {
        entry: 0,
        shot: "new",
        start: 0,
        played: 1001 / 24000,
        liveFrames: [0, 1],
      },
      {
        entry: 1,
        shot: "repeat",
        start: 1001 / 24000,
        played: (2 * 1001) / 24000,
        liveFrames: [1, 3],
      },
      {
        entry: 2,
        shot: "middle",
        start: (3 * 1001) / 24000,
        played: (2 * 1001) / 24000,
        liveFrames: [3, 5],
      },
      {
        entry: 3,
        shot: "repeat",
        start: (5 * 1001) / 24000,
        played: 1001 / 24000,
        liveFrames: [5, 6],
      },
    ];
    await fs.writeFile(report, JSON.stringify(original));
    const rebound = await request([
      ["mark", "before/review.json"],
      ["file", "film.mp4"],
      ["from", "0.22"],
      ["to", "0.24"],
      ["reviewer", "Director"],
      ["viewed", "playback"],
      ["decision", "accepted"],
      ["out", "retake"],
    ]);
    TestValidator.equals(
      "the explicit rebind names the new entry and keeps the note",
      {
        cut: rebound.cut,
        firstFrame: rebound.observed?.firstFrame,
        previous: rebound.previous,
        note: rebound.note,
        decision: rebound.decision,
        reviewer: rebound.reviewer,
        viewed: rebound.viewed,
      },
      {
        cut: { state: "resolved", entry: 3, shot: "repeat" },
        firstFrame: 5,
        previous: "before/review.json",
        note: first.note,
        decision: "accepted",
        reviewer: "Director",
        viewed: "playback",
      },
    );
    TestValidator.equals(
      "the original receipt was preserved",
      await fs.readFile(path.join(root, "before", "review.json"), "utf8"),
      saved,
    );

    await fs.writeFile(
      report,
      JSON.stringify({ ...original, status: "blocked" }),
    );
    await TestValidator.error(
      "a failed current publication cannot mint a receipt",
      async () => {
        await request([
          ...before.filter(([key]): boolean => key !== "out"),
          ["out", "blocked"],
        ]);
      },
    );
    await fs.writeFile(report, JSON.stringify(original));
    const crossing = await request([
      ["file", "film.mp4"],
      ["from", "0.03"],
      ["to", "0.06"],
      ["note", "Inspect the cut"],
      ["out", "crossing"],
    ]);
    TestValidator.equals(
      "two cut occurrences stay ambiguous",
      crossing.cut.state,
      "ambiguous",
    );
    await fs.writeFile(report, JSON.stringify({ ...original, cut: [] }));
    const noCut = await request([
      ...before.filter(([key]): boolean => key !== "out"),
      ["out", "no-cut"],
    ]);
    TestValidator.equals(
      "no cut does not lose native clock evidence",
      [noCut.observed?.firstFrame, noCut.cut.state],
      [4, "unavailable"],
    );
    await fs.writeFile(report, JSON.stringify({ ...original, delivery: null }));
    const noTiming = await request([
      ...before.filter(([key]): boolean => key !== "out"),
      ["out", "no-timing"],
    ]);
    TestValidator.equals(
      "no timing does not guess a frame",
      [noTiming.observed, noTiming.cut.state],
      [null, "unavailable"],
    );
    TestValidator.predicate(
      "unavailable timing says why",
      noTiming.unavailable !== null,
    );

    await TestValidator.error("a bare approval flag is refused", async () => {
      AutoMovieCliReview.readObservation({ accepted: true });
    });
    await TestValidator.error(
      "a saved observation cannot be attached to another selected time",
      async () => {
        AutoMovieCliReview.readObservation({
          ...first,
          requested: { from: 0.02, to: null },
        });
      },
    );
    await TestValidator.error(
      "an interval's observed frames cannot extend beyond its requested boundary frames",
      async () => {
        AutoMovieCliReview.readObservation({
          ...first,
          requested: { from: 0.18, to: 0.19 },
          observed: {
            ...first.observed,
            firstFrame: 3,
            start: { ticks: 3003, timeBase: [1, 24000] },
          },
        });
      },
    );
    await TestValidator.error(
      "a saved observation needs a valid exact clock",
      async () => {
        AutoMovieCliReview.readObservation({
          ...first,
          observed: {
            ...first.observed,
            end: { ticks: 5005, timeBase: [0, 24000] },
          },
        });
      },
    );
  } finally {
    await fs.rm(root, { recursive: true });
  }
}
