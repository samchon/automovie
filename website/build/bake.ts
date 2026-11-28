// Precompute the gallery's takes and posters before the website export.
//
//   pnpm run bake [--jobs <n>] [--only <pattern>]
//                 [--take-timeout <seconds>] [--budget <seconds>]
//
// The parent reuses verified results and assigns one take at a time to each
// resident process. It retains completed results if a take fails and updates the
// gallery only after every selected scene succeeds. Standalone motion refusals
// are reported and omitted. A full bake replaces the gallery; --only updates
// matches and retains current entries outside the selection.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

import { BakeJobs } from "../src/baked/BakeJobs";
import { BakedManifest } from "../src/baked/BakedManifest";
import { BakedTake } from "../src/baked/BakedTake";
import { FigurePoster } from "../src/baked/FigurePoster";
import type { IBakeJob } from "../src/baked/IBakeJob";
import type { IBakedManifest } from "../src/baked/IBakedManifest";
import { PropShapes } from "../src/baked/PropShapes";
import { SCENE_FPS } from "../src/scenes/SCENE_FPS";
import { TakeCompute } from "../src/takes/package/TakeCompute";
import type { ITake } from "../src/takes/structures/ITake";
import { readBakeResult, writeBakeResult } from "./bakeResults";
import {
  type BakeWorkerMessage,
  type IBakeWorkerJob,
  runBakeWorkers,
} from "./bakeWorkerPool";

const SITE: string = path.resolve(__dirname, "..");
// A qualification run can keep its cache and generated gallery apart from the
// normal website output.
const CACHE: string = path.resolve(
  process.env.AUTOMOVIE_BAKE_CACHE ?? path.join(SITE, ".bake-cache"),
);
const RESULTS: string = path.join(CACHE, "results");
const DEFAULT_OUT: string = path.join(SITE, "public", "baked");
const OUT: string = path.resolve(
  process.env.AUTOMOVIE_BAKE_OUTPUT ?? DEFAULT_OUT,
);

/**
 * The sources a take depends on: the packages the take worker runs and the
 * site's own modules between the composition and the packages. The page's side
 * of the worker is left out, since it computes nothing.
 */
const SOURCES: readonly string[] = [
  "../packages/interface/src",
  "../packages/engine/src",
  "../packages/human/src",
  "../packages/motions/src",
  "../packages/archetypes/src",
  "../packages/render/src",
  "src/takes/package",
  "src/playground/package",
  "src/playground/data",
  "src/scenes/package/SceneArchetype.ts",
  "src/scenes/SceneTrack.ts",
  "src/baked/BakedTake.ts",

  // The installed versions, such as the physics engine a take may run.
  "../pnpm-lock.yaml",
];

/** Bump to recompute every take when what is stored changes. */
const VERSION: string = "2";

/**
 * One job of a child process: the composition and the cache key it is stored
 * under.
 */
interface IChildJob extends IBakeWorkerJob {
  /** What is performed. */
  composition: IBakeJob["composition"];
}

/** A job with the cache key its take is kept under. */
interface IKeyed {
  /** The job. */
  job: IBakeJob;

  /** The cache key. */
  key: string;
}

/** Hash every file under the sources, in a stable order. */
const fingerprint: () => string = (): string => {
  const hash: crypto.Hash = crypto.createHash("sha256");
  hash.update(VERSION);
  for (const source of SOURCES) {
    const root: string = path.join(SITE, source);
    const files: string[] = fs.statSync(root).isDirectory()
      ? fs
          .readdirSync(root, { recursive: true })
          .map((file: string | Buffer): string => path.join(root, String(file)))
          .filter((file: string): boolean => fs.statSync(file).isFile())
          .sort()
      : [root];
    for (const file of files) {
      hash.update(path.relative(SITE, file).replaceAll("\\", "/"));
      hash.update(fs.readFileSync(file));
    }
  }
  return hash.digest("hex");
};

/* A worker acknowledges each phase before performing its synchronous work. */
function child(staged: string): void {
  const send = (message: BakeWorkerMessage): Promise<void> =>
    new Promise((resolve, reject) => {
      process.send!(message, (error: Error | null) => {
        if (error === null) resolve();
        else reject(error);
      });
    });
  process.on("message", (job: IChildJob) => {
    void compute(job).catch((error: unknown) => {
      // An IPC failure leaves the parent to observe the process closure.
      console.error(error);
      process.exitCode = 1;
      process.disconnect?.();
    });
  });

  async function compute(job: IChildJob): Promise<void> {
    try {
      await send({ type: "stage", key: job.key, stage: "computing" });
      const made: ReturnType<typeof TakeCompute.take> = TakeCompute.take(
        job.composition,
        SCENE_FPS,
      );
      if (!("track" in made) && made.kind === "error")
        throw new Error(made.message);
      await send({ type: "stage", key: job.key, stage: "encoding" });
      if ("track" in made)
        writeBakeResult(
          resultPath(staged, job.key),
          job.key,
          "take",
          zlib.gzipSync(BakedTake.encode(made), { level: 9 }),
        );
      else
        writeBakeResult(
          resultPath(staged, job.key),
          job.key,
          "refusal",
          Buffer.from(JSON.stringify(made)),
        );
      await send({ type: "complete", key: job.key });
    } catch (error) {
      await send({
        type: "failed",
        key: job.key,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function resultPath(directory: string, key: string): string {
  return path.join(directory, `${key}.result`);
}

function wholeOption(
  argv: readonly string[],
  flag: string,
  fallback: number,
  maximum: number,
): number {
  const at: number = argv.indexOf(flag);
  if (at === -1) return fallback;
  const value: number = Number(argv[at + 1]);
  if (!Number.isInteger(value) || value < 1 || value > maximum)
    throw new Error(`${flag} requires an integer between 1 and ${maximum}`);
  return value;
}

async function main(): Promise<void> {
  const argv: string[] = process.argv.slice(2);
  if (argv[0] === "--child") return child(argv[1]!);
  const selection: number = argv.indexOf("--only");
  if (selection !== -1 && argv[selection + 1] === undefined)
    throw new Error("--only requires a take pattern");
  const only: RegExp | null =
    selection === -1 ? null : new RegExp(argv[selection + 1]!);
  const parallel: number = wholeOption(
    argv,
    "--jobs",
    Math.max(1, os.availableParallelism() - 1),
    Number.MAX_SAFE_INTEGER,
  );
  // Two minutes per take leave room for slow valid scenes. The 30-minute
  // queue budget exceeds the historical complete 735-take runner workload
  // and leaves the workflow time to save retained results.
  const durationLimit: number = Math.floor(2_147_483_647 / 1_000);
  const takeTimeout: number =
    1_000 * wholeOption(argv, "--take-timeout", 120, durationLimit);
  const totalTimeout: number =
    1_000 * wholeOption(argv, "--budget", 1_800, durationLimit);

  fs.mkdirSync(RESULTS, { recursive: true });
  const started: number = Date.now();
  const sources: string = fingerprint();
  const catalog: IBakeJob[] = BakeJobs.list();
  const jobs: IBakeJob[] = catalog.filter(
    (job: IBakeJob): boolean =>
      only === null || only.test(`${job.kind} ${job.id}`),
  );
  if (jobs.length === 0) throw new Error("No take matches --only");
  const keyed: IKeyed[] = jobs.map(
    (job: IBakeJob): IKeyed => ({
      job,
      key: crypto
        .createHash("sha256")
        .update(sources)
        .update(String(SCENE_FPS))
        .update(JSON.stringify(job.composition))
        .digest("hex"),
    }),
  );

  const verified: Set<string> = new Set();
  const missing: Map<string, IChildJob> = new Map();
  for (const { job, key } of keyed) {
    if (verified.has(key) || missing.has(key)) continue;
    if (readBakeResult(resultPath(RESULTS, key), key) !== null)
      verified.add(key);
    else
      missing.set(key, {
        key,
        id: `${job.kind} ${job.id}`,
        composition: job.composition,
      });
  }
  console.log(
    `${jobs.length} takes, ${verified.size} cached results, ${missing.size} to compute on ${Math.min(parallel, missing.size)} workers`,
  );

  if (missing.size !== 0) {
    const staged: string = fs.mkdtempSync(path.join(CACHE, "working-"));
    let baked: number = 0;
    let refused: number = 0;
    const failures = await runBakeWorkers({
      args: [__filename, "--child", staged],
      jobs: [...missing.values()],
      parallel,
      startupTimeout: 5 * 60_000,
      takeTimeout,
      totalTimeout,
      report: (line: string): void => console.log(line),
      accept: ({ key }: IChildJob): "baked" | "refused" => {
        const file: string = resultPath(staged, key);
        const result = readBakeResult(file, key);
        if (result === null)
          throw new Error("missing or corrupt worker result");
        fs.renameSync(file, resultPath(RESULTS, key));
        if (result.type === "take") ++baked;
        else ++refused;
        return result.type === "take" ? "baked" : "refused";
      },
    }).finally(() => fs.rmSync(staged, { recursive: true, force: true }));
    if (failures.length !== 0) {
      const timedOut: number = failures.filter(
        (failure) => failure.type === "timeout",
      ).length;
      throw new Error(
        `Gallery unchanged: ${baked} new takes, ${refused} authored refusals, ${failures.length - timedOut} worker failures, ${timedOut} timeouts, ${verified.size} reused results.`,
      );
    }
  }
  publish(keyed, catalog, only !== null);
  if (only === null) {
    const used: Set<string> = new Set(keyed.map(({ key }) => `${key}.result`));
    for (const file of fs.readdirSync(RESULTS))
      if (/^[a-f0-9]{64}\.result$/u.test(file) && !used.has(file))
        fs.unlinkSync(path.join(RESULTS, file));
  }
  console.log(
    `completed gallery bake in ${Math.round((Date.now() - started) / 1_000)} s`,
  );
}

/* Resolve refusals before replacing output. The manifest is written last. */
function publish(
  keyed: readonly IKeyed[],
  catalog: readonly IBakeJob[],
  partial: boolean,
): void {
  let sceneRefusals: number = 0;
  for (const { job, key } of keyed) {
    const result = readBakeResult(resultPath(RESULTS, key), key);
    if (result === null) throw new Error(`Missing verified result: ${job.id}`);
    if (result.type === "refusal") {
      console.log(`  refused ${job.kind} ${job.id}: ${result.message}`);
      if (job.kind === "scene") ++sceneRefusals;
    }
  }
  if (sceneRefusals !== 0)
    throw new Error(
      `${sceneRefusals} scenes refused. Verified results retained; gallery unchanged.`,
    );

  const manifestPath: string = path.join(OUT, "manifest.json");
  const manifest: IBakedManifest = { format: "AMT1", scenes: {}, motions: {} };
  if (partial && fs.existsSync(manifestPath)) {
    const previous: IBakedManifest = JSON.parse(
      fs.readFileSync(manifestPath, "utf8"),
    );
    for (const job of catalog) {
      const entry: IBakedManifest.IEntry | undefined =
        previous[`${job.kind}s`][job.id];
      if (
        entry !== undefined &&
        entry.composition === BakedManifest.hash(job.composition)
      )
        manifest[`${job.kind}s`][job.id] = entry;
    }
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const stage: string = fs.mkdtempSync(
    path.join(path.dirname(OUT), ".gallery-"),
  );
  const next: string = path.join(stage, "next");
  let keepRecovery: boolean = false;
  try {
    fs.mkdirSync(path.join(next, "scenes"), { recursive: true });
    fs.mkdirSync(path.join(next, "motions"), { recursive: true });
    for (const { job, key } of keyed) {
      const result = readBakeResult(resultPath(RESULTS, key), key);
      if (result === null)
        throw new Error(`Missing verified result: ${job.id}`);
      if (result.type === "refusal") {
        delete manifest[`${job.kind}s`][job.id];
        continue;
      }
      const take: ITake = BakedTake.decode(
        new Uint8Array(zlib.gunzipSync(result.bytes)),
      );
      const folder: string = path.join(next, `${job.kind}s`);
      fs.writeFileSync(path.join(folder, `${job.id}.take`), result.bytes);
      fs.writeFileSync(
        path.join(folder, `${job.id}.svg`),
        FigurePoster.draw(take, {
          view: job.view,
          from: job.from,
          ghosts: job.kind === "scene" ? 3 : 5,
          window: job.kind === "scene" ? 1.6 : undefined,
          props: PropShapes.of(job.composition.objects ?? []),
        }),
      );
      manifest[`${job.kind}s`][job.id] = {
        duration: take.duration,
        bytes: result.bytes.byteLength,
        composition: BakedManifest.hash(job.composition),
      };
    }
    fs.writeFileSync(
      path.join(next, "manifest.json"),
      JSON.stringify(manifest),
    );
    if (partial) {
      for (const kind of ["scenes", "motions"]) {
        const destination: string = path.join(OUT, kind);
        fs.mkdirSync(destination, { recursive: true });
        for (const name of fs.readdirSync(path.join(next, kind)))
          fs.renameSync(
            path.join(next, kind, name),
            path.join(destination, name),
          );
      }
      fs.renameSync(path.join(next, "manifest.json"), manifestPath);
    } else {
      const previous: string = path.join(stage, "previous");
      const previousExists: boolean = fs.existsSync(OUT);
      if (previousExists) {
        // Older interrupted bakes may have left the normal output without a
        // manifest. An explicitly supplied directory needs its bake identity.
        if (
          !fs.lstatSync(OUT).isDirectory() ||
          (OUT !== DEFAULT_OUT && !fs.existsSync(manifestPath))
        )
          throw new Error(`Gallery output is not a previous bake: ${OUT}`);
        fs.renameSync(OUT, previous);
      }
      try {
        fs.renameSync(next, OUT);
      } catch (error) {
        if (previousExists)
          try {
            fs.renameSync(previous, OUT);
          } catch (rollback) {
            keepRecovery = true;
            throw new AggregateError(
              [error, rollback],
              `Gallery replacement failed. Previous output remains at ${previous}.`,
            );
          }
        throw error;
      }
    }
  } finally {
    if (!keepRecovery) fs.rmSync(stage, { recursive: true, force: true });
  }
  console.log(
    `baked ${Object.keys(manifest.scenes).length} scenes and ${Object.keys(manifest.motions).length} motions`,
  );
}

main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
