import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSwim,
} from "@automovie/interface";
import { AutoMovieMotionHumanChain, AutoMovieMotionHumanPerformance } from "@automovie/motions";
import {
  FamilyCaseKit
} from "../../../../../packages/motions/src/executable/cases/FamilyCaseKit";
import {
  swim
} from "../../../../../packages/motions/src/sport/internal/swim";
import { TestValidator } from "@nestia/e2e";

const ACTOR = "a";
const WATER = 0.8;
const SAMPLE = 1 / 240;
type Stroke = IAutoMovieMotionHumanSwim.Kind;

/** A surface swimmer keeps the waterline and continues from its displayed pose. */
export function test_motions_sport_swim_modes(): void {
  const { body }: FamilyCaseKit.IBody = FamilyCaseKit.body("m-average");
  for (const [stroke, seconds] of [
    ["frontCrawl", 1.4],
    ["treadWater", 1],
    ["backstroke", 1.4],
    ["breaststroke", 1.35],
    ["float", 2],
  ] as const) {
    const take: AutoMovieMotionHumanPerformance = film(body, [stroke]);
    TestValidator.predicate(
      `${stroke} keeps its single cycle clock`,
      () => Math.abs(take.duration - seconds) < 1e-9,
    );
  }

  for (const strokes of [
    ["frontCrawl", "treadWater", "float"],
    ["backstroke", "treadWater"],
    ["breaststroke", "treadWater"],
    ["treadWater", "frontCrawl"],
    ["frontCrawl", "backstroke"],
    ["backstroke", "frontCrawl"],
  ] as const) {
    const take: AutoMovieMotionHumanPerformance = film(body, strokes);
    const segments = take.segments(ACTOR);
    for (let i: number = 1; i < strokes.length; ++i) {
      const before: Stroke = strokes[i - 1]!;
      const after: Stroke = strokes[i]!;
      const segment: IAutoMovieMotionHumanSegment = segments[i]!;
      const middle: number = segment.start + 0.78;
      const hips = take.bones(ACTOR, middle).get("hips")!.worldPosition;
      const chest = take.bones(ACTOR, middle).get("chest")!.worldPosition;
      continuous(take, segment.start, `${before} to ${after}`);
      if (after === "treadWater")
        TestValidator.predicate(`${before} to upright breathing tread`, () => {
          const later = take.bones(ACTOR, segment.end - SAMPLE);
          return (
            chest.y - hips.y > 0.3 &&
            Math.abs(mouth(take, body, middle) - (WATER + 0.05)) < 0.002 &&
            AutoMovieEngineVector3.distance(hips, later.get("hips")!.worldPosition) < 0.002
          );
        });
      if (after === "frontCrawl") breath(take, body, segment);
      if (
        (before === "frontCrawl" && after === "backstroke") ||
        (before === "backstroke" && after === "frontCrawl")
      )
        TestValidator.predicate(
          "an opposite heading rolls on the surface",
          () => {
            for (let t = segment.start; t < segment.start + 0.65; t += 1 / 60) {
              const bones = take.bones(ACTOR, t);
              if (
                Math.abs(bones.get("head")!.worldPosition.y - WATER) > 0.19 ||
                Math.abs(
                  bones.get("chest")!.worldPosition.y -
                    bones.get("hips")!.worldPosition.y,
                ) > 0.14
              )
                return false;
            }
            return true;
          },
        );
    }
  }

  const repeat: AutoMovieMotionHumanPerformance = film(body, ["frontCrawl", "frontCrawl"]);
  const longer: AutoMovieMotionHumanPerformance = film(body, ["frontCrawl"], 2);
  const next = repeat.segments(ACTOR)[1]!;
  continuous(repeat, next.start, "consecutive crawl cycles");
  breath(repeat, body, next);
  for (const t of [2.37, 1.65, 2.73, 1.4, 2.37]) {
    const a = repeat.bones(ACTOR, t);
    const b = longer.bones(ACTOR, t);
    TestValidator.predicate("two crawls match one two-cycle take", () =>
      (["hips", "chest", "leftHand", "rightFoot"] as const).every(
        (bone) =>
          AutoMovieEngineVector3.distance(
            a.get(bone)!.worldPosition,
            b.get(bone)!.worldPosition,
          ) < 0.002,
      ),
    );
  }
}

function film(
  body: IAutoMovieMotionHumanBody,
  strokes: readonly Stroke[],
  count: number = 1,
): AutoMovieMotionHumanPerformance {
  let chain = AutoMovieMotionHumanChain.subject(ACTOR);
  for (const kind of strokes) chain = chain.swim({ kind, water: WATER, count });
  return new AutoMovieMotionHumanPerformance({
    seed: "swim-mode-entry",
    performers: [
      {
        subject: ACTOR,
        body,
        yaw: 25,
        at: { x: 0, y: 0, z: -3 },
        proficiency: { level: "trained" },
      },
    ],
    composition: chain.node,
  });
}

function continuous(take: AutoMovieMotionHumanPerformance, cut: number, label: string): void {
  const at = take.bones(ACTOR, cut);
  for (const t of [cut - SAMPLE, cut + SAMPLE]) {
    const edge = take.bones(ACTOR, t);
    TestValidator.predicate(`${label} has no cut jump`, () =>
      (["hips", "leftHand", "rightHand"] as const).every(
        (bone) =>
          AutoMovieEngineVector3.distance(
            edge.get(bone)!.worldPosition,
            at.get(bone)!.worldPosition,
          ) < (bone === "hips" ? 0.009 : 0.028),
      ),
    );
  }
}

function mouth(
  take: AutoMovieMotionHumanPerformance,
  body: IAutoMovieMotionHumanBody,
  t: number,
): number {
  const local = body.surfaces.regions.mouth;
  const frame = take.bones(ACTOR, t).get(local.bone)!;
  return (
    frame.worldPosition.y +
    AutoMovieEngineQuaternion.rotateVector(frame.worldRotation, local.point).y
  );
}

function breath(
  take: AutoMovieMotionHumanPerformance,
  body: IAutoMovieMotionHumanBody,
  segment: IAutoMovieMotionHumanSegment,
): void {
  const cue = segment.plan.events.find((event) => event.name === "breath1")!;
  const t: number = segment.start + cue.share * segment.plan.duration;
  TestValidator.predicate(
    "the crawl's breathing cue reaches the plane's clearance",
    () => Math.abs(mouth(take, body, t) - (WATER + swim.CLEAR)) < 0.004,
  );
}
