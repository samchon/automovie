import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { AutoMovieMotionHumanTouchStance } from "./AutoMovieMotionHumanTouchStance";

/** The alternatives of `FootPivot`'s site. */
type FootPivot = "heel" | "ball" | "toe" | "sole";

/** The alternatives of `HandPlace`'s site. */
type HandPlace = "point" | "normal";

/** The alternatives of `HandPostureItem`'s site. */
type HandPostureItem = "pitch" | "roll";

/** The alternatives of `HandPosture`'s site. */
type HandPosture = "root" | "yaw";

/** The alternatives of `ResolveContext`'s site. */
type ResolveContext = "aim" | "body";

/** The alternatives of `FallbackPosture`'s site. */
type FallbackPosture = "root" | "yaw";

/** The alternatives of `DEFAULTSEntryItem`'s site. */
type DEFAULTSEntryItem = "ahead" | "desk" | "floor";

/**
 * Where an action is directed: a target resolved to a place, and a place turned
 * into a hand's or a foot's goal.
 *
 * Every directed action works with no target. A place is a point with the
 * outward normal of whatever is there, and it says whether anything is there: a
 * person, a prop, the performer's own body and a point given with a normal are
 * solid; a bare point, the virtual opponent of `none` and the default place are
 * not. An action without a target (absent, or `none` with neither a line nor a
 * range) takes its own default place, stated in the performer's proportions,
 * and performs the same movement in the air: a punch extends to it, a handshake
 * offers the hand there, a pick up closes the hand on nothing. A law reads
 * `solid` to decide what only a real thing allows (a contact window, a grip,
 * the aimed movement time) and never branches on the target's kind.
 */
export namespace AutoMovieMotionHumanTarget {
  /**
   * The bones a posture places without solving a limb (`HumanTrunk.resolve`): a
   * region of the performer's own body is read on the posture only on these;
   * one on any other bone rides a limb not solved yet.
   */
  export const TRUNK: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([
      "hips",
      "spine",
      "chest",
      "upperChest",
      "neck",
      "head",
      "leftEye",
      "rightEye",
      "jaw",
      "leftShoulder",
      "rightShoulder",
    ]);

  /**
   * Default places (provisional shares):
   *
   * - `ahead`: at chest height most of an arm away, facing the performer; an
   *   offered hand, a push, a touch in the air;
   * - `desk`: at desk height (720 mm for a 1.7 m person) a forearm away, facing
   *   up; a keyboard, a table top;
   * - `floor`: on the floor a forearm ahead of the feet, facing up; a thing
   *   picked up or put down.
   */
  export const DEFAULTS: Readonly<
    Record<DEFAULTSEntryItem, IAutoMovieMotionHumanTarget.IDefault>
  > = {
    ahead: { height: 0.72, range: 0.8, facing: "performer" },
    desk: { height: 0.42, range: 0.6, facing: "up" },
    floor: { height: 0, range: 0.6, facing: "up" },
  };

  /**
   * A default place on a posture.
   *
   * @param body The body.
   * @param posture The root and the heading the place is ahead of.
   * @param place The default.
   * @returns The place; never solid.
   */
  export function fallback(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, FallbackPosture>,
    place: IAutoMovieMotionHumanTarget.IDefault,
  ): IAutoMovieMotionHumanTarget.IPlace {
    const m = body.measure;
    const frame: IAutoMovieMotionHumanFrame = {
      origin: { x: posture.root.x, y: 0, z: posture.root.z },
      yaw: posture.yaw,
    };
    return {
      point: HumanFrame.point(frame, {
        x: (place.lateral ?? 0) * m.shoulderHalfWidth,
        y: place.height * m.stature,
        z: place.range * (m.upperArm + m.forearm),
      }),
      normal:
        place.facing === "up"
          ? { x: 0, y: 1, z: 0 }
          : HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
              { x: 0, y: 0, z: -1 },
            ),
      solid: false,
    };
  }

  /**
   * A target resolved to a place.
   *
   * @param context The action's body and aim.
   * @param target The target; absent for an action without one.
   * @param seconds Film seconds the target is read at.
   * @param posture The performer's posture then: a default place is ahead of it
   *   and a self region is read on it.
   * @param place The action's default place.
   * @returns The place.
   * @throws {Error} When a self region is on a limb, which a posture does not
   *   place before its limbs are solved.
   */
  export function resolve(
    context: Pick<IAutoMovieMotionHumanActionContext, ResolveContext>,
    target: IAutoMovieMotionTarget | undefined,
    seconds: number,
    posture: IAutoMovieMotionHumanPosture,
    place: IAutoMovieMotionHumanTarget.IDefault,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanTarget.IPlace {
    if (target === undefined) return fallback(context.body, posture, place);
    switch (target.kind) {
      case "none":
        return target.line === undefined && target.range === undefined
          ? fallback(context.body, posture, place)
          : { ...context.aim(target, seconds), solid: false };
      case "self": {
        const bone: AutoMovieHumanoidBone =
          context.body.surfaces.regions[target.region].bone;
        if (!TRUNK.has(bone))
          throw new HumanRefusal({
            kind: "parameter",
            axis: "target",
            value: target.region,
            reason: `The region ${target.region} rides ${bone}, a limb bone a posture does not place; a self target is a region of the trunk or the head`,
            fix: "aim at a region of the trunk or the head",
          });
        return {
          ...HumanTrunk.region(
            context.body,
            posture,
            target.region,
            resolution,
          ),
          solid: true,
        };
      }
      case "point":
        return {
          ...context.aim(target, seconds),
          solid: target.normal !== undefined,
        };
      case "person":
      case "prop":
        return { ...context.aim(target, seconds), solid: true };
    }
  }

  /**
   * The horizontal unit direction from a place to a point of the body: the way
   * a body is pushed by what comes from the place, and the way it shrinks from
   * it.
   *
   * @param place The place the threat or the blow comes from.
   * @param point The point of the body, world metres.
   * @param yaw The body's heading, degrees about +Y.
   * @returns The direction, world; backward of the heading when the point is
   *   above or below the place.
   */
  export function away(
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point">,
    point: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieVector3 {
    const d: IAutoMovieVector3 = {
      x: point.x - place.point.x,
      y: 0,
      z: point.z - place.point.z,
    };
    return Vector3.length(d) > 1e-6
      ? Vector3.normalize(d)
      : HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw },
          { x: 0, y: 0, z: -1 },
        );
  }

  /**
   * The arm target that lays a hand surface on a place: the surface's point on
   * the place's point and its normal against the place's normal.
   *
   * @param body The body.
   * @param posture The posture that carries the elbow's hint and the heading.
   * @param side The hand.
   * @param place The place.
   * @param options The surface, the shape, the forward, the bend and the curl.
   * @returns The target.
   */
  export function hand(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, HandPosture> &
      Partial<Pick<IAutoMovieMotionHumanPosture, HandPostureItem>>,
    side: AutoMovieHumanSide,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, HandPlace>,
    options: IAutoMovieMotionHumanTarget.IHand = {},
  ): IAutoMovieMotionHumanArmTarget.ITarget {
    return HumanHandTarget(body, posture, side, place, options);
  }

  /**
   * Prepare fixed hand-surface geometry while each queried posture/point
   * retains its actual default bend search or explicitly requested preset.
   */
  export function prepareHand(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    normal: IAutoMovieVector3,
    options: IAutoMovieMotionHumanTarget.IHand = {},
  ): ReturnType<typeof HumanHandTarget.prepare> {
    return HumanHandTarget.prepare(body, side, normal, options);
  }

  /**
   * The first feasible of a law's candidate sites or grips (Miller and Allen
   * 2004, IEEE Robotics and Automation Magazine 11(4):110-122, "Future
   * Directions", p. 122: each candidate grasp "is tested ... and if the grasp
   * is feasible (there is no conflict with the arm kinematics and the hand or
   * arm is not blocked by an obstacle), it is evaluated").
   *
   * Feasibility is the whole test here: a candidate's `test` is the law's own
   * reach and clearance of the hand and arm, and a reach refusal it raises
   * marks it infeasible. The paper's grasp quality, the friction-based ε1 of
   * its "Quality Measures", is not read, so the feasible candidates are equal
   * and the law's declared order decides, as a stance's does
   * (`AutoMovieMotionHumanTouchStance.choose`, whose candidate loop and refusal
   * this shares): the first feasible candidate is taken and those after it are
   * not tested.
   *
   * @param props The candidates in the law's order and the test of one.
   * @returns The first feasible candidate's result.
   * @throws {HumanRefusal} When none is feasible: the first candidate's
   *   refusal, its reason followed by every other candidate's.
   */
  export function feasible<Candidate, Result>(
    props: IFeasible<Candidate, Result>,
  ): Result {
    return AutoMovieMotionHumanTouchStance.choose<Candidate, Result>({
      candidates: props.candidates,
      reach: props.test,
    });
  }

  /** A law's candidate sites or grips and the feasibility test of one. */
  export interface IFeasible<Candidate, Result> {
    /** The candidates, in the law's declared order of preference. */
    candidates: readonly Candidate[];

    /**
     * The feasibility test of one candidate: its result when the arm reaches it
     * and neither hand nor arm is blocked, a reach refusal when not.
     */
    test: (candidate: Candidate) => Result;
  }

  /**
   * The foot placement that puts a point of the sole on a place, the foot flat
   * and pointed along a heading.
   *
   * @param body The body.
   * @param side The foot.
   * @param place The place.
   * @param heading Where the foot points, degrees about +Y.
   * @param pivot The point of the sole put on the place; the ball when absent.
   * @returns The placement.
   */
  export function foot(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point">,
    heading: number,
    pivot: FootPivot = "ball",
  ): IAutoMovieMotionHumanFoot.IPlacement {
    return HumanFoot.pivot(body, side, pivot, place.point, heading, 0);
  }
}
