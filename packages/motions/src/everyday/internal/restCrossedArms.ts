import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRest,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../../body/internal/readHumanBone";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { placeHumanHandSurface } from "../../posture/internal/placeHumanHandSurface";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanTrunk } from "./HumanTrunk";

/*
 * Both crossed-arms goals on upper arms set before the goals: each hangs
 * forward by `FLEXION` or, if more, until its elbow stands the forearm's radius
 * ahead of the sternum, so the forearms clear the chest; the elbows then draw
 * in, both alike, until each palm (laid on the front of the other upper arm
 * three quarters of the way to its elbow, fingers round its outside) leaves its
 * wrist one forearm from its own elbow, found by bisection since drawing in
 * brings the wrists nearer. The elbow hint is the elbow itself, which then lies
 * on the arm's solution circle, so the solved upper arms are the ones the palms
 * were laid on. Elbows that cannot draw in far enough, or need not draw in at
 * all, keep the nearest feasible width.
 * Parameter body: The body.
 * Parameter posture: The standing posture.
 * Returns: Both goals.
 */
export function restCrossedArms(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
): Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal> {
  const frame: HumanFrame.IPrepared = HumanFrame.prepare({
    origin: posture.root,
    yaw: posture.yaw,
  });
  const turn: (local: IAutoMovieVector3) => IAutoMovieVector3 = (
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 => frame.direction(local);
  const requested: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>(["leftUpperArm", "rightUpperArm"]);

  // A joint's origin depends on its parent's frame, not its own rotation.
  // The shared selector keeps full fitting when any dependency is uncertain.
  const parents: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    [...requested].map(
      (bone: AutoMovieHumanoidBone): AutoMovieHumanoidBone =>
        readHumanBone(body, bone)?.parent ?? bone,
    ),
  );
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const pose: IAutoMoviePose = resolveHumanPosture.seeded(
    body,
    posture,
    undefined,
    {},
    resolution,
    parents,
  ).pose;
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    pose,
    resolution(),
    requested,
  );
  const length: (
    side: AutoMovieHumanSide,
    from: RestCrossedArmsLengthFrom,
    to: RestCrossedArmsLengthTo,
  ) => number = (
    side: AutoMovieHumanSide,
    from: RestCrossedArmsLengthFrom2,
    to: RestCrossedArmsLengthTo2,
  ): number =>
    AutoMovieEngineVector3.distance(
      body.rest.get(`${side}${to}`)!,
      body.rest.get(`${side}${from}`)!,
    );
  const sternum: IAutoMovieVector3 = frame.local(
    HumanTrunk.region(body, posture, "sternum", resolution).point,
  );
  const geometry: Record<AutoMovieHumanSide, IArm> = {
    left: prepare("left"),
    right: prepare("right"),
  };
  const ahead: IAutoMovieVector3 = turn({ x: 0, y: 0, z: 1 });
  // Each relaxed palm's place in its hand, read once for both sides.
  const palms: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: HumanHand.offset(body, "left", "palm", "relaxed").point,
    right: HumanHand.offset(body, "right", "palm", "relaxed").point,
  };
  const elbowAt: (
    side: AutoMovieHumanSide,
    inward: number,
  ) => IAutoMovieVector3 = (
    side: AutoMovieHumanSide,
    inward: number,
  ): IAutoMovieVector3 => {
    const arm: IArm = geometry[side];
    const s: IAutoMovieVector3 = arm.shoulder;
    const across: number = Math.min(inward, arm.across);
    const down: number = Math.sqrt(
      Math.max(0, arm.downSquared - across * across),
    );
    return frame.point({
      x: s.x - (side === "left" ? 1 : -1) * across,
      y: s.y - down,
      z: s.z + arm.forward,
    });
  };
  const goal: (
    side: AutoMovieHumanSide,
    elbows: Record<AutoMovieHumanSide, IAutoMovieVector3>,
  ) => IRestCrossedArmsGoal = (
    side: AutoMovieHumanSide,
    elbows: Record<AutoMovieHumanSide, IAutoMovieVector3>,
  ): IRestCrossedArmsGoalResult => {
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const from: IAutoMovieVector3 = geometry[other].world;
    const axis: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(elbows[other], from),
    );
    const front: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(ahead, AutoMovieEngineVector3.scale(axis, AutoMovieEngineVector3.dot(ahead, axis))),
    );
    // With level elbows the distance of the forearm axes at their crossing
    // is half their wrist-height difference. Place one wrist above and one
    // below the nominal bearing by a forearm diameter, along the upper arm.
    const span: number = geometry[other].upper;
    const shift: number =
      axis.y === 0 ? 0 : (2 * body.measure.forearmRadius) / Math.abs(axis.y);
    const along: number = Math.max(
      0,
      Math.min(span, ALONG * span + (side === "left" ? shift : -shift)),
    );
    const point: IAutoMovieVector3 = AutoMovieEngineVector3.addScaled(
      AutoMovieEngineVector3.addScaled(from, axis, along),
      front,
      body.measure.upperArmRadius,
    );
    const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
      fingers: geometry[other].outward,
      palm: AutoMovieEngineVector3.scale(front, -1),
    });
    const elbow: IAutoMovieVector3 = elbows[side];
    const palm: IAutoMovieVector3 = palms[side];
    const wrist: IAutoMovieVector3 = placeHumanHandSurface(
      palm,
      point,
      rotation,
    ).point;
    return {
      goal: { surface: "palm", shape: "relaxed", point, rotation, elbow },
      excess: AutoMovieEngineVector3.distance(wrist, elbow) - geometry[side].lower,
    };
  };
  const elbowsAt: (
    inward: number,
  ) => Record<AutoMovieHumanSide, IAutoMovieVector3> = (
    inward: number,
  ): Record<AutoMovieHumanSide, IAutoMovieVector3> => ({
    left: elbowAt("left", inward),
    right: elbowAt("right", inward),
  });
  const excess: (inward: number) => number = (inward: number): number => {
    const elbows: Record<AutoMovieHumanSide, IAutoMovieVector3> =
      elbowsAt(inward);
    return (goal("left", elbows).excess + goal("right", elbows).excess) / 2;
  };
  let lo: number = 0;
  let hi: number =
    Math.abs(geometry.left.shoulder.x - geometry.right.shoulder.x) / 2;
  if (excess(lo) <= 0) hi = lo;
  else if (excess(hi) > 0) lo = hi;
  // Halve until the width is known to 10 um, far finer than the arms'
  // surfaces; a half-breadth under 0.25 m reaches that in 15 halvings, so the
  // cap of thirty only guards the loop.
  for (let i: number = 0; i < 30 && hi - lo > 1e-5; i++) {
    const mid: number = (lo + hi) / 2;
    if (excess(mid) > 0) lo = mid;
    else hi = mid;
  }
  const elbows: Record<AutoMovieHumanSide, IAutoMovieVector3> = elbowsAt(hi);
  return { left: goal("left", elbows).goal, right: goal("right", elbows).goal };

  /*
   * Prepare fixed anatomical values used by every width trial.
   */
  function prepare(side: AutoMovieHumanSide): IArm {
    const shoulder: IAutoMovieVector3 = frame.local(
      bones.get(`${side}UpperArm`)!.worldPosition,
    );
    const upper: number = length(side, "UpperArm", "LowerArm");
    const forward: number = Math.min(
      AHEAD * upper,
      Math.max(
        upper * Math.sin((FLEXION * Math.PI) / 180),
        sternum.z + body.measure.forearmRadius - shoulder.z,
      ),
    );
    const downSquared: number = upper * upper - forward * forward;
    return {
      shoulder,
      world: frame.point(shoulder),
      upper,
      lower: length(side, "LowerArm", "Hand"),
      outward: turn({ x: side === "left" ? 1 : -1, y: 0, z: 0 }),
      forward,
      downSquared,
      across: Math.sqrt(downSquared),
    };
  }
}

/*
 * The record of `IRestCrossedArmsGoalResult`'s site.
 */
type IRestCrossedArmsGoalResult = {
  goal: IAutoMovieMotionHumanRest.IGoal;
  excess: number;
};

/*
 * The record of `IRestCrossedArmsGoal`'s site.
 */
type IRestCrossedArmsGoal = {
  goal: IAutoMovieMotionHumanRest.IGoal;
  excess: number;
};

/*
 * The alternatives of `RestCrossedArmsLengthTo2`'s site.
 */
type RestCrossedArmsLengthTo2 = "LowerArm" | "Hand";

/*
 * The alternatives of `RestCrossedArmsLengthFrom2`'s site.
 */
type RestCrossedArmsLengthFrom2 = "UpperArm" | "LowerArm";

/*
 * The alternatives of `RestCrossedArmsLengthTo`'s site.
 */
type RestCrossedArmsLengthTo = "LowerArm" | "Hand";

/*
 * The alternatives of `RestCrossedArmsLengthFrom`'s site.
 */
type RestCrossedArmsLengthFrom = "UpperArm" | "LowerArm";

/*
 * Immutable arm geometry read by the crossed-arm width search.
 */
interface IArm {
  /*
   * Shoulder in the performer's floor frame.
   */
  shoulder: IAutoMovieVector3;

  /*
   * The shoulder transformed back exactly as the original goal used it.
   */
  world: IAutoMovieVector3;

  /*
   * Measured upper-arm length, metres.
   */
  upper: number;

  /*
   * Measured forearm length, metres.
   */
  lower: number;

  /*
   * The arm side's outward world direction.
   */
  outward: IAutoMovieVector3;

  /*
   * Fixed elbow distance ahead of the shoulder, metres.
   */
  forward: number;

  /*
   * Squared upper-arm length available for down and inward displacement.
   */
  downSquared: number;

  /*
   * Greatest inward displacement from that same length, metres.
   */
  across: number;
}

/*
 * The least forward hang of each upper arm when the arms are crossed, degrees
 * (provisional).
 */
const FLEXION: number = 20;

/*
 * The farthest an elbow hangs ahead of its shoulder, as a share of the upper
 * arm: short of a level arm, so it still hangs (provisional).
 */
const AHEAD: number = 0.9;

/*
 * Where on the other upper arm a palm lies, as a share of the way from the
 * shoulder to the elbow (the namespace's three quarters).
 */
const ALONG: number = 0.75;
