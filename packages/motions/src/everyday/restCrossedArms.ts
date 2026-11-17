import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { placeHumanHandSurface } from "../posture/placeHumanHandSurface";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import type { rest } from "./rest";
import { readHumanBone } from "../body/readHumanBone";

/**
 * Both crossed-arms goals on upper arms set before the goals: each hangs
 * forward by `FLEXION` or, if more, until its elbow stands the forearm's
 * radius ahead of the sternum, so the forearms clear the chest; the elbows
 * then draw in, both alike, until each palm (laid on the front of the other
 * upper arm three quarters of the way to its elbow, fingers round its
 * outside) leaves its wrist one forearm from its own elbow, found by
 * bisection since drawing in brings the wrists nearer. The elbow hint is the
 * elbow itself, which then lies on the arm's solution circle, so the solved
 * upper arms are the ones the palms were laid on. Elbows that cannot draw in
 * far enough, or need not draw in at all, keep the nearest feasible width.
 *
 * @param body The body.
 * @param posture The standing posture.
 * @returns Both goals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the upper arms are set, where each palm lies and how the elbows' width is found.
 * @evidence contracts/development/implementation.md#principled-implementation Each arm's goal lies on the other arm's surface, so both upper arms are fixed first and the one free width is solved for the forearm's length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One elbow placement, one palm goal and one bisection of the width.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An infeasible width keeps the nearest feasible one, as stated; the least flexion is named provisional.
 * @evidence contracts/development/implementation.md#efficient-algorithms A 30-step width bisection retains every closed-form goal query. One observational posture solve demands only the actual shoulder-parent frames, falling back to full fitting when dependencies require it; shoulder frames, lengths, directions and elbow forward/down geometry are prepared once per plan. Native scalar distance and addScaled owners preserve the original read/arithmetic order while omitting discarded separation/scaled-offset records in every actual width trial.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A same-operation exact FK reader serves the admitted shoulder solve, shoulder frames and raw sternum. Bisection trials share fixed body geometry, lazy actual palm offsets and clamped shoulder origins; each changed width computes its two elbows once for both hand surfaces and excesses. The universal resolver owns the safe fit dependency proof and preserves full fallback.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function restCrossedArms(
  body: IHumanBody,
  posture: IHumanPosture,
): Record<HumanHand.Side, rest.IGoal> {
  const frame: HumanFrame.IPrepared = HumanFrame.prepare({ origin: posture.root, yaw: posture.yaw });
  const turn = (local: IAutoMovieVector3): IAutoMovieVector3 =>
    frame.direction(local);
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
    "leftUpperArm", "rightUpperArm",
  ]);

  // A joint's origin depends on its parent's frame, not its own rotation.
  // The shared selector keeps full fitting when any dependency is uncertain.
  const parents: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    [...requested].map((bone: AutoMovieHumanoidBone): AutoMovieHumanoidBone =>
      readHumanBone(body, bone)?.parent ?? bone,
    ),
  );
  const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
  const pose: IAutoMoviePose = resolveHumanPosture.seeded(
    body, posture, undefined, {}, resolution, parents,
  ).pose;
  const bones: ReturnType<typeof poseBones> = poseBones(body, pose, resolution(), requested);
  const length = (
    side: HumanHand.Side,
    from: "UpperArm" | "LowerArm",
    to: "LowerArm" | "Hand",
  ): number =>
    Vector3.distance(
      body.rest.get(`${side}${to}`)!, body.rest.get(`${side}${from}`)!,
    );
  const sternum: IAutoMovieVector3 = frame.local(
    HumanTrunk.region(body, posture, "sternum", resolution).point,
  );
  const geometry: Record<HumanHand.Side, IArm> = {
    left: prepare("left"), right: prepare("right"),
  };
  const ahead: IAutoMovieVector3 = turn({ x: 0, y: 0, z: 1 });
  const palms: Partial<Record<HumanHand.Side, IAutoMovieVector3>> = {};
  const elbowAt = (side: HumanHand.Side, inward: number): IAutoMovieVector3 => {
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
  const goal = (
    side: HumanHand.Side,
    elbows: Record<HumanHand.Side, IAutoMovieVector3>,
  ): { goal: rest.IGoal; excess: number } => {
    const other: HumanHand.Side = side === "left" ? "right" : "left";
    const from: IAutoMovieVector3 = geometry[other].world;
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(elbows[other], from),
    );
    const front: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(ahead, Vector3.scale(axis, Vector3.dot(ahead, axis))),
    );
    const point: IAutoMovieVector3 = Vector3.addScaled(
      Vector3.addScaled(from, axis, 0.75 * geometry[other].upper),
      front, body.measure.upperArmRadius,
    );
    const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
      fingers: geometry[other].outward,
      palm: Vector3.scale(front, -1),
    });
    const elbow: IAutoMovieVector3 = elbows[side];
    const palm: IAutoMovieVector3 = palms[side] ??= HumanHand.offset(body, side, "palm", "relaxed").point;
    const wrist: IAutoMovieVector3 = placeHumanHandSurface(palm, point, rotation).point;
    return {
      goal: { surface: "palm", shape: "relaxed", point, rotation, elbow },
      excess:
        Vector3.distance(wrist, elbow) -
        geometry[side].lower,
    };
  };
  const elbowsAt: (inward: number) => Record<HumanHand.Side, IAutoMovieVector3> =
    (inward: number): Record<HumanHand.Side, IAutoMovieVector3> => ({
      left: elbowAt("left", inward), right: elbowAt("right", inward),
    });
  const excess = (inward: number): number => {
    const elbows: Record<HumanHand.Side, IAutoMovieVector3> = elbowsAt(inward);
    return (goal("left", elbows).excess + goal("right", elbows).excess) / 2;
  };
  let lo: number = 0;
  let hi: number = Math.abs(geometry.left.shoulder.x - geometry.right.shoulder.x) / 2;
  if (excess(lo) <= 0) hi = lo;
  else if (excess(hi) > 0) lo = hi;
  for (let i: number = 0; i < 30 && hi - lo > 1e-5; i++) {
    const mid: number = (lo + hi) / 2;
    if (excess(mid) > 0) lo = mid;
    else hi = mid;
  }
  const elbows: Record<HumanHand.Side, IAutoMovieVector3> = elbowsAt(hi);
  return { left: goal("left", elbows).goal, right: goal("right", elbows).goal };

  /** Prepare fixed anatomical values used by every width trial. */
  function prepare(side: HumanHand.Side): IArm {
    const shoulder: IAutoMovieVector3 = frame.local(
      bones.get(`${side}UpperArm`)!.worldPosition,
    );
    const upper: number = length(side, "UpperArm", "LowerArm");
    const forward: number = Math.min(0.9 * upper, Math.max(
      upper * Math.sin((restCrossedArms.FLEXION * Math.PI) / 180),
      sternum.z + body.measure.forearmRadius - shoulder.z,
    ));
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

/** Immutable arm geometry read by the crossed-arm width search. */
interface IArm {
  /** Shoulder in the performer's floor frame. */
  shoulder: IAutoMovieVector3;

  /** The shoulder transformed back exactly as the original goal used it. */
  world: IAutoMovieVector3;

  /** Measured upper-arm length, metres. */
  upper: number;

  /** Measured forearm length, metres. */
  lower: number;

  /** The arm side's outward world direction. */
  outward: IAutoMovieVector3;

  /** Fixed elbow distance ahead of the shoulder, metres. */
  forward: number;

  /** Squared upper-arm length available for down and inward displacement. */
  downSquared: number;

  /** Greatest inward displacement from that same length, metres. */
  across: number;
}

/**
 * Companion values of {@link restCrossedArms}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the constant's unit and that it is provisional.
 * @evidence contracts/development/design.md#principled-representation One named angle in clinical degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one value the function reads and a caller may cite.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A named constant, not a literal inside the solve.
 */
export namespace restCrossedArms {
  /** The least forward hang of each upper arm when the arms are crossed, degrees (provisional). */
  export const FLEXION: number = 20;
}
