import {
  type IAutoMovieVerification,
  runAutoMovieVerification,
} from "automovie";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

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
 * 3. A legacy capture from a nested production cannot prove the sibling model it
 *    used, even after that sibling is cleaned. Exact named sibling inputs are
 *    sealed inside the owning checkout. Unrelated paths refuse before use.
 * 4. The report retains the staging path and identifies the promoted movie and
 *    required controls by digest. A malformed output path or audit digest
 *    leaves the result unobserved. Replaced bytes or old controls are stale and
 *    a newer blocked attempt leaves the previous output available for repair.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the selected scope, artifact identity and preserved blocked-attempt behavior.
 * @evidence contracts/development/testing.md#behavioral-verification Reads retained capture and delivery inputs through the shared evaluator used by the CLI.
 * @evidence contracts/development/testing.md#independent-expectations The fixture supplies individual checked frames, unmatched observations and independently hashed literal publication bytes.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts root and nested legacy captures, sealed shared and external files, one sample and two, matched and mixed views or passes, and current, stale and blocked delivery.
 * @evidence contracts/development/testing.md#execution-ownership The CLI test owns a temporary Git fixture and launches no graphics, encoding or browser process.
 */
export async function test_cli_verification_records(): Promise<void> {
  const scratch: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-verify-records-"),
  );
  const root: string = path.join(scratch, "checkout");
  try {
    await fs.mkdir(root);
    const git = (...args: string[]): string =>
      execFileSync("git", ["-C", root, ...args], {
        encoding: "utf8",
        windowsHide: true,
      }).trim();
    git("init", "--quiet", "--template=");
    const revision: string = git(
      "-c",
      "user.name=AutoMovie Test",
      "-c",
      "user.email=test@example.invalid",
      "commit-tree",
      git("write-tree"),
      "-m",
      "Capture source fixture",
    );
    git("update-ref", "HEAD", revision);
    const info: string = path.join(root, ".git", "info");
    await fs.mkdir(info, { recursive: true });
    await fs.writeFile(
      path.join(info, "exclude"),
      "/*.png\n/record.json\n/movies/episode/*.png\n/movies/episode/record.json\n",
    );

    const assess = async (
      project: string,
      check: IAutoMovieVerification.Check,
      run: boolean = false,
    ): Promise<IAutoMovieVerification.IReport> =>
      runAutoMovieVerification({
        root: project,
        env: {},
        targets: [
          { id: "walk", checks: [check], required: { handoff: [check.id] } },
        ],
        options: { subjects: ["walk"], only: [], require: "handoff", run },
      });
    const verify = async (
      check: IAutoMovieVerification.Check,
    ): Promise<IAutoMovieVerification.IResult> =>
      (await assess(root, check)).items[0]!;
    const verifyCapture = async (
      check: IAutoMovieVerification.ICapture,
      record: unknown,
    ): Promise<IAutoMovieVerification.IResult> => {
      await fs.writeFile(path.join(root, check.record), JSON.stringify(record));
      return verify(check);
    };
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
      revision,
      state: "complete",
      subject: { name: "walk" },
      rows: [firstRow],
      diagnostics: { episodes: [], coverage: [checked] },
    };
    assert.equal((await verifyCapture(still, single)).state, "passed");
    assert.equal(
      (await verifyCapture({ ...still, pass: "albedo" }, single)).state,
      "unobserved",
    );
    assert.equal(
      (
        await verifyCapture(still, {
          ...single,
          rows: [firstRow, { ...firstRow, view: "rear" }],
        })
      ).state,
      "unobserved",
    );
    assert.equal((await verifyCapture(interval, single)).state, "unobserved");
    const adjacent = {
      ...single,
      rows: [firstRow, lastRow],
      diagnostics: {
        episodes: [],
        coverage: [{ ...checked, last, samples: 2 }],
      },
    };
    assert.equal((await verifyCapture(interval, adjacent)).state, "passed");
    assert.equal(
      (
        await verifyCapture(interval, {
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
        })
      ).state,
      "unobserved",
    );

    const nested: string = path.join(root, "movies", "episode");
    await fs.mkdir(nested, { recursive: true });
    await fs.writeFile(path.join(nested, "one.png"), "retained");
    const shared: string = path.join(root, "shared", "model.txt");
    await fs.mkdir(path.dirname(shared));
    await fs.writeFile(shared, "3");
    await fs.writeFile(path.join(nested, still.record), JSON.stringify(single));
    assert.equal(git("status", "--porcelain", "--", "movies/episode"), "");
    assert.match(git("status", "--porcelain"), /\?\? shared\//u);
    const dirtySibling: IAutoMovieVerification.IReport = await assess(
      nested,
      still,
    );
    assert.equal(dirtySibling.blocked, true);
    assert.equal(dirtySibling.items[0]?.state, "unobserved");
    await fs.unlink(shared);
    assert.equal(git("status", "--porcelain"), "");
    assert.equal((await assess(nested, still)).blocked, true);

    await fs.writeFile(shared, "3");
    const sharedInput: string = "../../shared/model.txt";
    const measurement: IAutoMovieVerification.IMeasurement = {
      id: "shared-model",
      kind: "measure",
      title: "The model clears its support",
      scope: "shared model clearance",
      inputs: [sharedInput],
      unit: "m",
      minimum: 2,
      measure: async (project: string): Promise<number> =>
        Number(await fs.readFile(path.resolve(project, sharedInput), "utf8")),
    };
    assert.equal((await assess(nested, measurement, true)).blocked, false);
    assert.equal((await assess(nested, measurement)).items[0]?.state, "passed");
    await fs.writeFile(shared, "1");
    assert.equal((await assess(nested, measurement)).items[0]?.state, "stale");

    await fs.writeFile(path.join(scratch, "outside.txt"), "3");
    const nonGit: string = path.join(scratch, "standalone");
    await fs.mkdir(nonGit);
    for (const [project, input] of [
      [nested, "../../../outside.txt"],
      [nonGit, "../outside.txt"],
    ] as const) {
      const external: IAutoMovieVerification.IReport = await assess(
        project,
        {
          ...measurement,
          inputs: [input],
          measure: (): number => 3,
        },
        true,
      );
      assert.equal(external.items[0]?.state, "unobserved");
      assert.match(
        external.items[0]!.message,
        /outside the project and its Git checkout/u,
      );
    }

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
      source: { file: ".render-DbXdf0/film.mp4", sha256: filmSha256 },
    };
    assert.equal((await verify(delivery)).state, "not-run");
    await fs.writeFile(film, "film");
    const controls: string = path.join(root, "controls", "record.json");
    await fs.mkdir(path.dirname(controls));
    const validControls = {
      film: "walk",
      filmSha256,
      channels: [{ pass: "depth" }],
    };
    await fs.writeFile(controls, JSON.stringify(validControls));
    await fs.writeFile(report, JSON.stringify(published));
    assert.equal((await verify(delivery)).state, "passed");

    await fs.writeFile(
      report,
      JSON.stringify({ ...published, video: "./film.mp4" }),
    );
    assert.equal((await verify(delivery)).state, "unobserved");
    await fs.writeFile(
      report,
      JSON.stringify({
        ...published,
        source: { ...published.source, sha256: "" },
      }),
    );
    assert.equal((await verify(delivery)).state, "unobserved");
    await fs.writeFile(report, JSON.stringify(published));

    await fs.writeFile(
      controls,
      JSON.stringify({
        ...validControls,
        filmSha256: "0".repeat(64),
      }),
    );
    assert.equal((await verify(delivery)).state, "stale");
    await fs.writeFile(controls, JSON.stringify(validControls));
    await fs.writeFile(film, "new film");
    assert.equal((await verify(delivery)).state, "stale");
    await fs.writeFile(
      report,
      JSON.stringify({
        ...published,
        status: "blocked",
        video: null,
        failure: { message: "audit failed" },
      }),
    );
    const blocked: IAutoMovieVerification.IResult = await verify(delivery);
    assert.equal(blocked.state, "failed");
    assert.match(blocked.message, /Previous output: film\.mp4/u);
  } finally {
    await fs.rm(scratch, { recursive: true, force: false });
  }
}
