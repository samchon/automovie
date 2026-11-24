import type { IAutoMovieVerification } from "automovie";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { inspectAutoMovieVerificationCapture } from "../../../../packages/cli/src/inspectAutoMovieVerificationCapture";
import { inspectAutoMovieVerificationDelivery } from "../../../../packages/cli/src/inspectAutoMovieVerificationDelivery";

/**
 * Verify the retained capture and delivered facts over the exact declared scope
 * before reporting either as current.
 *
 * Scenarios:
 *
 * 1. A single still in a right view supplies one supporting sample. It cannot
 *    supply a different pass, mixed view audit or a two-frame interval.
 * 2. A real adjacent frame and bounded diagnostic coverage complete the interval.
 *    An unmatched error still calls for comparable observations.
 * 3. The published bytes and required control digest must match the report.
 *    Replaced bytes or old controls are stale and a newer blocked attempt
 *    cannot approve the previous film left beside its report.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the selected scope, artifact identity and preserved blocked-attempt behavior.
 * @evidence contracts/development/testing.md#behavioral-verification Reads retained capture and delivery inputs through the verifier's existing-record adapters.
 * @evidence contracts/development/testing.md#independent-expectations The fixture supplies individual checked frames, unmatched observations and independently hashed literal publication bytes.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts one sample with two, a matched versus mixed view and pass, current versus stale video or controls and a later blocked attempt.
 * @evidence contracts/development/testing.md#execution-ownership A portable CLI unit using an owned temporary directory with no graphics, encoding or browser invocation.
 */
export async function test_cli_verification_records(): Promise<void> {
  const root: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-verify-records-"),
  );
  try {
    await fs.writeFile(path.join(root, "one.png"), "retained");
    await fs.writeFile(path.join(root, "two.png"), "retained");
    const still: IAutoMovieVerification.ICapture = {
      id: "support",
      title: "Foot rests on its support",
      scope: "front view at zero seconds",
      kind: "capture",
      subject: "walk",
      record: "record.json",
      view: "front",
      pass: "beauty",
      occurrence: "shot/0",
      diagnostic: { check: "support", key: "foot" },
      at: { second: 0 },
    };
    const interval: IAutoMovieVerification.ICapture = {
      ...still,
      at: { fromFrame: 0, endFrame: 2 },
    };
    const first = { filmSeconds: 0, outputFrame: 0 };
    const last = { filmSeconds: 0.5, outputFrame: 1 };
    const firstRow = {
      view: "front",
      pass: "beauty",
      state: "drawn",
      file: "one.png",
      time: { seconds: 0, frame: 0 },
    };
    const lastRow = {
      ...firstRow,
      file: "two.png",
      time: { seconds: 0.5, frame: 1 },
    };
    const checked = {
      scope: "shot/0",
      first,
      last: first,
      samples: 1,
      coverage: {
        check: "support",
        key: "foot",
        status: "checked",
        required: true,
      },
    };
    const single = {
      state: "complete",
      subject: { name: "walk" },
      rows: [firstRow],
      diagnostics: { episodes: [], coverage: [checked] },
    };
    assert.equal(
      (await inspectAutoMovieVerificationCapture(still, single, root)).state,
      "passed",
    );
    assert.equal(
      (
        await inspectAutoMovieVerificationCapture(
          { ...still, pass: "albedo" },
          single,
          root,
        )
      ).state,
      "unobserved",
    );
    assert.equal(
      (
        await inspectAutoMovieVerificationCapture(
          still,
          { ...single, rows: [firstRow, { ...firstRow, view: "rear" }] },
          root,
        )
      ).state,
      "unobserved",
    );
    assert.equal(
      (await inspectAutoMovieVerificationCapture(interval, single, root)).state,
      "unobserved",
    );
    const adjacent = {
      ...single,
      rows: [firstRow, lastRow],
      diagnostics: {
        episodes: [],
        coverage: [{ ...checked, last, samples: 2 }],
      },
    };
    assert.equal(
      (await inspectAutoMovieVerificationCapture(interval, adjacent, root))
        .state,
      "passed",
    );
    assert.equal(
      (
        await inspectAutoMovieVerificationCapture(
          interval,
          {
            ...adjacent,
            comparison: {
              findings: {
                state: "compared",
                entries: [
                  {
                    state: "unmatched",
                    category: "error",
                    scope: "shot/0",
                    check: "support",
                    key: "foot",
                  },
                ],
              },
            },
          },
          root,
        )
      ).state,
      "unobserved",
    );

    const delivery: IAutoMovieVerification.IDelivery = {
      id: "delivery",
      title: "The delivery's file and depth guide match",
      scope: "whole movie and recorded control",
      kind: "delivery",
      subject: "walk",
      report: "render-report.json",
      controls: ["depth"],
    };
    const film: string = path.join(root, "film.mp4");
    const report: string = path.join(root, delivery.report);
    const filmSha256: string = createHash("sha256")
      .update("film")
      .digest("hex");
    const published = {
      subject: "walk",
      status: "published",
      video: "film.mp4",
      source: { file: "film.mp4", sha256: filmSha256 },
    };
    assert.equal(
      (await inspectAutoMovieVerificationDelivery(delivery, root)).state,
      "not-run",
    );
    await fs.writeFile(film, "film");
    await fs.writeFile(report, JSON.stringify(published));
    const controls: string = path.join(root, "controls", "record.json");
    await fs.mkdir(path.dirname(controls));
    await fs.writeFile(
      controls,
      JSON.stringify({
        film: "walk",
        filmSha256,
        channels: [{ pass: "depth" }],
      }),
    );
    assert.equal(
      (await inspectAutoMovieVerificationDelivery(delivery, root)).state,
      "passed",
    );
    await fs.writeFile(
      controls,
      JSON.stringify({
        film: "walk",
        filmSha256: "0".repeat(64),
        channels: [{ pass: "depth" }],
      }),
    );
    assert.equal(
      (await inspectAutoMovieVerificationDelivery(delivery, root)).state,
      "stale",
    );
    await fs.writeFile(film, "new film");
    assert.equal(
      (await inspectAutoMovieVerificationDelivery(delivery, root)).state,
      "stale",
    );
    await fs.writeFile(
      report,
      JSON.stringify({
        ...published,
        status: "blocked",
        video: null,
        failure: { message: "audit failed" },
      }),
    );
    const blocked = await inspectAutoMovieVerificationDelivery(delivery, root);
    assert.equal(blocked.state, "failed");
    assert.match(blocked.message, /Previous output: film\.mp4/u);
  } finally {
    await fs.rm(root, { recursive: true, force: false });
  }
}
