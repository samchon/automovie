import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLogRoll,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { prepareHumanShapeBlend } from "../handling/prepareHumanShapeBlend";
import { HumanRefusal } from "../law/HumanRefusal";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { knockdown } from "../reaction/knockdown";
import { lieDownPoses } from "./lieDownPoses";
import { lyingTurn } from "./lyingTurn";

/** Seconds of each half turn (provisional). */
const HALF: number = 0.7;

/**
 * The straight log: legs extended, arms overhead along the long axis
 * (provisional angles).
 */
const LOG: IAutoMovieMotionHumanPosture["joints"] = {
  ...lieDownPoses.POSES.supine.joints,
  leftUpperLeg: [0, 3, 0],
  rightUpperLeg: [0, 3, 0],
  leftLowerLeg: [3, 0, 0],
  rightLowerLeg: [3, 0, 0],
  leftUpperArm: [160, 5, 0],
  rightUpperArm: [160, 5, 0],
  leftLowerArm: [10, 0, 0],
  rightLowerArm: [10, 0, 0],
};

/**
 * Log-roll across the floor. The lying body straightens into a log, legs
 * extended and arms overhead, and rolls about its long axis (`lyingTurn`)
 * toward the named side, half a turn per `HALF` seconds. It rolls without
 * slipping: the pelvis advances along that side by the arc of the trunk's
 * cross-section rolled, half the perimeter of the chest's ellipse (Ramanujan's
 * approximation) per half turn, and the root rests the lowest collision shape
 * on the floor at every second (`knockdown.rest`). A count gives the half
 * turns; a place gives as many as bring the pelvis nearest it, rounded to the
 * `end` position's parity. Naming both or neither, or a body not lying, is
 * refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the posture, the turn, the rolling advance and its source, the count rule and the refusals.
 */
function planLogRoll(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLogRoll>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanLogRoll = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  if (context.entry.base.kind !== "lying")
    throw new HumanRefusal({
      kind: "base",
      axis: "toward",
      value: p.toward,
      reason: "a log roll starts lying",
      fix: "lie down first",
    });
  if ((p.halfTurns === undefined) === (p.to === undefined))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "halfTurns",
      value: p.halfTurns ?? "none",
      reason: `a log roll names ${p.to === undefined ? "neither" : "both"} a count of half turns and a place`,
      fix: "give either the half turns or the place",
    });
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const from: lyingTurn.ITurn = lyingTurn.of(entry);
  const sign: number = p.toward === "left" ? 1 : -1;
  // The body's left when supine; turning positive rolls the body toward it.
  const left: IAutoMovieVector3 = {
    x: Math.cos((from.yaw * Math.PI) / 180),
    y: 0,
    z: -Math.sin((from.yaw * Math.PI) / 180),
  };
  const travel: IAutoMovieVector3 = Vector3.scale(left, sign);
  const step: number = perimeter(body) / 2;
  const hips: IAutoMovieVector3 = Vector3.add(
    entry.root,
    Quaternion.rotateVector(humanPostureHeading(entry), body.rest.get("hips")!),
  );
  const halves: number = count(p, from.turn, step, hips, travel);
  const target: number = from.turn + sign * 180 * halves;
  const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
    AutoMovieMotionClock.sequence([
      { name: "rolling", seconds: HALF * halves },
      { name: "rolled", seconds: 0 },
      { name: "settled", seconds: 0 },
    ]),
    AutoMovieMotionManner.of(context, p.manner),
    { holds: ["settled"] },
  );
  const progress: ReturnType<typeof AutoMovieMotionClock.prepare> =
    AutoMovieMotionClock.prepare(clock, "rolling", "rolled");
  const straighten: (w: number) => IAutoMovieMotionHumanPosture["joints"] =
    prepareHumanShapeBlend(entry.joints, LOG);
  const rest: ReturnType<typeof knockdown.prepareRest> =
    knockdown.prepareRest(body);
  const at: (
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanPosture = (
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture => {
    const u: number = progress.progress(seconds);
    const turn: number = from.turn + (target - from.turn) * u;
    const posture: IAutoMovieMotionHumanPosture = {
      ...lyingTurn.tilt({ yaw: from.yaw, turn }),
      root: { x: 0, y: 0, z: 0 },
      // The log forms over the first half turn and is kept.
      joints: straighten(Math.min(1, u * halves)),
      limbs: {},
    };
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      humanPostureHeading(posture),
      body.rest.get("hips")!,
    );
    const pelvis: IAutoMovieVector3 = Vector3.add(
      hips,
      Vector3.scale(travel, (step * Math.abs(turn - from.turn)) / 180),
    );
    return {
      ...posture,
      root: {
        x: pelvis.x - offset.x,
        y: rest(
          posture,
          prepareHumanPoseResolution(resolution),
          projection ?? prepareHumanPostureProjection(body),
        ),
        z: pelvis.z - offset.z,
      },
    };
  };
  const duration: number = clock.duration;
  const rolling: IAutoMovieMotionHumanPrimitive = {
    channels: [
      "root",
      "trunk",
      "head",
      "leftLeg",
      "rightLeg",
      "leftArm",
      "rightArm",
    ],
    reads: [],
    from: 0,
    to: duration,
    write: (
      _: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => at(seconds, resolution, projection),
  };
  // The contact parts have no side or chest; the trunk's window is the back's throughout.
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: "back",
      kind: "lie",
      from: 0,
      to: 1,
      support: { kind: "ground" },
    },
  ];
  const planned: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, entry, contacts),
      clock,
      contact: "settled",
      primitives: [rolling],
    });
  return { ...planned, base: { kind: "lying" } };
}

/**
 * Log-roll across the floor. The lying body straightens into a log, legs
 * extended and arms overhead, and rolls about its long axis (`lyingTurn`)
 * toward the named side, half a turn per `HALF` seconds. It rolls without
 * slipping: the pelvis advances along that side by the arc of the trunk's
 * cross-section rolled, half the perimeter of the chest's ellipse (Ramanujan's
 * approximation) per half turn, and the root rests the lowest collision shape
 * on the floor at every second (`knockdown.rest`). A count gives the half
 * turns; a place gives as many as bring the pelvis nearest it, rounded to the
 * `end` position's parity. Naming both or neither, or a body not lying, is
 * refused.
 */
export const logRoll: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLogRoll> =
  {
    name: "logRoll",
    interrupts: {
      any: [{ window: ["settled", 1], kind: "inertialize", entry: 0 }],
    },
    plan: planLogRoll,
  };

/**
 * The chest's cross-section perimeter, metres: Ramanujan's approximation for
 * the ellipse of its breadth and depth.
 */
function perimeter(body: IAutoMovieMotionHumanBody): number {
  const a: number = body.measure.chestBreadth / 2;
  const b: number = body.measure.chestDepth / 2;
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

/**
 * The half turns: the count, or as many as bring the pelvis nearest the place,
 * rounded to the end's parity.
 */
function count(
  p: IAutoMovieMotionHumanLogRoll,
  turn: number,
  step: number,
  hips: IAutoMovieVector3,
  travel: IAutoMovieVector3,
): number {
  if (p.halfTurns !== undefined) {
    if (!(Number.isInteger(p.halfTurns) && p.halfTurns >= 1))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "halfTurns",
        value: p.halfTurns,
        reason: "a log roll turns a whole number of half turns, one or more",
        fix: "give a positive whole count",
      });
    return p.halfTurns;
  }
  const along: number = Vector3.dot(Vector3.subtract(p.to!, hips), travel);
  if (!(along > step / 2))
    throw new HumanRefusal({
      kind: "reach",
      axis: "to",
      value: p.to!,
      reason: `the place lies ${(along * 1000).toFixed(0)} mm toward the side rolled to, less than half a half turn's ${((step / 2) * 1000).toFixed(0)} mm`,
      fix: "name a place farther along the side rolled toward",
    });
  const raw: number = Math.max(1, Math.round(along / step));
  if (p.end === undefined) return raw;
  // A half turn flips the back and the front; the end's parity is set by where the roll starts.
  const supine: boolean = Math.abs(turn) < 90;
  const flips: boolean = (p.end === "supine") !== supine;
  if ((raw % 2 === 1) === flips) return raw;
  const lower: number = raw - 1;
  const upper: number = raw + 1;
  return lower >= 1 &&
    Math.abs(along - lower * step) <= Math.abs(along - upper * step)
    ? lower
    : upper;
}
