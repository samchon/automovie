import {
  type IAutoMovieVerification,
  runAutoMovieVerification,
} from "automovie";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

/**
 * Approval belongs to the person's observed medium, interval and exact
 * delivered bytes. The same name can hold another candidate.
 *
 * Scenarios:
 *
 * 1. A navigation locator, still decision and partial playback all leave the
 *    requested full-framed playback pending.
 * 2. A named acceptance over the correct repeated shot occurrence passes. Another
 *    occurrence, a changed required interval and replacement bytes cannot
 *    inherit that verdict.
 * 3. A single-frame still decision certifies its frame. A saved multi-frame still
 *    decision supplies no proof even for one frame inside the interval.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the media, interval, file identity and approval requirements demonstrated.
 * @evidence contracts/development/testing.md#behavioral-verification Consumes actual current bytes and an admitted observation through the named review verification path.
 * @evidence contracts/development/testing.md#independent-expectations A known two-frames-per-second clock establishes the declared frame times and Node independently computes the candidate hash.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts scoped approval with locator, wrong media, wrong occurrence, fractional interval loss, still scope wider than one frame and changed bytes.
 * @evidence contracts/development/testing.md#execution-ownership This portable CLI unit writes and removes isolated files and launches no browser or decoder.
 */
export async function test_cli_verification_review(): Promise<void> {
  const root: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-verify-review-"),
  );
  try {
    const check: IAutoMovieVerification.IReview = {
      id: "hold",
      title: "Watch the second hold",
      scope: "second occurrence, frames 0–1",
      kind: "review",
      subject: "walk",
      file: "film.mp4",
      observation: "review.json",
      viewed: "playback",
      occurrence: { entry: 1, shot: "hold" },
      frames: [0, 2],
    };
    const film: string = path.join(root, check.file);
    const receipt: string = path.join(root, check.observation);
    await fs.writeFile(film, "film");
    const observed = {
      firstFrame: 0,
      endFrame: 2,
      frameCount: 4,
      start: { ticks: 0, timeBase: [1, 2] },
      end: { ticks: 2, timeBase: [1, 2] },
    };
    const accepted = {
      version: 1,
      subject: "walk",
      file: "film.mp4",
      sha256: createHash("sha256").update("film").digest("hex"),
      note: "The intended pause holds.",
      reviewer: "Director",
      decision: "accepted",
      viewed: "playback",
      requested: { from: 0, to: 1 },
      observed,
      unavailable: null,
      cut: { state: "resolved", entry: 1, shot: "hold" },
      previous: null,
    };
    const evaluate = async (
      selected: IAutoMovieVerification.IReview,
    ): Promise<IAutoMovieVerification.IResult> => {
      const report: IAutoMovieVerification.IReport =
        await runAutoMovieVerification({
          root,
          env: {},
          targets: [{ id: "walk", checks: [selected] }],
          options: { subjects: ["walk"], only: [], require: null, run: false },
        });
      return report.items[0]!;
    };
    const verify = async (
      value: unknown,
      selected: IAutoMovieVerification.IReview = check,
    ): Promise<IAutoMovieVerification.IResult["state"]> => {
      await fs.writeFile(receipt, JSON.stringify(value));
      return (await evaluate(selected)).state;
    };
    assert.equal(
      await verify({
        ...accepted,
        reviewer: null,
        decision: null,
        viewed: null,
      }),
      "awaiting-review",
    );
    const still = {
      ...accepted,
      viewed: "still",
      requested: { from: 0.75, to: null },
      observed: {
        ...observed,
        firstFrame: 1,
        start: { ticks: 1, timeBase: [1, 2] },
      },
    };
    assert.equal(await verify(still), "awaiting-review");
    const stillCheck: IAutoMovieVerification.IReview = {
      ...check,
      title: "Inspect the still of the hold",
      scope: "second occurrence, frame 1",
      viewed: "still",
      frames: [1, 2],
    };
    assert.equal(await verify(still, stillCheck), "passed");
    assert.equal(
      await verify({ ...accepted, viewed: "still" }, stillCheck),
      "unobserved",
    );
    assert.equal((await evaluate(stillCheck)).evidence, check.observation);
    await fs.writeFile(receipt, "{");
    const malformed: IAutoMovieVerification.IResult =
      await evaluate(stillCheck);
    assert.equal(malformed.state, "unobserved");
    assert.equal(malformed.evidence, check.observation);
    assert.equal(
      await verify({ ...accepted, requested: { from: 0.1, to: 0.9 } }),
      "awaiting-review",
    );
    assert.equal(
      await verify({
        ...accepted,
        cut: { state: "resolved", entry: 0, shot: "hold" },
      }),
      "awaiting-review",
    );
    assert.equal(await verify(accepted), "passed");
    const repair: IAutoMovieVerification.IReview = {
      ...check,
      observation: "repair.json",
    };
    await fs.writeFile(
      path.join(root, repair.observation),
      JSON.stringify({
        ...accepted,
        decision: "needs-repair",
        note: "The hold shows a prop jump.",
      }),
    );
    const earlier: IAutoMovieVerification.IResult = await evaluate(check);
    assert.equal(earlier.state, "passed");
    assert.equal(earlier.evidence, check.observation);
    assert.match(earlier.message, /playback accepted by Director/u);
    const later: IAutoMovieVerification.IResult = await evaluate(repair);
    assert.equal(later.state, "failed");
    assert.equal(later.evidence, repair.observation);
    assert.match(later.message, /playback needs-repair by Director/u);
    assert.equal(
      await verify(accepted, { ...check, frames: [1, 3] }),
      "awaiting-review",
    );
    await fs.writeFile(film, "replacement film");
    assert.equal(await verify(accepted), "stale");
  } finally {
    await fs.rm(root, { recursive: true, force: false });
  }
}
