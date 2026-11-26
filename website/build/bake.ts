// Compute the scenes' and motions' takes ahead of the visitor, and draw a
// still of each.
//
//   pnpm run bake [--jobs <n>] [--only <pattern>]
//
// Every listed scene that plays and every motion tried alone (`BakeJobs`) is
// computed as the take worker would, gzipped in `BakedTake`'s format into
// `public/baked/<scenes|motions>/<id>.take`, and drawn by `FigurePoster`
// into `<id>.svg` beside it, with `public/baked/manifest.json` listing them.
// A page plays a baked take at once and shows its still on a card, so no
// card plans a take in the browser.
//
// A take depends only on its composition and the packages' code, so each is
// kept in `.bake-cache/` under a hash of both, a later run computes only
// what changed, and each run drops the entries it did not use. Missing takes are computed in `--jobs` child processes, by
// default one per CPU less one. A take the packages refuse is reported and
// left out, and the run exits 1, since a scene that plays must bake.
// `--only` refreshes matching kind-and-id pairs without dropping other assets.
import { type ChildProcess, spawn } from "node:child_process";
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

/** The website's own directory. */
const SITE: string = path.resolve(__dirname, "..");

/** Where computed takes are kept between runs; git ignores it. */
const CACHE: string = path.join(SITE, ".bake-cache");

/** Where the baked files are written for Next to export; git ignores it. */
const OUT: string = path.join(SITE, "public", "baked");

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
const VERSION: string = "1";

/**
 * One job of a child process: the composition and the cache key it is stored
 * under.
 */
interface IChildJob {
  /** The cache key. */
  key: string;

  /** The job's id, for the report. */
  id: string;

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

/** Compute the jobs of one child and store each take or refusal in the cache. */
const child: (file: string) => void = (file: string): void => {
  const jobs: IChildJob[] = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const job of jobs) {
    const made: ReturnType<typeof TakeCompute.take> = TakeCompute.take(
      job.composition,
      SCENE_FPS,
    );
    if ("track" in made)
      fs.writeFileSync(
        path.join(CACHE, `${job.key}.take`),
        zlib.gzipSync(BakedTake.encode(made), { level: 9 }),
      );
    else
      fs.writeFileSync(
        path.join(CACHE, `${job.key}.refusal.json`),
        JSON.stringify(made),
      );
    process.stdout.write(
      `${"track" in made ? "baked" : "refused"} ${job.id}\n`,
    );
  }
};

/** Run one child process over a share of the jobs. */
const run: (jobs: IChildJob[], index: number) => Promise<void> = (
  jobs: IChildJob[],
  index: number,
): Promise<void> =>
  new Promise((resolve: () => void, reject: (error: Error) => void): void => {
    const file: string = path.join(CACHE, `jobs-${index}.json`);
    fs.writeFileSync(file, JSON.stringify(jobs));
    const process_: ChildProcess = spawn(
      process.execPath,
      [__filename, "--child", file],
      { stdio: ["ignore", "inherit", "inherit"], env: process.env },
    );
    process_.on("exit", (code: number | null): void => {
      fs.rmSync(file, { force: true });
      if (code === 0) resolve();
      else reject(new Error(`A bake child exited with ${code}`));
    });
  });

/**
 * Bake every job, or as a child its share, then write the site's files and
 * report refusals.
 */
const main: () => Promise<void> = async (): Promise<void> => {
  const argv: string[] = process.argv.slice(2);
  if (argv[0] === "--child") return child(argv[1]!);
  const at: number = argv.indexOf("--jobs");
  const selection: number = argv.indexOf("--only");
  if (selection !== -1 && argv[selection + 1] === undefined)
    throw new Error("--only requires a take pattern");
  const only: RegExp | null =
    selection === -1 ? null : new RegExp(argv[selection + 1]!);
  const asked: number =
    at === -1
      ? Math.max(1, os.availableParallelism() - 1)
      : Number(argv[at + 1]);
  if (!Number.isInteger(asked) || asked < 1)
    throw new Error(
      `--jobs takes a whole number of processes, not ${argv[at + 1]}`,
    );
  const parallel: number = asked;

  fs.mkdirSync(CACHE, { recursive: true });
  const started: number = Date.now();
  const sources: string = fingerprint();
  const jobs: IBakeJob[] = BakeJobs.list().filter(
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
        .digest("hex")
        .slice(0, 24),
    }),
  );
  const cached: (key: string) => boolean = (key: string): boolean =>
    fs.existsSync(path.join(CACHE, `${key}.take`)) ||
    fs.existsSync(path.join(CACHE, `${key}.refusal.json`));

  // Compute what the cache lacks, spread round-robin over the children.
  const missing: IChildJob[] = keyed
    .filter(({ key }: IKeyed): boolean => !cached(key))
    .map(
      ({ job, key }: IKeyed): IChildJob => ({
        key,
        id: `${job.kind} ${job.id}`,
        composition: job.composition,
      }),
    );
  console.log(
    `${jobs.length} takes, ${jobs.length - missing.length} cached, ${missing.length} to compute on ${Math.min(parallel, missing.length)} processes`,
  );
  const shares: IChildJob[][] = Array.from(
    { length: Math.min(parallel, missing.length) },
    (): IChildJob[] => [],
  );
  missing.forEach((job: IChildJob, i: number): void => {
    shares[i % shares.length]!.push(job);
  });
  await Promise.all(shares.map(run));

  // Write the site's files from the cache.
  if (only === null) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, "scenes"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "motions"), { recursive: true });
  const manifestPath: string = path.join(OUT, "manifest.json");
  const manifest: IBakedManifest =
    only !== null && fs.existsSync(manifestPath)
      ? BakedManifest.read()
      : { format: "AMT1", scenes: {}, motions: {} };
  const refused: string[] = [];
  for (const { job, key } of keyed) {
    const source: string = path.join(CACHE, `${key}.take`);
    if (!fs.existsSync(source)) {
      delete manifest[`${job.kind}s`][job.id];
      const refusal: { message: string } = JSON.parse(
        fs.readFileSync(path.join(CACHE, `${key}.refusal.json`), "utf8"),
      );
      refused.push(`${job.kind} ${job.id}: ${refusal.message}`);
      continue;
    }
    const bytes: Buffer = fs.readFileSync(source);
    const take: ITake = BakedTake.decode(
      new Uint8Array(zlib.gunzipSync(bytes)),
    );
    const folder: string = path.join(OUT, `${job.kind}s`);
    fs.writeFileSync(path.join(folder, `${job.id}.take`), bytes);
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
      bytes: bytes.byteLength,
      composition: BakedManifest.hash(job.composition),
    };
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));

  // Drop what no job of this run used, so a cache carried between runs
  // holds the current takes alone.
  const used: Set<string> = new Set(
    keyed.map(({ key }: IKeyed): string => key),
  );
  if (only === null)
    for (const file of fs.readdirSync(CACHE))
      if (!used.has(file.split(".")[0]!))
        fs.rmSync(path.join(CACHE, file), { force: true });
  console.log(
    `baked ${Object.keys(manifest.scenes).length} scenes and ${Object.keys(manifest.motions).length} motions in ${Math.round((Date.now() - started) / 1000)} s`,
  );

  // A motion tried alone may be refused where its scene plays it; a scene
  // that plays must not be.
  for (const line of refused) console.log(`  refused ${line}`);
  if (refused.some((line: string): boolean => line.startsWith("scene ")))
    process.exitCode = 1;
};
main().catch((error: unknown): void => {
  console.error(error);
  process.exit(1);
});
