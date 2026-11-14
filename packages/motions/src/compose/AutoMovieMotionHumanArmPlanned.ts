import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  physicalShapeNormal,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryModel } from "../posture/HumanArmTrajectoryModel";
import { HumanColliders } from "../posture/HumanColliders";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import type { AutoMovieMotionHumanArmCarry } from "./AutoMovieMotionHumanArmCarry";

/**
 * An arm's whole action planned as one trajectory (`HumanArmTrajectory`):
 * its reach from rest, its hold on the goal's site and its return, read off
 * the posture so far and solved once, alone or with the other arm of the
 * same span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is planned, from what and how often.
 * @evidence contracts/development/design.md#principled-representation The action's four instants, the group of arms solved together, each arm's task and the reach's duration, the inputs of one trajectory problem.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The span, the group and its constructor, the planned arm, the planner and the reach's duration, read by the carry, the touch law and the gesture law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The trajectory's problem is the planner's own (`HumanArmTrajectory`); this file only reads it off the action.
 */
export namespace AutoMovieMotionHumanArmPlanned {
  /**
   * The instants of an action an arm is planned over, seconds since the
   * action's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each instant's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The reach, the hold and the return are bounded by four instants of the action's clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by `planned`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Seconds, not clock names, so a law without a clock (a gesture) fits.
   */
  export interface ISpan {
    /** The arm leaves its rest. */
    start: number;

    /** The hand is on its site. */
    ready: number;

    /** The hand leaves its site; `end` itself for a hand that stays on it to the end. */
    relax: number;

    /** The arm is back at rest, or, for a hand that stays on its site, the span ends with it there. */
    end: number;
  }

  /**
   * Arms moved over one span as one trajectory problem: each carry that
   * names the group joins it, and the first to be written solves it for all.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States who joins and who solves.
   * @evidence contracts/development/design.md#principled-representation Two arms whose paths are coupled are one problem (Erdmann and Lozano-Pérez 1987), so the group holds them and their one solution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members, the solution and the guard against re-entry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The solution is kept so every member reads the same plan.
   */
  export interface ITogether {
    /** The carries of the group, in the order they joined. */
    carries: AutoMovieMotionHumanArmCarry.ICarry[];

    /** Each arm's trajectory, once solved. */
    solved?: Map<HumanHand.Side, HumanArmTrajectory.Trajectory>;

    /** Whether the group is being solved, so a member asked during the solve is refused instead of solved twice. */
    solving?: boolean;
  }

  /**
   * One arm of `planned`: the carry's own members, and the arm it returns to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is taken from the carry and what is added.
   * @evidence contracts/development/design.md#principled-representation An arm's task: its rest, its goal, its weight and its declared contacts, and the arm it ends at.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The carry's members `planned` reads, and `back`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The members are the carry's own by `Pick`, not restated.
   */
  export interface IPlanned
    extends Pick<AutoMovieMotionHumanArmCarry.ICarry, "side" | "rest" | "goal" | "perceived" | "weight" | "rests" | "disc" | "on"> {
    /** The arm at the end of the span, where it returns to another arm than it left; `rest` when absent. */
    back?: AutoMovieMotionHumanArmAngles.IAngles;
  }

  /**
   * A group for arms moved together.
   *
   * @returns The empty group.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation A group starts empty; its carries join it as they are built.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: no member is assumed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The group holds its carries and their solution, released with the primitives that close over it.
   */
  export function together(): ITogether {
    return { carries: [] };
  }

  /**
   * The shortest reach that keeps an arm within the audit's travel bound
   * (`HumanArmTrajectoryModel.SPEED_LIMIT`) on the joint-space blend from one
   * arm to another: a minimum-jerk reach peaks at 1.875 times its mean speed
   * (Flash and Hogan 1985, J Neurosci 5:1688), so a path of length L takes
   * at least 1.875 L over the bound, L the longest of the elbow's, the
   * wrist's and the middle fingertip's arcs.
   *
   * @param body The body.
   * @param posture The posture the arm moves in.
   * @param side The arm.
   * @param from The arm at the start.
   * @param to The arm at the end.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bound, its source and the arcs it reads.
   * @evidence contracts/development/implementation.md#principled-implementation The minimum-jerk profile's peak-to-mean speed ratio over the longest arc of the blend.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One base pose, the arcs sampled along the blend, one division.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The arc is measured on the blend the arm takes, not on the straight line between the ends.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve and `ARC` resolves of the arm.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `blendHumanJoint`, `HumanArmClearance.posed` and `poseBones`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function reaching(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    from: HumanArmClearance.IArm,
    to: HumanArmClearance.IArm,
  ): number {
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${side}Arm`];
    const base: IAutoMoviePose = resolveHumanPosture(body, { ...posture, limbs });
    const points = (w: number): IAutoMovieVector3[] => {
      const arm: HumanArmClearance.IArm = {
        upper: blendHumanJoint(body, `${side}UpperArm`, from.upper, to.upper, w),
        lower: blendHumanJoint(body, `${side}LowerArm`, from.lower, to.lower, w),
        hand: blendHumanJoint(body, `${side}Hand`, from.hand, to.hand, w),
      };
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, HumanArmClearance.posed(base, side, arm));
      return [`${side}LowerArm`, `${side}Hand`, `${side}MiddleDistal`].map(
        (bone: string): IAutoMovieVector3 => bones.get(bone as AutoMovieHumanoidBone)!.worldPosition,
      );
    };
    const length: number[] = [0, 0, 0];
    let last: IAutoMovieVector3[] = points(0);
    for (let i: number = 1; i <= ARC; ++i) {
      const next: IAutoMovieVector3[] = points(i / ARC);
      next.forEach((p: IAutoMovieVector3, j: number): void => {
        length[j]! += Vector3.length(Vector3.subtract(p, last[j]!));
      });
      last = next;
    }
    return (1.875 * Math.max(...length)) / HumanArmTrajectoryModel.SPEED_LIMIT;
  }

  /**
   * Arms solved as one trajectory problem over their span
   * (`HumanArmTrajectory`), against the posture so far with every one of
   * them left out: a carry's, and a whole-body law's that writes its arms
   * itself (a gesture).
   *
   * Every goal is read as the plan perceives it (`ICarry.perceived`), so a
   * goal on another person reads them where the performer saw them when the
   * plan starts, never at a later second.
   *
   * The waypoints: the reach and the return spaced by the arc their blend
   * covers (`SPACING` of the farthest probe's travel, between a sixth and a
   * thirtieth of a second), the hold at the least spacing (`LEAST`, six a
   * second); the solve then splits every interval that does not bound its
   * site's path or its probes' clearance (`HumanArmRefine`), down to the
   * frame grid at the finest, so a still hold keeps few waypoints and a
   * stroke as many as its motion needs. On the hold each arm's site is its
   * goal's contact in the world; a site on a segment of another arm of the
   * group rides that arm as it is solved.
   *
   * @param body The body.
   * @param span The span's instants.
   * @param carries The arms.
   * @param before The posture so far at any second of the span.
   * @returns Each arm's trajectory.
   * @throws {HumanRefusal} When no trajectory meets the constraints (`HumanArmTrajectory.solve`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the problem, the waypoints and their spacing, the sites and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The arms' whole action is one trajectory optimisation (TrajOpt), read off the very postures it is written on, so the plan is a constant of the action.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Waypoints, postures and poses, each arm's sites, the bases, one solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The waypoints are refined on the trajectory by what they must bound, never by a declared rate; the goal is read at every waypoint, not interpolated.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture so far, one resolve and one goal read per instant and arm, kept across the refinement; two reach measures; one refined solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `resolveHumanPosture`, `resolveHumanPosture.world`, `reaching` and `HumanArmTrajectory.solve`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the trajectories, which hold the solved waypoints only.
   */
  export function planned(
    body: IHumanBody,
    span: ISpan,
    carries: readonly IPlanned[],
    before: (seconds: number) => IHumanPosture,
  ): Map<HumanHand.Side, HumanArmTrajectory.Trajectory> {
    // Each phrase is an interval cut into pieces, its own end left to the
    // next one; an empty interval (a hold that lasts to the end, a reach
    // that starts on its site) has no piece, and the last phrase closes on
    // its end itself.
    const times: number[] = [];
    const cut = (a: number, b: number, pieces: number, last: boolean): void => {
      for (let i: number = 0; i < pieces; ++i) times.push(a + ((b - a) * i) / pieces);
      if (last) times.push(b);
    };
    const travel = (at: number, sign: -1 | 1): number => {
      let longest: number = 0;
      for (const c of carries) {
        const p: IHumanPosture = before(at);
        const fit: AutoMovieMotionHumanArmAngles.IAngles = AutoMovieMotionHumanArmAngles.angles(
          resolveHumanPosture(body, { ...p, limbs: { ...p.limbs, [`${c.side}Arm`]: aim(c, p, at) } }),
          c.side,
        );
        longest = Math.max(longest, (reaching(body, p, c.side, sign === 1 ? c.rest : (c.back ?? c.rest), fit) * HumanArmTrajectoryModel.SPEED_LIMIT) / 1.875);
      }
      return longest;
    };
    // A posture with the planned arms left out.
    const without = (p: IHumanPosture): IHumanPosture => {
      const limbs: IHumanPosture["limbs"] = { ...p.limbs };
      for (const c of carries) delete limbs[`${c.side}Arm`];
      return { ...p, limbs };
    };
    const spaced = (seconds: number, arc: number): number =>
      Math.min(Math.ceil(seconds / STEP), Math.max(Math.ceil(seconds * LEAST), Math.ceil(arc / SPACING), 1));
    cut(span.start, span.ready, spaced(span.ready - span.start, travel(span.ready, 1)), false);
    cut(span.ready, span.relax, span.relax > span.ready ? Math.max(1, Math.ceil((span.relax - span.ready) * LEAST)) : 0, false);
    cut(span.relax, span.end, spaced(span.end - span.relax, travel(span.relax, -1)), true);

    // Each instant's posture so far and its pose with the planned arms left
    // out, the base each arm is read against, read once however often the
    // refinement asks.
    const read: Map<number, { posture: IHumanPosture; pose: IAutoMoviePose }> = new Map();
    const at = (t: number): { posture: IHumanPosture; pose: IAutoMoviePose } => {
      let found: { posture: IHumanPosture; pose: IAutoMoviePose } | undefined = read.get(t);
      if (found === undefined) {
        const posture: IHumanPosture = before(t);
        found = { posture, pose: resolveHumanPosture(body, without(posture)) };
        read.set(t, found);
      }
      return found;
    };
    // Each instant's base, one record however often the refinement reads it,
    // so the frames built on it are built once (`HumanArmFrame.of`).
    const bases: Map<number, HumanArmTrajectory.IProblem["bases"][number]> = new Map();
    const base = (t: number): HumanArmTrajectory.IProblem["bases"][number] => {
      let found: HumanArmTrajectory.IProblem["bases"][number] | undefined = bases.get(t);
      if (found === undefined) {
        const { posture, pose } = at(t);
        found = {
          pose,
          others: carries.flatMap((c: IPlanned): HumanColliders.IPlaced[] => {
            const goal: IHumanPosture.IGoal = aim(c, posture, t);
            return [...(goal.clear ?? []), ...(goal.rests ?? [])];
          }),
        };
        bases.set(t, found);
      }
      return found;
    };
    const holding = (t: number): boolean => t >= span.ready - 1e-9 && t <= span.relax + 1e-9;
    const ready: IHumanPosture = at(span.ready).posture;
    const guesses: AutoMovieMotionHumanArmAngles.IAngles[] = carries.map(
      (c: IPlanned): AutoMovieMotionHumanArmAngles.IAngles =>
        AutoMovieMotionHumanArmAngles.angles(
          resolveHumanPosture(body, { ...ready, limbs: { ...ready.limbs, [`${c.side}Arm`]: aim(c, ready, span.ready) } }),
          c.side,
        ),
    );
    const problem = (waypoints: readonly number[]): HumanArmTrajectory.IProblem => ({
      body,
      times: waypoints,
      share: carries[0]!.weight,
      arms: carries.map((c: IPlanned, a: number): HumanArmTrajectory.IArm => {
        const rider: number = c.on === undefined ? -1 : carries.findIndex((o: IPlanned): boolean => o !== c && c.on!.startsWith(o.side));
        return {
          side: c.side,
          rest: c.rest,
          ...(c.back === undefined ? {} : { back: c.back }),
          ...(c.rests === undefined ? {} : { rests: c.rests }),
          sites: waypoints.map((t: number): HumanArmTrajectory.ISite | undefined => {
            if (!holding(t)) return undefined;
            const { posture, pose } = at(t);
            const own: HumanArmTrajectory.ISite = site(body, pose, c, aim(c, posture, t));
            return rider < 0 ? own : { ...own, on: { ...riding(body, pose, carries[rider]!.side, c.on!, own.point, own.rotation), arm: rider } };
          }),
          guess: guesses[a]!,
        };
      }),
      bases: waypoints.map((t: number): HumanArmTrajectory.IProblem["bases"][number] => base(t)),
    });
    const solved: HumanArmTrajectory.Trajectory[] = HumanArmTrajectory.solve(problem, times);
    return new Map(carries.map((c: IPlanned, a: number): [HumanHand.Side, HumanArmTrajectory.Trajectory] => [c.side, solved[a]!]));
  }

  /**
   * How far a planned arm's goal has moved at a second of its hold since the
   * plan perceived it: the site the goal puts the hand on now (a person one
   * frame behind), less the site the plan used for that second, both on the
   * pose at the second. Zero wherever the goal has not moved since the plan.
   *
   * @param body The body.
   * @param carry The arm.
   * @param posture The posture so far at the second.
   * @param seconds The second, on the hold.
   * @returns The sites' difference, metres, the contact in the hand's frame, and the base the arm is read against.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two sites, the pose they are read on and when the result is zero.
   * @evidence contracts/development/implementation.md#principled-implementation A feedback term is driven by error: the target's motion since the feed-forward plan perceived it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One base pose, two goal reads, one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both sites are read on the same pose, so the posture so far cancels and only the target's motion is left.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolve and two goal reads per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `site`, the planner's own reading of a goal.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function moved(
    body: IHumanBody,
    carry: IPlanned,
    posture: IHumanPosture,
    seconds: number,
  ): { error: IAutoMovieVector3; contact: IAutoMovieVector3; base: HumanArmTrajectory.IProblem["bases"][number] } {
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${carry.side}Arm`];
    const pose: IAutoMoviePose = resolveHumanPosture(body, { ...posture, limbs });
    const goal: IHumanPosture.IGoal = carry.goal(posture, seconds);
    const now: HumanArmTrajectory.ISite = site(body, pose, carry, goal);
    const then: HumanArmTrajectory.ISite = site(body, pose, carry, aim(carry, posture, seconds));
    return {
      error: Vector3.subtract(now.point, then.point),
      contact: now.contact,
      base: { pose, others: [...(goal.clear ?? []), ...(goal.rests ?? [])] },
    };
  }
  /** The goal as the plan perceives it. */
  function aim(carry: IPlanned, posture: IHumanPosture, seconds: number): IHumanPosture.IGoal {
    return (carry.perceived ?? carry.goal)(posture, seconds);
  }

  /** An arm's site from its goal on a pose: the goal's contact where its rotation carries it from the wrist's point. */
  function site(body: IHumanBody, pose: IAutoMoviePose, carry: IPlanned, goal: IHumanPosture.IGoal): HumanArmTrajectory.ISite {
    const world: IHumanPosture.IGoal = resolveHumanPosture.world(body, pose, `${carry.side}Arm`, goal);
    return {
      point:
        world.contact === undefined
          ? world.point
          : Vector3.add(world.point, Quaternion.rotateVector(world.rotation ?? Quaternion.identity(), world.contact)),
      contact: world.contact ?? { x: 0, y: 0, z: 0 },
      disc: carry.disc ?? AutoMovieMotionHumanAuditTangle.BUILT,
      ...(world.rotation === undefined ? {} : { rotation: world.rotation }),
    };
  }
}

/**
 * A site on a segment of another arm of the group, in that segment's own
 * frame where the base holds it: the point, the touched collider's outward
 * normal there and the hand's rotation.
 */
function riding(
  body: IHumanBody,
  pose: IAutoMoviePose,
  side: HumanHand.Side,
  bone: AutoMovieHumanoidBone,
  point: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion | undefined,
): Omit<NonNullable<HumanArmTrajectory.ISite["on"]>, "arm"> {
  const owner: "upper" | "lower" | "hand" = bone.endsWith("UpperArm") ? "upper" : bone.endsWith("LowerArm") ? "lower" : "hand";
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, pose);
  const by: IAutoMovieResolvedBone = bones.get(`${side}${owner === "upper" ? "UpperArm" : owner === "lower" ? "LowerArm" : "Hand"}`)!;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(by.worldRotation);
  const segment: HumanColliders.IPlaced | undefined = HumanColliders.placed(body, bones).find((s: HumanColliders.IPlaced): boolean => s.bone === by.bone);
  let normal: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(point, by.worldPosition));
  let least: number = Infinity;
  for (const shape of segment?.shapes ?? []) {
    const d: number = physicalShapeSegmentDistance(segment!.pose, shape, point, point);
    if (d < least) {
      least = d;
      normal = physicalShapeNormal(segment!.pose, shape, point, normal);
    }
  }
  return {
    owner,
    point: Quaternion.rotateVector(inverse, Vector3.subtract(point, by.worldPosition)),
    normal: Quaternion.rotateVector(inverse, normal),
    ...(rotation === undefined ? {} : { rotation: Quaternion.multiply(inverse, rotation) }),
  };
}

/** The spacing of the trajectory's waypoints, seconds at most: the frame grid, a thirtieth of a second. */
const STEP: number = 1 / 30;

/** The least waypoints a second of a reach, a return or a hold, the swept clearance's spacing. */
const LEAST: number = 6;

/** The farthest probe's travel between two waypoints of a reach, metres. */
const SPACING: number = 0.08;

/** Samples along a blend whose arc is measured. */
const ARC: number = 32;
