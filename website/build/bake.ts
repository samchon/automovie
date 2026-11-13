// Compute every take of every scene that plays into a track the pages draw.
//
//   pnpm run bake [--fps 12] [--jobs <n>] [--only <scene id>]...
//   pnpm run bake --runner <k> --runners <n> one machine's share of the takes,
//                                            in its own processes, then
//   pnpm run bake --merge                    join the machines' results
//   pnpm run bake --check                    plan each playing scene's first
//                                            take only, and list every refusal
//   pnpm run bake --check --row <name>...    plan each named action alone on
//                                            one person, with no parameters
//
// A scene is computed with the workspace packages exactly as the playground
// computes it (`PlaygroundPerformance.build`); each figure's bone placements
// and each prop's frame are sampled at a fixed rate and written to
// `public/baked/<scene>/<take>.bin`, with the rest bones of each body in
// `public/baked/bodies/` and `public/baked/manifest.json` naming them all.
// The pages then pose the polygon man from these numbers without computing
// any motion.
//
// Planning a take costs seconds and every pose tens of milliseconds, so the
// takes are dealt into shares by scene: by default one process per share
// on this machine, and on CI one share per runner, joined by `--merge`. A
// take whose inputs have not changed since the last bake keeps its file. A
// take the packages refuse stops the bake with the scene, the take and the
// refusal: a scene record is specification.
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  HumanPerformance,
  HumanSegment,
  IHumanProp,
} from "@automovie/motions";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { PLAYGROUND_BODIES } from "../src/playground/data/PLAYGROUND_BODIES";
import { PlaygroundBodies } from "../src/playground/package/PlaygroundBodies";
import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../src/scenes/SCENES";
import { SceneTake } from "../src/scenes/SceneTake";
import { SceneTrack } from "../src/scenes/SceneTrack";
import { SceneStatus } from "../src/scenes/package/SceneStatus";
import type { IScene } from "../src/scenes/structures/IScene";
import type { ISceneManifest } from "../src/scenes/structures/ISceneManifest";

/** What the command line asks for. */
interface IOptions {
  /** Frames a second of every track. */
  fps: number;

  /** The scenes to bake; every scene that plays when empty. */
  only: string[];

  /** This process's share, when it bakes one. */
  shard: number | null;

  /** The number of shares, each baked by one process. */
  shards: number;

  /** This machine's part of the takes, when several machines bake; null when one machine bakes them all. */
  runner: number | null;

  /** The number of machines that bake. */
  runners: number;

  /** Whether this process only joins the shares' results. */
  merge: boolean;

  /** Whether this process only plans each scene's first take and reports refusals. */
  check: boolean;

  /** Actions the check plans alone on one person instead of the scenes. */
  rows: string[];
}

/** One take to bake. */
interface IJob {
  /** The scene. */
  scene: IScene;

  /** The take's index in the scene. */
  index: number;

  /** The composition the take performs. */
  composition: IPlaygroundComposition;

  /** The digest of its inputs. */
  digest: string;
}

/** What one share writes: the bodies it drew and the takes it baked. */
interface IPart {
  /** The bodies, by id. */
  bodies: Record<string, ISceneManifest.IBody>;

  /** The takes, by scene id and take index. */
  takes: Record<string, Record<number, ISceneManifest.ITake>>;
}

/** The workspace packages a track is computed from; a change in any re-bakes every take. */
const SOURCES: readonly string[] = [
  "archetypes",
  "engine",
  "human",
  "interface",
  "motions",
  "render",
];

/**
 * The version of what a take's file and manifest entry hold. Raise it when
 * either changes shape, so every take is baked again; an edit elsewhere in
 * this script keeps the takes it would compute the same.
 */
const FORMAT: string = "2";

/** The entry name of a prop's frame in a track. */
const PROP: string = "frame";

const root: string = path.resolve(__dirname, "..");
const out: string = path.join(root, "public", "baked");
const parts: string = path.join(out, "parts");

const options: IOptions = {
  fps: 12,
  only: [],
  shard: null,
  shards: Math.max(1, Math.min(8, os.availableParallelism() - 1)),
  runner: null,
  runners: 1,
  merge: false,
  check: false,
  rows: [],
};
const argv: string[] = process.argv.slice(2);
for (let i: number = 0; i < argv.length; i++) {
  const arg: string = argv[i]!;
  if (arg === "--fps") options.fps = Number(argv[++i]);
  else if (arg === "--only") options.only.push(argv[++i]!);
  else if (arg === "--shard") options.shard = Number(argv[++i]);
  else if (arg === "--shards" || arg === "--jobs")
    options.shards = Math.max(1, Number(argv[++i]));
  else if (arg === "--runner") options.runner = Number(argv[++i]);
  else if (arg === "--runners") options.runners = Math.max(1, Number(argv[++i]));
  else if (arg === "--merge") options.merge = true;
  else if (arg === "--check") options.check = true;
  else if (arg === "--row") options.rows.push(argv[++i]!);
}

/** A digest of every source file of the packages a track is computed from, of the site code that computes it, and of the format. */
const sources = (): string => {
  const hash: crypto.Hash = crypto.createHash("sha256");
  const walk = (dir: string): void => {
    for (const entry of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a: fs.Dirent, b: fs.Dirent): number =>
        a.name.localeCompare(b.name),
      )) {
      const full: string = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|json)$/.test(entry.name)) {
        hash.update(path.relative(root, full).replaceAll("\\", "/"));
        hash.update(fs.readFileSync(full));
      }
    }
  };
  for (const name of SOURCES)
    walk(path.resolve(root, "..", "packages", name, "src"));
  walk(path.join(root, "src", "playground"));
  hash.update(FORMAT);
  hash.update(fs.readFileSync(path.join(root, "src", "scenes", "SceneTrack.ts")));
  return hash.digest("hex");
};

/** Every take of every scene that plays, in the order shares are dealt. */
const plan = (): IJob[] => {
  const base: string = sources();
  return SCENES.filter(
    (scene: IScene): boolean =>
      (options.only.length === 0 || options.only.includes(scene.id)) &&
      SceneStatus.of(scene).kind === "plays",
  ).flatMap((scene: IScene): IJob[] =>
    scene.takes.map((take: IScene.ITake, index: number): IJob => {
      const composition: IPlaygroundComposition = SceneTake.apply(
        scene.composition!,
        take,
      );
      return {
        scene,
        index,
        composition,
        digest: crypto
          .createHash("sha256")
          .update(base)
          .update(JSON.stringify(composition))
          .update(String(options.fps))
          .digest("hex"),
      };
    }),
  );
};

/**
 * The takes an earlier bake left, by scene and take: those of the merged
 * manifest, then those of any share's part, as a CI runner restores its own
 * share from its cache.
 */
const previous = (): Record<string, Record<number, ISceneManifest.ITake>> => {
  const known: Record<string, Record<number, ISceneManifest.ITake>> = {};
  const read = (file: string): unknown => {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return null;
    }
  };
  const manifest: ISceneManifest | null = read(
    path.join(out, "manifest.json"),
  ) as ISceneManifest | null;
  if (manifest?.version === 1)
    for (const [id, scene] of Object.entries(manifest.scenes))
      Object.assign((known[id] ??= {}), { ...scene.takes });
  for (const name of fs.existsSync(parts) ? fs.readdirSync(parts) : []) {
    const part: IPart | null = read(path.join(parts, name)) as IPart | null;
    for (const [id, takes] of Object.entries(part?.takes ?? {}))
      Object.assign((known[id] ??= {}), takes);
  }
  return known;
};

/** A take's stable number: from its scene and index, so adding a scene or a take moves no other take to another machine or process. */
const hash = (job: IJob): number => {
  let value: number = 0;
  for (const char of `${job.scene.id}#${job.index}`)
    value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value;
};

/** The takes this machine bakes: all of them, or its runner's part. */
const mine = (): IJob[] =>
  plan().filter(
    (job: IJob): boolean =>
      options.runner === null || hash(job) % options.runners === options.runner,
  );

/** A figure's placed actions, with those performed over others where the installed release has overlays. */
const spans = (
  performance: HumanPerformance,
  subject: string,
): ISceneManifest.ISpan[] => {
  const span =
    (overlay: boolean) =>
    (segment: HumanSegment.ISegment): ISceneManifest.ISpan => ({
      name: segment.name,
      from: segment.entryTime,
      to: segment.end,
      overlay,
    });
  const overlays:
    | ((subject: string) => readonly HumanSegment.ISegment[])
    | undefined = (
    performance as unknown as {
      overlays?: (subject: string) => readonly HumanSegment.ISegment[];
    }
  ).overlays;
  return [
    ...performance.segments(subject).map(span(false)),
    ...(overlays === undefined
      ? []
      : overlays.call(performance, subject).map(span(true))),
  ];
};

/** Bake one share of the jobs and write what it made. */
const bake = (shard: number): void => {
  const before: Record<string, Record<number, ISceneManifest.ITake>> =
    previous();
  const part: IPart = { bodies: {}, takes: {} };
  fs.mkdirSync(path.join(out, "bodies"), { recursive: true });

  // Each body is prepared once, and its rest bones written once.
  const body = (id: string): ISceneManifest.IBody => {
    const known: ISceneManifest.IBody | undefined = part.bodies[id];
    if (known !== undefined) return known;
    const prepared: PlaygroundBodies.IPrepared = PlaygroundBodies.get(id);
    const display: ReturnType<typeof AutoMovieHumanCanonicalBody.display> =
      AutoMovieHumanCanonicalBody.display(prepared.canonical);
    const file: string = `bodies/${id}.json`;
    fs.writeFileSync(
      path.join(out, file),
      JSON.stringify({ bones: display.bones }),
    );
    const made: ISceneManifest.IBody = {
      file,
      order: display.posed.map((p: { bone: string }): string => p.bone),
      label: PLAYGROUND_BODIES[id]!.label,
      measures: Object.fromEntries(
        Object.entries(prepared.body.measure).filter(
          (entry: [string, unknown]): entry is [string, number] =>
            typeof entry[1] === "number",
        ),
      ),
    };
    part.bodies[id] = made;
    return made;
  };

  const jobs: IJob[] = mine().filter(
    (_job: IJob, i: number): boolean => i % options.shards === shard,
  );

  // Every refused take is reported, not only the first, so one bake shows
  // every scene to correct.
  const refused: string[] = [];
  for (const job of jobs) {
    const { scene, index, composition, digest } = job;
    const label: string = scene.takes[index]!.label;
    const file: string = `${scene.id}/${index}.bin`;
    const figures: ISceneManifest.IFigure[] = composition.performers.map(
      (p: IPlaygroundComposition.IPerformer): ISceneManifest.IFigure => ({
        subject: p.subject,
        body: p.body,
      }),
    );
    for (const figure of figures) body(figure.body);
    const props: string[] = (composition.objects ?? []).map(
      (o: IPlaygroundComposition.IObject): string => o.subject,
    );
    // Each take is saved as soon as it is made, so a bake stopped halfway
    // keeps what it finished.
    const record = (take: ISceneManifest.ITake): void => {
      (part.takes[scene.id] ??= {})[index] = take;
      fs.mkdirSync(parts, { recursive: true });
      fs.writeFileSync(path.join(parts, `${options.runner ?? "local"}-${shard}.json`), JSON.stringify(part));
    };

    // An unchanged take keeps its file.
    const old: ISceneManifest.ITake | undefined = before[scene.id]?.[index];
    if (
      old !== undefined &&
      old.digest === digest &&
      fs.existsSync(path.join(out, file))
    ) {
      record({ ...old, label });
      console.log(`${scene.id} ${index} ${label}: unchanged`);
      continue;
    }

    const t0: number = Date.now();
    let built: PlaygroundPerformance.IBuilt;
    try {
      built = PlaygroundPerformance.build(composition);
    } catch (error) {
      refused.push(
        `The scene ${scene.id}, take ${index} (${label}), was refused: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const planned: number = (Date.now() - t0) / 1000;
    const duration: number = built.performance.duration;
    const count: number = Math.floor(duration * options.fps) + 1;
    const frames: SceneTrack.IPlacement[][][] = [];

    // Each figure's posing time, so the take's slowest action is named.
    const costs: number[] = built.figures.map((): number => 0);
    for (let k: number = 0; k < count; k++) {
      const seconds: number = Math.min(duration, k / options.fps);
      frames.push([
        ...built.figures.map(
          (
            figure: PlaygroundPerformance.IFigure,
            i: number,
          ): SceneTrack.IPlacement[] => {
            const started: number = performance.now();
            const posed: SceneTrack.IPlacement[] =
              AutoMovieHumanCanonicalBody.display(
                figure.canonical,
                built.performance.pose(figure.subject, seconds),
              ).posed;
            costs[i]! += performance.now() - started;
            return posed;
          },
        ),

        // A prop is one entry: the frame it is carried, rests or moves in.
        ...props.map((subject: string): SceneTrack.IPlacement[] => {
          const frame: IHumanProp.IFrame = built.performance.prop(
            subject,
            seconds,
          );
          return [
            {
              bone: PROP,
              position: [frame.position.x, frame.position.y, frame.position.z],
              rotation: [
                frame.rotation.x,
                frame.rotation.y,
                frame.rotation.z,
                frame.rotation.w,
              ],
            },
          ];
        }),
      ]);
    }
    const values: Int16Array = SceneTrack.encode(frames, [
      ...figures.map(
        (f: ISceneManifest.IFigure): string[] => part.bodies[f.body]!.order,
      ),
      ...props.map((): string[] => [PROP]),
    ]);
    fs.mkdirSync(path.join(out, scene.id), { recursive: true });
    fs.writeFileSync(
      path.join(out, file),
      Buffer.from(values.buffer, values.byteOffset, values.byteLength),
    );
    const total: number = (Date.now() - t0) / 1000;
    const slowest: number = costs.indexOf(Math.max(...costs));
    console.log(
      `${scene.id} ${index} ${label}: planned in ${planned.toFixed(1)} s; ${count} frames x ${figures.length} figures posed in ${(total - planned).toFixed(1)} s (${((count * figures.length) / Math.max(1e-3, total - planned)).toFixed(1)} poses/s, slowest ${figures[slowest]?.subject} at ${(costs[slowest]! / count).toFixed(0)} ms a pose); ${(values.byteLength / 1024).toFixed(0)} KiB`,
    );
    record({
      label,
      file,
      fps: options.fps,
      frames: count,
      duration,
      figures,
      props,
      timeline: built.figures.map(
        (figure: PlaygroundPerformance.IFigure): ISceneManifest.ISpan[] =>
          spans(built.performance, figure.subject),
      ),
      digest,
    });
  }

  // Only this share's own part is replaced, so another share's part restored
  // beside it keeps its takes.
  fs.mkdirSync(parts, { recursive: true });
  fs.writeFileSync(path.join(parts, `${options.runner ?? "local"}-${shard}.json`), JSON.stringify(part));
  if (refused.length !== 0) throw new Error(refused.join("\n"));
};

/** Join every share's result into the manifest, checking that every take was baked. */
const merge = (): void => {
  const manifest: ISceneManifest = {
    version: 1,
    reflection: [...AutoMovieHumanCanonicalBody.REFLECTION],
    bodies: {},
    scenes: {},
  };
  // A part left by an earlier run may name a take again; only an entry baked
  // from the current inputs is taken.
  const takes: ISceneManifest.ITake[] = [];
  for (const name of fs.existsSync(parts) ? fs.readdirSync(parts) : []) {
    const part: IPart = JSON.parse(
      fs.readFileSync(path.join(parts, name), "utf8"),
    );
    Object.assign(manifest.bodies, part.bodies);
    for (const byIndex of Object.values(part.takes))
      takes.push(...Object.values(byIndex));
  }
  for (const job of plan()) {
    const take: ISceneManifest.ITake | undefined = takes.find(
      (t: ISceneManifest.ITake): boolean => t.digest === job.digest,
    );
    if (take === undefined)
      throw new Error(
        `The take ${job.index} of ${job.scene.id} was not baked from the current inputs by any share`,
      );
    (manifest.scenes[job.scene.id] ??= { takes: [] }).takes[job.index] = {
      ...take,
      label: job.scene.takes[job.index]!.label,
    };
  }
  fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest));
  fs.rmSync(parts, { recursive: true, force: true });
  const bytes: number = Object.values(manifest.scenes)
    .flatMap((s: ISceneManifest.IScene): ISceneManifest.ITake[] => s.takes)
    .reduce(
      (sum: number, take: ISceneManifest.ITake): number =>
        sum + fs.statSync(path.join(out, take.file)).size,
      0,
    );
  console.log(
    `bake: ${Object.keys(manifest.scenes).length} scenes, ${(bytes / 1048576).toFixed(1)} MiB of tracks`,
  );
};

/** Bake every share in its own process on this machine, then join them. */
const local = async (): Promise<void> => {
  const started: number = Date.now();
  const run = (shard: number): Promise<void> =>
    new Promise((resolve: () => void, reject: (error: Error) => void): void => {
      spawn(
        process.execPath,
        [
          ...process.execArgv,
          __filename,
          ...argv,
          "--shard",
          String(shard),
          "--shards",
          String(options.shards),
        ],
        { stdio: "inherit", env: process.env },
      ).on("exit", (code: number | null): void =>
        code === 0
          ? resolve()
          : reject(new Error(`Share ${shard} of the bake failed`)),
      );
    });
  const settled: PromiseSettledResult<void>[] = await Promise.allSettled(
    Array.from({ length: options.shards }, (_: unknown, k: number) => run(k)),
  );
  const failed: number = settled.filter(
    (s: PromiseSettledResult<void>): boolean => s.status === "rejected",
  ).length;
  if (failed !== 0)
    throw new Error(`${failed} of ${options.shards} shares of the bake failed`);

  // A machine baking one runner's part leaves its parts for the job that
  // joins every runner's; on its own it joins them itself.
  if (options.runner === null) merge();
  console.log(
    `bake: ${options.shards} shares in ${((Date.now() - started) / 1000).toFixed(1)} s`,
  );
};

/** Plan each named action alone on one standing person with no parameters, and say whether the package plans it, refuses it in its own words, or fails in its code. */
const rows = (): void => {
  for (const name of options.rows) {
    const composition: IPlaygroundComposition = {
      version: 1,
      seed: "row",
      performers: [
        {
          subject: "a",
          body: "m1",
          x: 0,
          z: 0,
          yaw: 0,
          proficiency: "trained",
          actions: [
            { name: "stand", params: { seconds: 0.3 } },
            { name, params: {} },
          ],
        },
      ],
      mutuals: [],
    };
    try {
      PlaygroundPerformance.build(composition);
      console.log(`${name}: plans`);
    } catch (error) {
      const refusal: boolean =
        typeof error === "object" && error !== null && "axis" in error;
      console.log(
        `${name}: ${refusal ? "refuses" : "fails in the package"}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
};

/** Plan the first take of every scene that plays, without posing it, and list every refusal and every scene that waits. */
const check = (): void => {
  if (options.rows.length !== 0) return rows();
  const refused: string[] = [];
  for (const scene of SCENES) {
    if (options.only.length !== 0 && !options.only.includes(scene.id)) continue;
    const status: SceneStatus.Status = SceneStatus.of(scene);
    if (status.kind !== "plays") {
      console.log(
        `${scene.id}: ${status.kind}${status.kind === "waits" ? ` for ${status.missing.join(", ")}` : ""}`,
      );
      continue;
    }
    const t0: number = Date.now();
    try {
      const built: PlaygroundPerformance.IBuilt = PlaygroundPerformance.build(
        SceneTake.apply(scene.composition!, scene.takes[0]!),
      );
      const planned: number = (Date.now() - t0) / 1000;

      // A few poses of each figure, spread over the film, show what posing
      // will cost and which figure costs most.
      const costs: string[] = built.figures.map(
        (figure: PlaygroundPerformance.IFigure): string => {
          const started: number = performance.now();
          for (let k: number = 1; k <= 4; k++)
            built.performance.pose(figure.subject, (built.performance.duration * k) / 5);
          return `${figure.subject} ${((performance.now() - started) / 4).toFixed(0)} ms`;
        },
      );
      console.log(
        `${scene.id}: plans, ${built.performance.duration.toFixed(1)} s of film, planned in ${planned.toFixed(1)} s; a pose: ${costs.join(", ")}`,
      );
    } catch (error) {
      // Printed at once as well, so a check stopped halfway keeps its findings.
      const line: string = `${scene.id}: refused: ${error instanceof Error ? error.message : String(error)}`;
      console.log(line);
      refused.push(line);
    }
  }
  if (refused.length !== 0) throw new Error(refused.join("\n"));
};

const main = async (): Promise<void> => {
  if (options.check) check();
  else if (options.merge) merge();
  else if (options.shard !== null) bake(options.shard);
  else await local();
};
main().catch((error: unknown): void => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
