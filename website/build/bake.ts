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
import type { IHumanProp } from "@automovie/motions";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { PLAYGROUND_BODIES } from "../src/playground/data/PLAYGROUND_BODIES";
import { PlaygroundBodies } from "../src/playground/package/PlaygroundBodies";
import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";
import { SceneTrack } from "../src/scenes/SceneTrack";
import type { ISceneManifest } from "../src/scenes/structures/ISceneManifest";
import { BakeCheck } from "./BakeCheck";
import { BakeSetup } from "./BakeSetup";

type IJob = BakeSetup.IJob;
type IPart = BakeSetup.IPart;
const { PROP, argv, mine, options, out, parts, plan, previous, spans } =
  BakeSetup;

/** Bake one share of the jobs and write what it made. */
const bake = (shard: number): void => {
  const before: Record<
    string,
    Record<number, ISceneManifest.ITake>
  > = previous();
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
      fs.writeFileSync(
        path.join(parts, `${options.runner ?? "local"}-${shard}.json`),
        JSON.stringify(part),
      );
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
    let planned: number = 0;
    let duration: number = 0;
    let count: number = 0;
    const frames: SceneTrack.IPlacement[][][] = [];

    // Each figure's posing time, so the take's slowest action is named.
    const costs: number[] = [];

    // A law may refuse while a frame is posed as well as while the chain is
    // planned; either refusal is this take's alone, so the share goes on.
    try {
      built = PlaygroundPerformance.build(composition);
      planned = (Date.now() - t0) / 1000;
      duration = built.performance.duration;
      count = Math.floor(duration * options.fps) + 1;
      costs.push(...built.figures.map((): number => 0));
      for (let k: number = 0; k < count; k++) {
        const seconds: number = k / options.fps;
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
                position: [
                  frame.position.x,
                  frame.position.y,
                  frame.position.z,
                ],
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
    } catch (error) {
      // Printed at once as well, so a bake stopped halfway keeps its findings.
      const line: string = `The scene ${scene.id}, take ${index} (${label}), was refused: ${error instanceof Error ? error.message : String(error)}`;
      console.log(line);
      refused.push(line);
      continue;
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
  fs.writeFileSync(
    path.join(parts, `${options.runner ?? "local"}-${shard}.json`),
    JSON.stringify(part),
  );
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

const main = async (): Promise<void> => {
  if (options.check) BakeCheck.check();
  else if (options.merge) merge();
  else if (options.shard !== null) bake(options.shard);
  else await local();
};
main().catch((error: unknown): void => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
