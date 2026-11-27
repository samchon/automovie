import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanReach,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { AutoMovieMotionHumanLean } from "./AutoMovieMotionHumanLean";

/*
 * Whether a limb can put its end on a point, and what happens when it cannot.
 *
 * An arm's end is its wrist and its root the shoulder joint; a leg's end is its
 * ankle and its root the hip joint. The end reaches every point no farther from
 * the root than the limb's two segments laid straight (the upper arm and the
 * forearm, the thigh and the shank). A goal beyond that leaves the inverse
 * kinematics with a straight limb that stops short, so a law decides beforehand
 * by one of three policies:
 *
 * - `refuse`: the action is not planned, and the error states the limb, the goal
 *   and the shortfall in millimetres; the choice for a contact that must be met
 *   (a handshake, a grasp, a strike on a person).
 * - `lean`: the trunk tips forward about the hips by the smallest pitch that
 *   brings the shoulder within reach, up to LEAN_LIMIT; the choice for a
 *   reach a person would bend into (a table, an offered object). It refuses
 *   when that limit is not enough, and for a leg, which has no lean.
 * - `clamp`: the goal moves along its line from the root onto the sphere of the
 *   limb's reach; the choice for a goal with no contact (a point in the air, a
 *   gesture, a drill without a target).
 */
export namespace AutoMovieMotionHumanReach {
  /*
   * The policies of IAutoMovieMotionHumanReach.Policy, as data.
   */
  export const POLICIES = [
    "refuse",
    "lean",
    "clamp",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanReach.Policy>[];

  /*
   * The limbs of IAutoMovieMotionHumanReach.Limb, as data.
   */
  export const LIMBS = [
    "leftArm",
    "rightArm",
    "leftLeg",
    "rightLeg",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanReach.Limb>[];

  /*
   * The most a `lean` adds to the trunk's forward pitch, degrees (provisional):
   * about what a standing person bends into a reach before stepping closer
   * instead.
   */
  export const LEAN_LIMIT: number = 45;

  /*
   * The reach from a root joint to a point.
   * Parameter root: The limb's root joint, world metres.
   * Parameter length: The limb's two segments laid straight, metres.
   * Parameter point: The point the limb's end is asked to take, world metres.
   * Returns: The check.
   */
  export function measure(
    root: IAutoMovieVector3,
    length: number,
    point: IAutoMovieVector3,
  ): IAutoMovieMotionHumanReach.ICheck {
    const distance: number = Vector3.length(Vector3.subtract(point, root));
    return {
      root,
      length,
      distance,
      shortfall: Math.max(0, distance - length),
    };
  }

  /*
   * A point moved onto the sphere of a limb's reach when it is beyond it.
   * Parameter check: The reach toward the point.
   * Parameter point: The point, world metres.
   * Returns: The point itself when within reach; else the point of the sphere
   * on the line from the root to it.
   */
  export function clamp(
    check: IAutoMovieMotionHumanReach.ICheck,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    if (check.shortfall <= 0) return point;
    return Vector3.add(
      check.root,
      Vector3.scale(
        Vector3.subtract(point, check.root),
        check.length / check.distance,
      ),
    );
  }

  /*
   * Refuse a goal out of reach.
   * Parameter limb: The limb.
   * Parameter check: The reach toward the point.
   * Parameter point: The point, world metres.
   * When the point is beyond reach, with the limb, the point
   * and the shortfall in millimetres.
   */
  export function refuse(
    limb: IAutoMovieMotionHumanReach.Limb,
    check: IAutoMovieMotionHumanReach.ICheck,
    point: IAutoMovieVector3,
  ): void {
    if (check.shortfall <= 0) return;
    const mm: (metres: number) => string = (metres: number): string =>
      (1000 * metres).toFixed(0);
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "target",
      value: check.shortfall,
      feasible: { kind: "range", minimum: 0, maximum: check.length, unit: "m" },
      reason: `The ${limb} cannot reach (${mm(point.x)}, ${mm(point.y)}, ${mm(point.z)}) mm: it is ${mm(check.shortfall)} mm beyond the limb's ${mm(check.length)} mm`,
      fix: "bring the target within the limb's length, or move the body nearer first",
    });
  }

  /*
   * A limb's reach toward a point on a posture.
   * Parameter body: The body.
   * Parameter posture: The posture; its limb goals are not read.
   * Parameter limb: The limb.
   * Parameter point: The point the limb's end (the wrist or the ankle) is asked to
   * take, world metres.
   * Parameter resolution: Optional exact FK source borrowed only by this current
   * same-body observation.
   * Returns: The check.
   */
  export function check(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    limb: IAutoMovieMotionHumanReach.Limb,
    point: IAutoMovieVector3,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanReach.ICheck {
    return checkOn(body, posture, limb, point, resolution);
  }

  /*
   * Bind only unchanged body/limb demand for varying raw root observations.
   */
  export function prepareCheck(
    body: IAutoMovieMotionHumanBody,
    limb: IAutoMovieMotionHumanReach.Limb,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    point: IAutoMovieVector3,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IAutoMovieMotionHumanReach.ICheck {
    const read: ReturnType<typeof HumanTrunk.prepareResolve> | undefined =
      limb.endsWith("Arm")
        ? HumanTrunk.prepareResolve(
            body,
            SHOULDERS[limb === "leftArm" ? "left" : "right"],
          )
        : undefined;
    return (
      posture: IAutoMovieMotionHumanPosture,
      point: IAutoMovieVector3,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IAutoMovieMotionHumanReach.ICheck =>
      checkOn(body, posture, limb, point, resolution, read);
  }

  /*
   * The smallest forward pitch that brings an arm's shoulder within reach of a
   * point.
   * Parameter body: The body.
   * Parameter posture: The posture.
   * Parameter limb: The arm.
   * Parameter point: The point the wrist is asked to take, world metres.
   * Parameter limit: The most pitch to add, degrees; LEAN_LIMIT by default.
   * Returns: Degrees to add to the posture's pitch, to a hundredth; 0 when the
   * point is within reach already.
   * When the point stays beyond reach at the limit.
   */
  export function lean(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    limb: LeanLimb,
    point: IAutoMovieVector3,
    limit: number = LEAN_LIMIT,
  ): number {
    const read: ReturnType<typeof prepareCheck> = prepareCheck(body, limb);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const at: (pitch: number) => IAutoMovieMotionHumanReach.ICheck = (
      pitch: number,
    ): IAutoMovieMotionHumanReach.ICheck =>
      read(
        AutoMovieMotionHumanLean.tip(body, posture, pitch, 0),
        point,
        resolution,
      );
    if (at(0).shortfall <= 0) return 0;
    refuse(limb, at(limit), point);
    let low: number = 0;
    let high: number = limit;
    while (high - low > 0.01) {
      const middle: number = (low + high) / 2;
      if (at(middle).shortfall <= 0) high = middle;
      else low = middle;
    }
    return high;
  }

  /*
   * A limb's goal made reachable by a policy.
   * Parameter body: The body.
   * Parameter posture: The posture.
   * Parameter limb: The limb.
   * Parameter point: The point the limb's end is asked to take, world metres.
   * Parameter policy: What to do when the point is out of reach.
   * Returns: The posture and the point after the policy; both unchanged when
   * the point is within reach.
   * When the policy refuses, when a lean is not enough, and
   * when a leg is asked to lean beyond its reach.
   */
  export function fit(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    limb: IAutoMovieMotionHumanReach.Limb,
    point: IAutoMovieVector3,
    policy: IAutoMovieMotionHumanReach.Policy,
  ): IAutoMovieMotionHumanReach.IFit {
    const reach: IAutoMovieMotionHumanReach.ICheck = check(
      body,
      posture,
      limb,
      point,
    );
    if (reach.shortfall <= 0) return { posture, point };
    if (policy === "clamp") return { posture, point: clamp(reach, point) };
    if (policy === "lean" && (limb === "leftArm" || limb === "rightArm"))
      return {
        posture: AutoMovieMotionHumanLean.tip(
          body,
          posture,
          lean(body, posture, limb, point),
          0,
        ),
        point,
      };
    refuse(limb, reach, point);
    return { posture, point };
  }
}

/*
 * The alternatives of `LeanLimb`'s site.
 */
type LeanLimb = "leftArm" | "rightArm";

/*
 * Actual goal-independent arm roots, with canonical FK owning their ancestry.
 */
const SHOULDERS: Readonly<
  Record<AutoMovieHumanSide, ReadonlySet<AutoMovieHumanoidBone>>
> = {
  left: new Set<AutoMovieHumanoidBone>(["leftUpperArm"]),
  right: new Set<AutoMovieHumanoidBone>(["rightUpperArm"]),
};

/*
 * Preserve cold and prepared root/length policy before the common sphere
 * measure.
 */
function checkOn(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  limb: IAutoMovieMotionHumanReach.Limb,
  point: IAutoMovieVector3,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  read?: ReturnType<typeof HumanTrunk.prepareResolve>,
): IAutoMovieMotionHumanReach.ICheck {
  const side: AutoMovieHumanSide = limb.startsWith("left") ? "left" : "right";
  if (limb.endsWith("Leg"))
    return AutoMovieMotionHumanReach.measure(
      hipJoints(
        body,
        posture.root,
        humanPostureHeading(posture),
        posture.joints.hips,
        prepareHumanPoseResolution.read(resolution),
      )[side],
      body.measure.thigh + body.measure.shank,
      point,
    );
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    read === undefined
      ? HumanTrunk.resolve(
          body,
          posture,
          undefined,
          resolution,
          SHOULDERS[side],
        )
      : read(posture, resolution);
  const shoulder: IAutoMovieResolvedBone | undefined = bones.get(
    `${side}UpperArm`,
  );
  if (shoulder === undefined)
    throw new Error(`The rig lacks ${side}UpperArm, so it has no shoulder`);
  return AutoMovieMotionHumanReach.measure(
    shoulder.worldPosition,
    body.measure.upperArm + body.measure.forearm,
    point,
  );
}
