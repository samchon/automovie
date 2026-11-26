import type {
  IAutoMovieCaptureCell,
  IAutoMovieCaptureCellRecord,
  IAutoMovieCaptureDrawing,
  IAutoMovieCapturePlan,
  IAutoMovieCaptureRecord,
  IAutoMovieProductionCheck,
} from "@automovie/interface";
import { AutoMovieCaptureFolder, AutoMovieRenderPicture, AutoMovieRenderCapture } from "@automovie/render";
import { runAutoMovieProductionCheck } from "automovie";
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
 *    supply a different pass, mixed view audit or a two-frame interval. A check
 *    combining that valid second with the incomplete interval blocks handoff.
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
export async function test_cli_production_check_records(): Promise<void> {
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
      "/*.png\n/record.json\n/captures/\n/movies/episode/*.png\n/movies/episode/record.json\n",
    );

    const assess = async (
      project: string,
      check: IAutoMovieProductionCheck.Check,
      run: boolean = false,
    ): Promise<IAutoMovieProductionCheck.IReport> =>
      runAutoMovieProductionCheck({
        root: project,
        env: {},
        targets: [
          { id: "walk", checks: [check], required: { handoff: [check.id] } },
        ],
        options: { subjects: ["walk"], only: [], require: "handoff", run },
      });
    const verify = async (
      check: IAutoMovieProductionCheck.Check,
    ): Promise<IAutoMovieProductionCheck.IResult> =>
      (await assess(root, check)).items[0]!;
    const verifyCapture = async (
      check: IAutoMovieProductionCheck.ICapture,
      record: unknown,
    ): Promise<IAutoMovieProductionCheck.IResult> => {
      await fs.writeFile(path.join(root, check.record), JSON.stringify(record));
      return verify(check);
    };
    const picture = {
      width: 32,
      height: 18,
      pixels: new Uint8ClampedArray(32 * 18 * 4).fill(140),
    };
    const png: Uint8Array =
      await AutoMovieRenderPicture.encodeRasterPng(picture);
    await fs.writeFile(path.join(root, "one.png"), png);
    await fs.writeFile(path.join(root, "two.png"), png);
    const still: IAutoMovieProductionCheck.ICapture = {
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
      at: { type: "second", second: 0 },
    };
    const interval: IAutoMovieProductionCheck.ICapture = {
      ...still,
      at: { type: "frames", fromFrame: 0, endFrame: 2 },
    };
    const first = { filmSeconds: 0, outputFrame: 0 };
    const last = { filmSeconds: 0.5, outputFrame: 1 };
    const firstRow = {
      view: "front",
      pass: "beauty",
      state: "drawn",
      file: "one.png",
      hash: AutoMovieRenderPicture.hashRasterImage(picture),
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
    const legacy: unknown = { second: 0 };
    assert.equal(
      (
        await verify({
          ...still,
          at: legacy as IAutoMovieProductionCheck.ICaptureTime,
        })
      ).state,
      "passed",
    );
    const onePath: string = path.join(root, "one.png");
    await fs.writeFile(onePath, "corrupt still");
    const corrupt: string = (await verifyCapture(still, single)).state;
    const replacement: Uint8ClampedArray = picture.pixels.slice();
    replacement[0] = 0;
    await fs.writeFile(
      onePath,
      await AutoMovieRenderPicture.encodeRasterPng({
        ...picture,
        pixels: replacement,
      }),
    );
    const replaced: string = (await verifyCapture(still, single)).state;
    await fs.writeFile(onePath, png);
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
    const incomplete: IAutoMovieProductionCheck.IResult = await verifyCapture(
      interval,
      single,
    );
    assert.equal(incomplete.state, "unobserved");
    assert.match(incomplete.message, /Only 1\/2 requested samples/u);

    for (const conflicting of [
      { second: 0, fromFrame: 0, endFrame: 2 },
      { type: "second", second: 0, fromFrame: 0 },
    ]) {
      const refused: IAutoMovieProductionCheck.IReport = await assess(root, {
        ...still,
        at: conflicting as unknown as IAutoMovieProductionCheck.ICaptureTime,
      });
      assert.equal(refused.items[0]?.state, "unobserved");
      assert.match(refused.items[0]?.message ?? "", /exactly one/u);
      assert.equal(refused.blocked, true);
    }
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

    const drawRound = async (
      query: string,
      hasFinding: (seconds: number) => boolean = (): boolean => false,
      retimed: boolean = false,
    ): Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> => {
      const plan: IAutoMovieCapturePlan = AutoMovieRenderCapture.plan({
        request: AutoMovieRenderCapture.parsePlanRequest(new URLSearchParams(query)),
        subject: {
          ...picture,
          name: "walk",
          durationSeconds: 4,
          fps: 2,
          views: ["front"],
          drawables: [],
          marks: [],
        },
        cuts: [],
      });
      return AutoMovieRenderCapture.run({
        plan,
        draw: async (
          cell: IAutoMovieCaptureCell,
        ): Promise<IAutoMovieCaptureDrawing> => ({
          picture: { ...picture, pixels: picture.pixels.slice() },
          labels: [],
          diagnostics: {
            scope: checked.scope,
            time: {
              filmSeconds: cell.time.seconds,
              shot: {
                path: checked.scope,
                seconds: cell.time.seconds - (retimed ? 0.25 : 0),
              },
            },
            findings: hasFinding(cell.time.seconds)
              ? [
                  {
                    check: "support",
                    key: "foot",
                    code: "unsupported-foot",
                    paths: ["foot"],
                    category: "error",
                    confidence: "confirmed",
                    message: "Foot leaves its support.",
                    witness: { rank: cell.time.seconds === 0 ? 9 : 1 },
                  },
                ]
              : [],
            coverage: [{ ...checked.coverage, status: "checked" }],
          },
        }),
        folder: await AutoMovieCaptureFolder.open({
          storage: fs,
          root: path.join(root, "captures"),
          round: plan.request.round,
          compare: plan.request.compare,
        }),
        revision,
        match: "cell",
      });
    };
    await drawRound(
      "views=front&passes=graphics&at=0,0.5,1,3&round=before",
      (): boolean => true,
    );
    await drawRound(
      "views=front&passes=graphics&at=0,1&round=after&compare=before",
    );
    const correctedCheck: IAutoMovieProductionCheck.ICapture = {
      ...still,
      record: "captures/rounds/after/record.json",
      pass: "graphics",
      at: { type: "second", second: 1 },
    };
    const local: string = (await verify(correctedCheck)).state;
    const localFrame: string = (
      await verify({
        ...correctedCheck,
        at: { type: "frames", fromFrame: 2, endFrame: 3 },
      })
    ).state;
    await drawRound(
      "views=front&passes=graphics&at=3&round=retimed&compare=before",
      undefined,
      true,
    );
    const overlap: string = (
      await verify({
        ...correctedCheck,
        record: "captures/rounds/retimed/record.json",
        at: { type: "second", second: 3 },
      })
    ).state;
    await drawRound(
      "views=front&passes=graphics&at=1,3.25&round=off-grid",
      (seconds: number): boolean => seconds === 3.25,
    );
    const offGridCheck: IAutoMovieProductionCheck.ICapture = {
      ...correctedCheck,
      record: "captures/rounds/off-grid/record.json",
      at: { type: "frames", fromFrame: 2, endFrame: 3 },
    };
    const offGrid: string = (await verify(offGridCheck)).state;
    const atOffGrid: string = (
      await verify({ ...offGridCheck, at: { type: "second", second: 3.25 } })
    ).state;
    const alpha = await drawRound(
      "views=front&passes=graphics&at=1&round=alpha",
    );
    const alphaCheck: IAutoMovieProductionCheck.ICapture = {
      ...correctedCheck,
      record: "captures/rounds/alpha/record.json",
    };
    assert.equal((await verify(alphaCheck)).state, "passed");
    const alphaRow: IAutoMovieCaptureCellRecord = alpha.rows[0]!;
    if (alphaRow.state !== "drawn")
      throw new Error("The selected still did not draw.");
    const alphaPath: string = path.join(
      root,
      path.dirname(alphaCheck.record),
      alphaRow.file,
    );
    const exact: Buffer = await fs.readFile(alphaPath);
    const changedAlpha: Uint8ClampedArray = picture.pixels.slice();
    changedAlpha[3] = 0;
    await fs.writeFile(
      alphaPath,
      await AutoMovieRenderPicture.encodeRasterPng(
        { ...picture, pixels: changedAlpha },
        { alpha: true },
      ),
    );
    const changed: string = (await verify(alphaCheck)).state;
    await fs.writeFile(alphaPath, exact);
    assert.deepEqual(
      {
        corrupt,
        replaced,
        local,
        localFrame,
        overlap,
        offGrid,
        atOffGrid,
        changed,
      },
      {
        corrupt: "unobserved",
        replaced: "unobserved",
        local: "passed",
        localFrame: "passed",
        overlap: "unobserved",
        offGrid: "passed",
        atOffGrid: "failed",
        changed: "unobserved",
      },
    );

    const nested: string = path.join(root, "movies", "episode");
    await fs.mkdir(nested, { recursive: true });
    await fs.writeFile(path.join(nested, "one.png"), png);
    const shared: string = path.join(root, "shared", "model.txt");
    await fs.mkdir(path.dirname(shared));
    await fs.writeFile(shared, "3");
    await fs.writeFile(path.join(nested, still.record), JSON.stringify(single));
    assert.equal(git("status", "--porcelain", "--", "movies/episode"), "");
    assert.match(git("status", "--porcelain"), /\?\? shared\//u);
    const dirtySibling: IAutoMovieProductionCheck.IReport = await assess(
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
    const measurement: IAutoMovieProductionCheck.IMeasurement = {
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
      const external: IAutoMovieProductionCheck.IReport = await assess(
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

    const delivery: IAutoMovieProductionCheck.IDelivery = {
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
    const authoredSecond: number = 0.12500000000000003;
    const published = {
      subject: "walk",
      status: "published",
      video: "film.mp4",
      source: { file: ".render-DbXdf0/film.mp4", sha256: filmSha256 },
      frames: [
        { index: 0, seconds: 0, hash: filmSha256 },
        { index: 1, seconds: authoredSecond, hash: filmSha256 },
      ],
      delivery: { expected: { frameCount: 2, frameRate: [8, 1] } },
    };
    assert.equal((await verify(delivery)).state, "not-run");
    await fs.writeFile(film, "film");
    const controls: string = path.join(root, "controls", "record.json");
    await fs.mkdir(path.dirname(controls));
    const frameDigest: string = createHash("sha256")
      .update("depth")
      .digest("hex");
    const channel = {
      pass: "depth",
      convention: { pass: "depth", kind: "linear", rangeMetres: 20 },
      inputPattern: "frame_%05d.depth.png",
      frameCount: 2,
      sequenceSha256: createHash("sha256")
        .update(`${frameDigest}\n${frameDigest}\n`)
        .digest("hex"),
      frames: [
        { index: 0, seconds: 0, sha256: frameDigest },
        { index: 1, seconds: authoredSecond, sha256: frameDigest },
      ],
    };
    const validControls = {
      film: "walk",
      filmSha256,
      clock: { frameCount: 2, frameRate: [8, 1], width: 10, height: 6 },
      channels: [channel],
    };
    await fs.writeFile(report, JSON.stringify(published));
    const missingControls: IAutoMovieProductionCheck.IResult =
      await verify(delivery);
    assert.equal(missingControls.state, "unobserved");
    assert.equal(
      missingControls.evidence,
      path.join("controls", "record.json"),
    );
    await fs.writeFile(controls, JSON.stringify(validControls));
    const delivered: IAutoMovieProductionCheck.IResult = await verify(delivery);
    assert.equal(delivered.state, "passed");

    for (const malformed of [
      { ...validControls, channels: [{ ...channel, frames: [] }] },
      {
        ...validControls,
        channels: [
          {
            ...channel,
            frames: [
              channel.frames[0]!,
              { ...channel.frames[1]!, seconds: 0.125 },
            ],
          },
        ],
      },
      { ...validControls, channels: [channel, channel] },
      {
        ...validControls,
        channels: [{ ...channel, sequenceSha256: "0".repeat(64) }],
      },
      {
        ...validControls,
        clock: { ...validControls.clock, frameRate: [2, 1] },
      },
    ]) {
      await fs.writeFile(controls, JSON.stringify(malformed));
      const invalid: IAutoMovieProductionCheck.IResult = await verify(delivery);
      assert.equal(invalid.state, "unobserved");
      assert.equal(invalid.evidence, path.join("controls", "record.json"));
    }
    await fs.writeFile(controls, JSON.stringify(validControls));
    assert.match(delivered.message, /control record.*depth/u);

    await fs.writeFile(report, "{");
    const malformedReport: IAutoMovieProductionCheck.IResult =
      await verify(delivery);
    assert.equal(malformedReport.state, "unobserved");
    assert.equal(malformedReport.evidence, delivery.report);
    assert.match(malformedReport.message, /render.*malformed render report/iu);

    await fs.writeFile(report, JSON.stringify({ ...published, frames: [] }));
    const missingTimes: IAutoMovieProductionCheck.IResult =
      await verify(delivery);
    assert.equal(missingTimes.state, "unobserved");
    assert.equal(missingTimes.evidence, delivery.report);

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
    const blocked: IAutoMovieProductionCheck.IResult = await verify(delivery);
    assert.equal(blocked.state, "failed");
    assert.match(blocked.message, /Previous output: film\.mp4/u);
  } finally {
    await fs.rm(scratch, { recursive: true, force: false });
  }
}
