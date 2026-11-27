import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
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

import { motionClock } from "../../compose/internal/motionClock";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { motionManner } from "../../compose/internal/motionManner";
import { composeMotionHumanAction } from "../../compose/internal/composeMotionHumanAction";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";
import { knockdown } from "../../reaction/internal/knockdown";
import { stuntFallPose } from "../../reaction/internal/stuntFallPose";
import "./lieDownPoses";
import { logRollTurns } from "./logRollTurns";
import { lyingTurn } from "./lyingTurn";
import { LogRollData } from "./LogRollData";

/*
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
      any: [{ window: { start: "settled", end: 1 }, kind: "inertialize", entry: 0 }],
    },
    plan: planLogRoll,
  };

/*
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
function planLogRoll(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLogRoll>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanLogRoll = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  if (context.entry.base.kind !== "lying")
    throw new AutoMovieMotionHumanRefusal({
      kind: "base",
      axis: "toward",
      value: p.toward,
      reason: "a log roll starts lying",
      fix: "lie down first",
    });
  if ((p.halfTurns === undefined) === (p.to === undefined))
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "halfTurns",
      value: p.halfTurns ?? "none",
      reason: `a log roll names ${p.to === undefined ? "neither" : "both"} a count of half turns and a place`,
      fix: "give either the half turns or the place",
    });
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const from: lyingTurn.ITurn = lyingTurn(entry);
  const sign: number = p.toward === "left" ? 1 : -1;
  // The body's left when supine; turning positive rolls the body toward it.
  const left: IAutoMovieVector3 = {
    x: Math.cos((from.yaw * Math.PI) / 180),
    y: 0,
    z: -Math.sin((from.yaw * Math.PI) / 180),
  };
  const travel: IAutoMovieVector3 = AutoMovieEngineVector3.scale(left, sign);
  const step: number = logRollTurns.perimeter(body.measure) / 2;
  const hips: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    entry.root,
    AutoMovieEngineQuaternion.rotateVector(humanPostureHeading(entry), body.rest.get("hips")!),
  );
  const halves: number = logRollTurns.count(p, from.turn, step, hips, travel);
  const target: number = from.turn + sign * 180 * halves;
  const clock: IAutoMovieMotionClock = motionManner.time(
    motionClock.sequence([
      { name: "rolling", seconds: LogRollData.HALF * halves },
      { name: "rolled", seconds: 0 },
      { name: "settled", seconds: 0 },
    ]),
    motionManner(context, p.manner),
    { holds: ["settled"] },
  );
  const progress: ReturnType<typeof motionClock.prepare> =
    motionClock.prepare(clock, "rolling", "rolled");
  const straighten: (w: number) => IAutoMovieMotionHumanPosture["joints"] =
    prepareHumanShapeBlend(entry.joints, LogRollData.LOG);
  const rest: ReturnType<typeof knockdown.prepareRest> =
    knockdown.prepareRest(body);
  const straight: IAutoMovieMotionHumanPosture["joints"] = straighten(1);
  const rolledSupport: ReturnType<typeof stuntFallPose.prepareSupport> =
    stuntFallPose.prepareSupport(body, {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: straight,
      limbs: {},
    });
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
    const formed: boolean = u * halves >= 1;
    const posture: IAutoMovieMotionHumanPosture = {
      ...lyingTurn.tilt({ yaw: from.yaw, turn }),
      root: { x: 0, y: 0, z: 0 },
      // The log forms over the first half turn and is kept.
      joints: formed ? straight : straighten(u * halves),
      limbs: {},
    };
    const attitude: ReturnType<typeof humanPostureHeading> =
      humanPostureHeading(posture);
    const offset: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      attitude,
      body.rest.get("hips")!,
    );
    const pelvis: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      hips,
      AutoMovieEngineVector3.scale(travel, (step * Math.abs(turn - from.turn)) / 180),
    );
    return {
      ...posture,
      root: {
        x: pelvis.x - offset.x,
        y: formed
          ? -rolledSupport(
              AutoMovieEngineQuaternion.rotateVector(AutoMovieEngineQuaternion.inverse(attitude), {
                x: 0,
                y: 1,
                z: 0,
              }),
            )
          : rest(
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
    composeMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, entry, contacts),
      clock,
      contact: "settled",
      primitives: [rolling],
    });
  return { ...planned, base: { kind: "lying" } };
}
