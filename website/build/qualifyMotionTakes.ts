import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { gunzipSync, gzipSync } from "node:zlib";

import { BakedTake } from "../src/baked/BakedTake";
import { FigurePoster } from "../src/baked/FigurePoster";
import type { IBakeJob } from "../src/baked/IBakeJob";
import { PropShapes } from "../src/baked/PropShapes";
import { MotionUsage } from "../src/motions/MotionUsage";
import { SCENES } from "../src/scenes/SCENES";
import { SCENE_FPS } from "../src/scenes/SCENE_FPS";
import { SceneTake } from "../src/scenes/SceneTake";
import { SceneStatus } from "../src/scenes/package/SceneStatus";
import type { IScene } from "../src/scenes/structures/IScene";
import { TakeCompute } from "../src/takes/package/TakeCompute";
import type { ITake } from "../src/takes/structures/ITake";

/** Existing consumers of the changed travel, striking and swimming laws. */
const IDS: readonly string[] = [
  "walk-and-talk",
  "change-of-mind",
  "ball-yard",
  "volleyball",
  "low-table-scramble",
  "relay",
  "five-a-side",
  "vault-hall",
  "kickboxing-round",
  "boxing-counters",
  "pool",
  "swim-strokes",
  "swim",
  "treadWater",
  "frontCrawl",
  "breaststroke",
  "backstroke",
  "floating",
];

/** Resolve the same first scene take or standalone trial the bake uses. */
function job(id: string): IBakeJob {
  const scene: IScene | undefined = SCENES.find((item) => item.id === id);
  if (scene !== undefined) {
    assert(scene.composition && scene.takes[0], `${id} has no first take`);
    assert.equal(SceneStatus.of(scene).kind, "plays", `${id} cannot play`);
    return {
      kind: "scene",
      id,
      composition: SceneTake.apply(scene.composition, scene.takes[0]),
      view: scene.camera.view,
      from: 0,
    };
  }
  const trial: MotionUsage.ITrial | null = MotionUsage.trial(id);
  assert(trial?.alone, `${id} has no standalone take`);
  return {
    kind: "motion",
    id,
    composition: trial.composition,
    view: "three-quarter",
    from: MotionUsage.OPENING,
  };
}

/**
 * Read one real join with its neighbors and a separate off-grid time, then
 * repeat those samples out of order. This exercises seeking in the same SDK
 * performance that produced the baked track. The motion law tests check the
 * physical limits of specific supports, strikes and joins.
 */
function seek(built: IAutoMovieMotionHumanPerformance): number {
  const start: number = performance.now();
  const boundary: number | undefined = built.performers
    .flatMap(({ subject }): readonly IAutoMovieMotionHumanSegment[] =>
      built.segments(subject),
    )
    .slice(1)
    .find(
      ({ entryTime }): boolean => entryTime > 0 && entryTime < built.duration,
    )?.entryTime;
  const between: number = built.duration * 0.617;
  const times: number[] =
    boundary === undefined
      ? [between, built.duration]
      : [
          Math.max(0, boundary - 0.0001),
          boundary,
          Math.min(built.duration, boundary + 0.0001),
          between,
        ].sort((a: number, b: number): number => a - b);
  const read = (at: number) =>
    built.performers.map(({ subject }) => {
      const hips = built.bones(subject, at).get("hips");
      assert(hips, `${subject} has no displayed hips at ${at} s`);
      assert(
        Object.values(hips.worldPosition).every(Number.isFinite) &&
          Object.values(hips.worldRotation).every(Number.isFinite),
        `${subject} has a non-finite displayed transform at ${at} s`,
      );
      return hips;
    });
  const ordered: ReturnType<typeof read>[] = times.map(read);
  for (let index: number = times.length - 1; index >= 0; --index)
    assert.deepEqual(
      read(times[index]!),
      ordered[index],
      `seek at ${times[index]} s`,
    );
  return performance.now() - start;
}

/** The athlete's hands release while the knee and foot still bear on the table. */
function checkScramble(built: IAutoMovieMotionHumanPerformance): void {
  const scramble: IAutoMovieMotionHumanSegment | undefined = built
    .segments("ath")
    .find(({ name }): boolean => name === "scramble");
  assert(scramble, "the athlete has no scramble");
  const released: number | undefined = scramble.plan.events.find(
    ({ name }): boolean => name === "handsFree",
  )?.share;
  assert(released !== undefined, "the scramble has no hand release");
  const bearing: typeof scramble.plan.contacts = scramble.plan.contacts.filter(
    ({ from, to }): boolean => from <= released && released <= to,
  );
  assert.deepEqual(bearing.map(({ part }) => part).sort(), [
    "leftFoot",
    "rightLowerLeg",
  ]);
  assert(
    bearing.every(
      ({ support }): boolean =>
        support.kind === "prop" &&
        support.subject === "table" &&
        support.point === "front",
    ),
    "the knee and foot keep the table's material frame",
  );
}

/** Run one uncached take through the website's sample and bake contracts. */
function qualify(id: string): void {
  const item: IBakeJob = job(id);
  let preparationMs: number = 0;
  let samplingMs: number = 0;
  let built: IAutoMovieMotionHumanPerformance | undefined;
  const made: ReturnType<typeof TakeCompute.take> = TakeCompute.take(
    item.composition,
    SCENE_FPS,
    (result, prepared, sampled): void => {
      built = result;
      preparationMs = prepared;
      samplingMs = sampled;
    },
  );
  assert("track" in made, "message" in made ? made.message : undefined);
  const start: number = performance.now();
  const compressed: Buffer = gzipSync(BakedTake.encode(made), { level: 9 });
  const poster: string = FigurePoster.draw(made, {
    view: item.view,
    from: item.from,
    ghosts: item.kind === "scene" ? 3 : 5,
    window: item.kind === "scene" ? 1.6 : undefined,
    props: PropShapes.of(item.composition.objects ?? []),
  });
  const bakeMs: number = performance.now() - start;
  const decoded: ITake = BakedTake.decode(gunzipSync(compressed));
  assert(poster.startsWith("<svg"), "the take has no SVG poster");
  assert.equal(decoded.duration, made.duration);
  assert.equal(decoded.track.frames, made.track.frames);
  assert.deepEqual(decoded.track.values, made.track.values);
  assert(built);
  if (id === "low-table-scramble") checkScramble(built);
  const seekMs: number = seek(built);
  console.log(
    JSON.stringify({
      id,
      frames: made.track.frames,
      preparationMs: Math.round(preparationMs),
      samplingMs: Math.round(samplingMs),
      bakeMs: Math.round(bakeMs),
      seekMs: Math.round(seekMs),
    }),
  );
}

console.log(
  JSON.stringify({
    revision: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
    trackedChanges:
      execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
        encoding: "utf8",
      }).trim() !== "",
    node: process.version,
    fps: SCENE_FPS,
  }),
);
const selected: string[] = process.argv
  .slice(2)
  .filter((arg: string): boolean => arg !== "--");
for (const id of selected.length === 0 ? IDS : selected) {
  try {
    qualify(id);
  } catch (error: unknown) {
    process.exitCode = 1;
    console.error(JSON.stringify({ id, error: String(error) }));
  }
}
