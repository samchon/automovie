import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanReach,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { hipJoints } from "../posture/hipJoints";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanLean } from "./AutoMovieMotionHumanLean";

/**
 * Whether a limb can put its end on a point, and what happens when it cannot.
 *
 * An arm's end is its wrist and its root the shoulder joint; a leg's end is
 * its ankle and its root the hip joint. The end reaches every point no
 * farther from the root than the limb's two segments laid straight (the
 * upper arm and the forearm, the thigh and the shank). A goal beyond that
 * leaves the inverse kinematics with a straight limb that stops short, so a
 * law decides beforehand by one of three policies:
 *
 * - `refuse`: the action is not planned, and the error states the limb, the
 *   goal and the shortfall in millimetres; the choice for a contact that
 *   must be met (a handshake, a grasp, a strike on a person).
 * - `lean`: the trunk tips forward about the hips by the smallest pitch that
 *   brings the shoulder within reach, up to {@link LEAN_LIMIT}; the choice
 *   for a reach a person would bend into (a table, an offered object). It
 *   refuses when that limit is not enough, and for a leg, which has no lean.
 * - `clamp`: the goal moves along its line from the root onto the sphere of
 *   the limb's reach; the choice for a goal with no contact (a point in the
 *   air, a gesture, a drill without a target).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what reach is measured between, the reachable set, the three policies and when a law takes each.
 * @evidence contracts/development/design.md#principled-representation The reachable set of a two-segment limb is the ball about its root joint with the radius of both segments, the workspace of two-bone inverse kinematics; a policy is the answer outside it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One measurement, three policies and their combination; the only owner of reach checks, so no law compares a distance with an arm length itself.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Policies are a closed union; the lean limit is a named provisional constant; an unreachable contact throws with its numbers and is never bent to fit silently.
 */
export namespace AutoMovieMotionHumanReach {

  /** The policies of {@link Policy}, as data. */
  export const POLICIES = ["refuse", "lean", "clamp"] as const satisfies readonly NonNullable<IAutoMovieMotionHumanReach.Policy>[];

  /** The limbs of {@link Limb}, as data. */
  export const LIMBS = ["leftArm", "rightArm", "leftLeg", "rightLeg"] as const satisfies readonly NonNullable<IAutoMovieMotionHumanReach.Limb>[];

  /**
   * The most a `lean` adds to the trunk's forward pitch, degrees
   * (provisional): about what a standing person bends into a reach before
   * stepping closer instead.
   */
  export const LEAN_LIMIT: number = 45;

  /**
   * The reach from a root joint to a point.
   *
   * @param root The limb's root joint, world metres.
   * @param length The limb's two segments laid straight, metres.
   * @param point The point the limb's end is asked to take, world metres.
   * @returns The check.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's frame and unit and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation The distance from the ball's centre compared with its radius; the shortfall is their positive difference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One distance and one subtraction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance is added to the length: a point exactly at full length is within reach and one beyond it is not.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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

  /**
   * A point moved onto the sphere of a limb's reach when it is beyond it.
   *
   * @param check The reach toward the point.
   * @param point The point, world metres.
   * @returns The point itself when within reach; else the point of the sphere on the line from the root to it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and both outcomes.
   * @evidence contracts/development/implementation.md#principled-implementation The nearest reachable point to an outside point is its radial projection on the sphere, so the limb still points at the goal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One condition and one scaling.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A point within reach is returned unchanged, never pushed out to the sphere.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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

  /**
   * Refuse a goal out of reach.
   *
   * @param limb The limb.
   * @param check The reach toward the point.
   * @param point The point, world metres.
   * @throws {Error} When the point is beyond reach, with the limb, the point and the shortfall in millimetres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and what the error carries.
   * @evidence contracts/development/implementation.md#principled-implementation An unreachable contact cannot be performed, so the plan stops with the numbers an author needs to move the target or the performer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One condition and one message.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Throws instead of returning a flag a caller could ignore.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function refuse(
    limb: IAutoMovieMotionHumanReach.Limb,
    check: IAutoMovieMotionHumanReach.ICheck,
    point: IAutoMovieVector3,
  ): void {
    if (check.shortfall <= 0) return;
    const mm: (metres: number) => string = (metres: number): string => (1000 * metres).toFixed(0);
    throw new HumanRefusal({
      kind: "reach",
      axis: "target",
      value: check.shortfall,
      feasible: { kind: "range", minimum: 0, maximum: check.length, unit: "m" },
      reason: `The ${limb} cannot reach (${mm(point.x)}, ${mm(point.y)}, ${mm(point.z)}) mm: it is ${mm(check.shortfall)} mm beyond the limb's ${mm(check.length)} mm`,
      fix: "bring the target within the limb's length, or move the body nearer first",
    });
  }

  /**
   * A limb's reach toward a point on a posture.
   *
   * @param body The body.
   * @param posture The posture; its limb goals are not read.
   * @param limb The limb.
   * @param point The point the limb's end (the wrist or the ankle) is asked to take, world metres.
   * @param resolution Optional exact FK source borrowed only by this current same-body observation.
   * @returns The check.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what of the posture is read, which joint the end is and the frame of the point.
   * @evidence contracts/development/implementation.md#principled-implementation The shoulder is read from the trunk's forward kinematics and the hip from the root and the pelvis joint, the places the limb fits start from; the length is the body's own two segments.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One root lookup by limb kind, then `measure`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig without the shoulder bone throws instead of measuring from the origin.
   * @evidence contracts/development/implementation.md#efficient-algorithms Admits all original raw authored joints but emits only the actual arm shoulder and its ancestry, or the original two-hip observation for a leg; no limb fit runs. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares checkOn with prepareCheck, HumanTrunk/hipJoints retain raw FK ownership, and an optional current-person reader shares only exact prerequisites rather than a root or reach answer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no input or reader; the optional borrowed workspace is used only through the actual current root observation and fresh check output.
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

  /**
   * Bind only unchanged body/limb demand for varying raw root observations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes body/limb metadata; each query takes actual authored posture, world-metre end point and optional synchronous same-person FK source, returning the original reach check.
   * @evidence contracts/development/implementation.md#principled-implementation The genuine HumanTrunk.prepareResolve binds the actual arm shoulder name once; every query still constructs and admits the current raw posture and uses checkOn's original root/length/distance equations. Legs retain hipJoints and its authored pelvis-only policy.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy fixed arm-demand reader feeds the same root observation and measure owner as cold check, without a separate solver or limb representation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No posture, root point, reach result or limb fit is stored; all original authored admission, missing-root error, body lengths and exact reach boundary remain, without adding ROM projection.
   * @evidence contracts/development/implementation.md#efficient-algorithms Q arm probes bind shoulder name/indices once and emit only its ancestor closure; current authored-joint admission and actual FK remain per query. No measured speedup is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged body and fixed limb prove static name-demand equivalence. A query's explicit FK source is borrowed only at that query, so plan-owned static demand never retains an operation workspace or dynamic answer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation or plan owns one body/name metadata reader until release; current posture, point and optional reader do not enter it, and every output check is fresh without time/pose history or handles.
   */
  export function prepareCheck(body: IAutoMovieMotionHumanBody, limb: IAutoMovieMotionHumanReach.Limb):
    (posture: IAutoMovieMotionHumanPosture, point: IAutoMovieVector3,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IAutoMovieMotionHumanReach.ICheck {
    let read: ReturnType<typeof HumanTrunk.prepareResolve> | undefined;
    return (posture: IAutoMovieMotionHumanPosture, point: IAutoMovieVector3,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieMotionHumanReach.ICheck => {
      if (limb.endsWith("Arm"))
        read ??= HumanTrunk.prepareResolve(body, SHOULDERS[limb === "leftArm" ? "left" : "right"]);
      return checkOn(body, posture, limb, point, resolution, read);
    };
  }

  /**
   * The smallest forward pitch that brings an arm's shoulder within reach of
   * a point.
   *
   * @param body The body.
   * @param posture The posture.
   * @param limb The arm.
   * @param point The point the wrist is asked to take, world metres.
   * @param limit The most pitch to add, degrees; {@link LEAN_LIMIT} by default.
   * @returns Degrees to add to the posture's pitch, to a hundredth; 0 when the point is within reach already.
   * @throws {Error} When the point stays beyond reach at the limit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and resolution of the result and when it throws.
   * @evidence contracts/development/implementation.md#principled-implementation The shortfall is zero at the limit and positive at none, so bisection on the pitch finds the boundary; it keeps the reachable end, so the returned pitch always reaches.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two end checks and one bisection loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A lean that does not reach at the limit refuses with the shortfall there; the hips are not moved back here, since balance belongs to the lean primitive a law writes the pitch with.
   * @evidence contracts/development/implementation.md#efficient-algorithms Retains the original endpoint checks and bounded bisection to a hundredth of a degree; one fixed shoulder demand and exact FK getter serve every actual tipped-pose probe instead of full bone output and repeated name preparation. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses original Lean.tip and prepareCheck's native raw shoulder/measure owner; one synchronous reader shares only exactly unchanged prerequisites across the actual current roots/joints.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This call releases its fixed name reader and lazy operation workspace on return or throw; only a numeric pitch escapes, without poses, target results or history.
   */
  export function lean(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    limb: "leftArm" | "rightArm",
    point: IAutoMovieVector3,
    limit: number = LEAN_LIMIT,
  ): number {
    const read: ReturnType<typeof prepareCheck> = prepareCheck(body, limb);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const at: (pitch: number) => IAutoMovieMotionHumanReach.ICheck = (pitch: number): IAutoMovieMotionHumanReach.ICheck =>
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

  /**
   * A limb's goal made reachable by a policy.
   *
   * @param body The body.
   * @param posture The posture.
   * @param limb The limb.
   * @param point The point the limb's end is asked to take, world metres.
   * @param policy What to do when the point is out of reach.
   * @returns The posture and the point after the policy; both unchanged when the point is within reach.
   * @throws {Error} When the policy refuses, when a lean is not enough, and when a leg is asked to lean beyond its reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, what each policy may change and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each policy is its definition: `refuse` throws, `clamp` projects the point on the reach sphere, `lean` tips the posture by the smallest pitch that reaches.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check, then one branch per policy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A leg that cannot lean refuses instead of falling back to a clamp the law did not ask for.
   * @evidence contracts/development/implementation.md#efficient-algorithms One check when within reach; the lean's bisection only when it is needed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `check`, `refuse`, `clamp` and `lean`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function fit(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    limb: IAutoMovieMotionHumanReach.Limb,
    point: IAutoMovieVector3,
    policy: IAutoMovieMotionHumanReach.Policy,
  ): IAutoMovieMotionHumanReach.IFit {
    const reach: IAutoMovieMotionHumanReach.ICheck = check(body, posture, limb, point);
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

/** Actual goal-independent arm roots, with canonical FK owning their ancestry. */
const SHOULDERS: Readonly<Record<"left" | "right", ReadonlySet<AutoMovieHumanoidBone>>> = {
  left: new Set<AutoMovieHumanoidBone>(["leftUpperArm"]),
  right: new Set<AutoMovieHumanoidBone>(["rightUpperArm"]),
};

/** Preserve cold and prepared root/length policy before the common sphere measure. */
function checkOn(body: IAutoMovieMotionHumanBody, posture: IAutoMovieMotionHumanPosture,
  limb: IAutoMovieMotionHumanReach.Limb, point: IAutoMovieVector3,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  read?: ReturnType<typeof HumanTrunk.prepareResolve>): IAutoMovieMotionHumanReach.ICheck {
  const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
  if (limb.endsWith("Leg"))
    return AutoMovieMotionHumanReach.measure(hipJoints(body, posture.root,
      resolveHumanPosture.heading(posture), posture.joints.hips,
      typeof resolution === "function" ? resolution() : resolution)[side],
    body.measure.thigh + body.measure.shank, point);
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = read === undefined
    ? HumanTrunk.resolve(body, posture, undefined, resolution, SHOULDERS[side]) : read(posture, resolution);
  const shoulder: IAutoMovieResolvedBone | undefined = bones.get(`${side}UpperArm`);
  if (shoulder === undefined)
    throw new Error(`The rig lacks ${side}UpperArm, so it has no shoulder`);
  return AutoMovieMotionHumanReach.measure(shoulder.worldPosition,
    body.measure.upperArm + body.measure.forearm, point);
}
