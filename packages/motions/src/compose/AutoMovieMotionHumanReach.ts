import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { hipJoints } from "../posture/hipJoints";
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
  /**
   * What a law does with a goal out of reach; the namespace states each.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Says what the union decides and where each member is described.
   * @evidence contracts/development/design.md#principled-representation The three answers to an unreachable goal: give up, move the body, or move the goal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, read by `fit`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed literal union instead of flags that could combine into a contradiction.
   */
  export type Policy = "refuse" | "lean" | "clamp";

  /**
   * A limb that reaches.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four limbs a reach is measured for.
   * @evidence contracts/development/design.md#principled-representation The posture's own limb keys, so a check names the goal it guards.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, used by every function here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A literal union, not a string.
   */
  export type Limb = "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

  /**
   * A limb's reach toward one point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record measures; each member gives its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The centre and the radius of the reachable ball with the goal's distance from the centre, the three numbers the comparison is made of.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members; `shortfall` is kept beside the two it follows from because every reader branches on it and an error prints it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All members required and in metres; reach is not reduced to a boolean that would hide by how much.
   */
  export interface ICheck {
    /** The limb's root joint (the shoulder or the hip), world metres. */
    root: IAutoMovieVector3;

    /** The length of the limb's two segments laid straight, metres. */
    length: number;

    /** The distance from the root to the point, metres. */
    distance: number;

    /** How far the point is beyond reach, metres; 0 when it is within reach. */
    shortfall: number;
  }

  /**
   * A goal made reachable.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member says what a policy may have changed.
   * @evidence contracts/development/design.md#principled-representation A policy changes the posture (a lean) or the point (a clamp), so the result carries both as they are after it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, returned by `fit` only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both members are always present, so a caller never asks which policy ran before reading them.
   */
  export interface IFit {
    /** The posture, tipped forward when the policy leaned. */
    posture: IHumanPosture;

    /** The limb's end point, moved when the policy clamped; world metres. */
    point: IAutoMovieVector3;
  }

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
  ): ICheck {
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
    check: ICheck,
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
    limb: Limb,
    check: ICheck,
    point: IAutoMovieVector3,
  ): void {
    if (check.shortfall <= 0) return;
    const mm = (metres: number): string => (1000 * metres).toFixed(0);
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
   * @returns The check.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what of the posture is read, which joint the end is and the frame of the point.
   * @evidence contracts/development/implementation.md#principled-implementation The shoulder is read from the trunk's forward kinematics and the hip from the root and the pelvis joint, the places the limb fits start from; the length is the body's own two segments.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One root lookup by limb kind, then `measure`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig without the shoulder bone throws instead of measuring from the origin.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass and no limb fit.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanTrunk.resolve` and `hipJoints`, the owners of those joints, and `measure`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function check(
    body: IHumanBody,
    posture: IHumanPosture,
    limb: Limb,
    point: IAutoMovieVector3,
  ): ICheck {
    const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
    if (limb.endsWith("Leg"))
      return measure(
        hipJoints(
          body,
          posture.root,
          resolveHumanPosture.heading(posture),
          posture.joints.hips,
        )[side],
        body.measure.thigh + body.measure.shank,
        point,
      );
    const shoulder = HumanTrunk.resolve(body, posture).get(`${side}UpperArm`);
    if (shoulder === undefined)
      throw new Error(`The rig lacks ${side}UpperArm, so it has no shoulder`);
    return measure(
      shoulder.worldPosition,
      body.measure.upperArm + body.measure.forearm,
      point,
    );
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
   * @evidence contracts/development/implementation.md#efficient-algorithms Thirteen forward-kinematics passes for a hundredth of a degree over 45 degrees; a law calls it once at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanLean.tip`, the owner of a tipped posture, and `check`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function lean(
    body: IHumanBody,
    posture: IHumanPosture,
    limb: "leftArm" | "rightArm",
    point: IAutoMovieVector3,
    limit: number = LEAN_LIMIT,
  ): number {
    const at = (pitch: number): ICheck =>
      check(
        body,
        AutoMovieMotionHumanLean.tip(body, posture, pitch, 0),
        limb,
        point,
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
    body: IHumanBody,
    posture: IHumanPosture,
    limb: Limb,
    point: IAutoMovieVector3,
    policy: Policy,
  ): IFit {
    const reach: ICheck = check(body, posture, limb, point);
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
