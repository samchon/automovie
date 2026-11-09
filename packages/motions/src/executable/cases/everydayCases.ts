import type { AutoMovieMotionTarget, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { createHumanBody } from "../../body/createHumanBody";
import type { IHumanBody } from "../../body/IHumanBody";
import type { gestureStroke } from "../../everyday/gestureStroke";
import { seated } from "../../everyday/seated";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";

/**
 * Capture cases of the everyday laws on the polygon man, for inspecting
 * what the numeric tests cannot show: whether an approach looks like
 * someone walking up to a partner, whether gestures read, where rest places
 * put the hands, and how sitting, rising and bending move the body.
 *
 * - `everyday-approach`: the tall man walks up to the small woman and stops
 *   at a personal gap; instants at the start, mid-walk, the last footfall and
 *   the arrival; the partner's sternum is marked.
 * - `everyday-look`: the average man looks at a point 50 degrees to his left
 *   and up, then at the floor ahead.
 * - `everyday-gesture-<kind>`: one case per gesture on the average man, at
 *   rest, mid-preparation, the stroke's start, middle and end, mid-retraction
 *   and the end; a pointing target is marked.
 * - `everyday-rest`: each rest place in turn, held.
 * - `everyday-seat`: sitting on a box seat at the knee's height, shifting and
 *   rising, at every event.
 * - `everyday-bend`: a stoop, a semi-squat and a squat to a floor point.
 *
 * @param family One family (`approach`, `look`, `gesture`, `rest`, `seat`, `bend`) or every family when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and its instants.
 * @evidence contracts/development/implementation.md#principled-implementation Each case runs the real performance and samples its displayed poses at the laws' own events.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One small builder per family over a shared performance sampler.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Instants come from the plans' events, not fixed seconds.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case; poses are sampled only at drawn instants.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function everydayCases(family?: "approach" | "look" | "gesture" | "rest" | "seat" | "bend"): IMotionCaptureCase[] {
  const wants = (name: string): boolean => family === undefined || family === name;
  const average: humanPolygonMan.IPolygonMan = MotionBodies.population("m-average");
  const out: IMotionCaptureCase[] = [];

  // Approach.
  if (wants("approach")) {
  const tall: humanPolygonMan.IPolygonMan = MotionBodies.population("m-tall");
  const small: humanPolygonMan.IPolygonMan = MotionBodies.population("f-small");
  const approach: HumanPerformance = perform(
    [
      [tall, { x: 0, y: 0, z: 0 }, 0],
      [small, { x: 0.4, y: 0, z: 3.2 }, 180],
    ],
    HumanChain.subject("a").approach({ target: { kind: "person", subject: "b", region: "sternum" }, at: "personal" }).with(HumanChain.subject("b").stand({ seconds: 8 })),
  );
  const walking = approach.segments("a")[0]!;
  out.push({
    name: "everyday-approach",
    times: [
      { seconds: 0, label: "start" },
      { seconds: walking.end / 2, label: "walking" },
      { seconds: event(approach, "a", 0, "lastFootfall"), label: "last footfall" },
      { seconds: walking.end, label: "arrive" },
    ],
    performers: [figure(approach, "a", tall), figure(approach, "b", small, 0x7a8fa6)],
    targets: [{ at: approach.aim({ kind: "person", subject: "b", region: "sternum" }, walking.end, frame()).point, radius: 0.03, color: 0xd04040 }],
  });

  }

  // Look.
  if (wants("look")) {
  const sidePoint: IAutoMovieVector3 = { x: 2 * Math.sin((50 * Math.PI) / 180), y: 2.2, z: 2 * Math.cos((50 * Math.PI) / 180) };
  const floorPoint: IAutoMovieVector3 = { x: 0, y: 0, z: 1.2 };
  const side: AutoMovieMotionTarget = { kind: "point", at: sidePoint, frame: "world" };
  const floor: AutoMovieMotionTarget = { kind: "point", at: floorPoint, frame: "world" };
  const look: HumanPerformance = perform([[average, { x: 0, y: 0, z: 0 }, 0]], HumanChain.subject("a").look({ target: side, seconds: 1.2 }).look({ target: floor, seconds: 1.2 }));
  out.push({
    name: "everyday-look",
    times: [
      { seconds: 0, label: "start" },
      { seconds: event(look, "a", 0, "settled"), label: "side settled" },
      { seconds: event(look, "a", 1, "settled"), label: "floor settled" },
    ],
    performers: [figure(look, "a", average)],
    targets: [sidePoint, floorPoint].map((at: IAutoMovieVector3) => ({ at, radius: 0.04, color: 0xd04040 })),
  });

  }

  // Gestures.
  if (wants("gesture")) {
  const goal: IAutoMovieVector3 = { x: 1.5, y: 2.2, z: 3 };
  const kinds: gestureStroke.Kind[] = ["wave", "raiseHand", "cheer", "stopPalm", "point", "palmsUp", "beckon", "clap", "rubHands", "touchFace", "pushGlasses", "scratchHead", "shrug", "nod", "shakeHead", "bow", "chinLift", "squareShoulders", "slump"];
  for (const kind of kinds) {
    const g: HumanPerformance = perform([[average, { x: 0, y: 0, z: 0 }, 0]], HumanChain.subject("a").gesture({ kind, ...(kind === "point" ? { target: { kind: "point", at: goal, frame: "world" } } : {}) }));
    const s: number = event(g, "a", 0, "strokeStart");
    const e: number = event(g, "a", 0, "strokeEnd");
    const r: number = event(g, "a", 0, "retract");
    const end: number = g.segments("a")[0]!.end;
    out.push({
      name: `everyday-gesture-${kind}`,
      times: [
        { seconds: 0, label: "rest" },
        { seconds: s / 2, label: "prepare" },
        { seconds: s, label: "stroke start" },
        { seconds: (s + e) / 2, label: "stroke" },
        { seconds: e, label: "stroke end" },
        { seconds: (r + end) / 2, label: "retract" },
        { seconds: end, label: "end" },
      ],
      performers: [figure(g, "a", average)],
      ...(kind === "point" ? { targets: [{ at: goal, radius: 0.05, color: 0xd04040 }] } : {}),
    });
  }

  }

  // Rest places.
  if (wants("rest")) {
  const places = [["pocket", "pocket"], ["hip", "hip"], ["crossed", "crossed"], ["claspedFront", "claspedFront"], ["claspedBehind", "claspedBehind"], ["behindHead", "behindHead"], ["side", "chinRest"]] as const;
  let chain: HumanChain = HumanChain.subject("a");
  for (const [left, right] of places) chain = chain.rest({ left, right, seconds: 1.5 });
  const resting: HumanPerformance = perform([[average, { x: 0, y: 0, z: 0 }, 0]], chain);
  out.push({
    name: "everyday-rest",
    times: resting.segments("a").map((seg, i: number) => ({ seconds: seg.end - 0.05, label: places[i]![1] })),
    performers: [figure(resting, "a", average)],
  });

  }

  // Seat.
  if (wants("seat")) {
  const body: IHumanBody = createHumanBody(average.body.skeleton, average.body.profile);
  const seat: seated.ISeat = { at: { x: 0, y: seated.knee(body), z: body.rest.get("leftFoot")!.z - 0.1 }, yaw: 0, depth: 0.45 };
  const sitting: HumanPerformance = perform([[average, { x: 0, y: 0, z: 0 }, 0]], HumanChain.subject("a").sit({ seat, seconds: 0.5 }).shift({ by: 0.12 }).rise());
  const [sit, shift, rise] = sitting.segments("a");
  out.push({
    name: "everyday-seat",
    times: [
      { seconds: 0, label: "standing" },
      { seconds: event(sitting, "a", 0, "seatContact") / 2, label: "lowering" },
      { seconds: event(sitting, "a", 0, "seatContact"), label: "seat contact" },
      { seconds: sit!.end, label: "seated" },
      { seconds: (shift!.entryTime + shift!.end) / 2, label: "shifting" },
      { seconds: event(sitting, "a", 2, "seatOff"), label: "seat off" },
      { seconds: event(sitting, "a", 2, "standing"), label: "standing" },
      { seconds: rise!.end, label: "end" },
    ],
    performers: [figure(sitting, "a", average)],
    boxes: [{ centre: { x: seat.at.x + 0.1, y: seat.at.y / 2, z: seat.at.z - 0.225 }, half: { x: 0.45, y: seat.at.y / 2, z: 0.225 }, color: 0x9a7b55 }],
  });

  }

  // Bend.
  if (wants("bend")) {
  const point: IAutoMovieVector3 = { x: -0.15, y: 0, z: 0.45 };
  const bending: HumanPerformance = perform(
    [[average, { x: 0, y: 0, z: 0 }, 0]],
    HumanChain.subject("a")
      .bend({ toward: { kind: "point", at: point, frame: "world" }, strategy: "stoop" })
      .bend({ toward: { kind: "point", at: point, frame: "world" }, strategy: "semiSquat" })
      .bend({ toward: { kind: "point", at: point, frame: "world" }, strategy: "squat" }),
  );
  out.push({
    name: "everyday-bend",
    times: [0, 1, 2].map((i: number) => ({ seconds: event(bending, "a", i, "deepest"), label: ["stoop", "semi-squat", "squat"][i]! })),
    performers: [figure(bending, "a", average)],
    targets: [{ at: point, radius: 0.03, color: 0xd04040 }],
  });
  }

  return out;
}

/** A performance of polygon men at places and headings. */
function perform(people: [humanPolygonMan.IPolygonMan, IAutoMovieVector3, number][], chain: HumanChain): HumanPerformance {
  return new HumanPerformance({
    seed: "everyday",
    performers: people.map(([man, at, yaw], i: number) => ({
      subject: i === 0 ? "a" : "b",
      body: createHumanBody(man.body.skeleton, man.body.profile),
      at,
      yaw,
      proficiency: { level: "trained" as const },
    })),
    composition: chain.node,
  });
}

/** A drawn performer. */
function figure(performance: HumanPerformance, subject: string, man: humanPolygonMan.IPolygonMan, color?: number): IMotionCaptureCase.IPerformer {
  return { id: subject, body: man.body, pose: (seconds: number): IAutoMoviePose => performance.pose(subject, seconds), ...(color === undefined ? {} : { color }) };
}

/** The film second of an event of a person's n-th action. */
function event(performance: HumanPerformance, subject: string, index: number, name: string): number {
  const segment = performance.segments(subject)[index]!;
  return segment.start + segment.plan.events.find((e) => e.name === name)!.share * segment.plan.duration;
}

/** A neutral aiming frame, for reading person targets. */
function frame(): { root: IAutoMovieVector3; yaw: number; heights: Record<"low" | "middle" | "high", number>; range: number } {
  return { root: { x: 0, y: 0, z: 0 }, yaw: 0, heights: { low: 0, middle: 0, high: 0 }, range: 1 };
}
