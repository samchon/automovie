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

/**
 * Where an action is directed: a target resolved to a place, and a place
 * turned into a hand's or a foot's goal.
 *
 * Every directed action works with no target. A place is a point with the
 * outward normal of whatever is there, and it says whether anything is
 * there: a person, a prop, the performer's own body and a point given with a
 * normal are solid; a bare point, the virtual opponent of `none` and the
 * default place are not. An action without a target (absent, or `none` with
 * neither a line nor a range) takes its own default place, stated in the
 * performer's proportions, and performs the same movement in the air: a punch
 * extends to it, a handshake offers the hand there, a pick up closes the
 * hand on nothing. A law reads `solid` to decide what only a real thing
 * allows (a contact window, a grip, the aimed movement time) and never
 * branches on the target's kind.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a place is, which targets are solid, what an action without a target does and what a law may read.
 * @evidence contracts/development/design.md#principled-representation A target of any kind reduces to a point, a facing and whether it is solid, the three facts a movement toward it needs; a default is stated in body proportions so one record fits every stature.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One place type, one default record with three named defaults and their names, the resolver, the default's place, the way away and two goal builders; the only caller of the context's aim outside the gaze. The named places of the air and their resolution to a default record are `AutoMovieMotionHumanTargetGrid`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union and the hand and foot owners; a self region the trunk does not carry throws instead of reading a limb that is not solved yet.
 */
export namespace AutoMovieMotionHumanTarget {
  /**
   * The bones a posture places without solving a limb (`HumanTrunk.resolve`):
   * a region of the performer's own body is read on the posture only on
   * these; one on any other bone rides a limb not solved yet.
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
   * - `desk`: at desk height (720 mm for a 1.7 m person) a forearm away,
   *   facing up; a keyboard, a table top;
   * - `floor`: on the floor a forearm ahead of the feet, facing up; a thing
   *   picked up or put down.
   */
  export const DEFAULTS: Readonly<
    Record<"ahead" | "desk" | "floor", IAutoMovieMotionHumanTarget.IDefault>
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and that the result is not solid.
   * @evidence contracts/development/implementation.md#principled-implementation The shares times the body's stature, arm and half shoulder width give a point of the performer's floor frame, whose origin is on the floor under the root; it faces back along the heading or up.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One floor-frame transform and one facing choice.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The floor is the world's `y = 0`, the plane every foot placement stands on, and not the root's own height, which a crouch lowers.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanFrame.point`, the owner of the floor-frame transform.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function fallback(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">,
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
   * @param posture The performer's posture then: a default place is ahead of it and a self region is read on it.
   * @param place The action's default place.
   * @returns The place.
   * @throws {Error} When a self region is on a limb, which a posture does not place before its limbs are solved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, which of them a targetless action uses and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each kind is read by its owner (the context's aim, the trunk's forward kinematics, the default) and marked solid when a real surface is there: a person, a prop, the performer's own body, a point given with its normal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per case of the target union.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A `none` that states a line or a range keeps the virtual opponent it asks for instead of the default; a limb's self region throws instead of reading an unsolved bone.
   * @evidence contracts/development/implementation.md#efficient-algorithms One aim or one forward-kinematics pass per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to aim, HumanTrunk.region and fallback. A self-region may synchronously borrow its parent's same-body FK metadata; the actual raw posture and region are still read normally.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function resolve(
    context: Pick<IAutoMovieMotionHumanActionContext, "aim" | "body">,
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
          ...HumanTrunk.region(context.body, posture, target.region, resolution),
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
   * The horizontal unit direction from a place to a point of the body: the
   * way a body is pushed by what comes from the place, and the way it shrinks
   * from it.
   *
   * @param place The place the threat or the blow comes from.
   * @param point The point of the body, world metres.
   * @param yaw The body's heading, degrees about +Y.
   * @returns The direction, world; backward of the heading when the point is above or below the place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the direction's meaning, the inputs' frames and units and the fallback.
   * @evidence contracts/development/implementation.md#principled-implementation A standing body is displaced over the floor, so the push is the horizontal part of the line from the place to the body, normalised.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One difference and one conditional.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A source directly above or below has no horizontal direction, so the body goes backward of its own heading, the way a person recoils from a blow with no side; the threshold of a micrometre only guards the division.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `flinch`, `stagger` and `knockdown` read their direction here, on `Vector3` and `HumanFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
   * The arm target that lays a hand surface on a place: the surface's point
   * on the place's point and its normal against the place's normal.
   *
   * @param body The body.
   * @param posture The posture that carries the elbow's hint and the heading.
   * @param side The hand.
   * @param place The place.
   * @param options The surface, the shape, the forward, the bend and the curl.
   * @returns The target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how the surface meets the place and what the posture and the options decide.
   * @evidence contracts/development/implementation.md#principled-implementation A surface touches a place when their normals oppose, so the hand's rotation aligns the surface's normal with the place's reversed; the remaining turn about the normal takes the asked forward, or the heading, or up where the heading runs along the normal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward choice, one alignment and one bend: the solved elbow place when the options name neither a bend nor an outward share, the preset otherwise.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The default forward is never parallel to the normal: the heading is horizontal, so when it runs along the normal the vertical cannot. A goal the solver refuses takes the `hang` preset, the default before the solver, and the resolver's audits report the reach.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanHand.offset`, `HumanHand.align` and `HumanHand.place` for the rotation and the wrist, and `AutoMovieMotionHumanBend.solve` and `arm` for the hint.
   * @evidence contracts/development/implementation.md#efficient-algorithms The solver's bounded sweep runs only for a goal without a stated bend; a stated bend is one lookup.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function hand(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw"> &
      Partial<Pick<IAutoMovieMotionHumanPosture, "pitch" | "roll">>,
    side: AutoMovieHumanSide,
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    options: IAutoMovieMotionHumanTarget.IHand = {},
  ): IAutoMovieMotionHumanArmTarget.ITarget {
    return HumanHandTarget(body, posture, side, place, options);
  }

  /**
   * Prepare fixed hand-surface geometry while each queried posture/point
   * retains its actual default bend search or explicitly requested preset.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed body/side/normal/options and varying posture/world-point targets.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates unchanged surface geometry and explicit-forward alignment preparation to the same owner as hand, retaining actual current Bend solving.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One facade exposes HumanHandTarget.prepare for crawl's repeated flat-palm targets.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No target point, solved elbow or previous fit is cached; existing defaults, reserve, fallback and ranges remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed explicit-forward alignment/local wrist offset prepare once; every varying default bend retains its bounded search and no measured speedup is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicit unchanged body/surface/normal/options lifetime proves geometric reuse; current heading is still read when forward is absent.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned plan-owned reader retains constant geometry snapshots and body metadata until release, with fresh output rotations and no query/result history.
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
   * The foot placement that puts a point of the sole on a place, the foot
   * flat and pointed along a heading.
   *
   * @param body The body.
   * @param side The foot.
   * @param place The place.
   * @param heading Where the foot points, degrees about +Y.
   * @param pivot The point of the sole put on the place; the ball when absent.
   * @returns The placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the foot's attitude and the default pivot.
   * @evidence contracts/development/implementation.md#principled-implementation The rigid relation of a sole point to the ankle under the foot's rotation, the one `HumanFoot.pivot` owns.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The place's normal is not read: a foot set down is flat on the floor, and a foot that strikes is turned by its striking law.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanFoot.pivot`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function foot(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point">,
    heading: number,
    pivot: "heel" | "ball" | "toe" | "sole" = "ball",
  ): IAutoMovieMotionHumanFoot.IPlacement {
    return HumanFoot.pivot(body, side, pivot, place.point, heading, 0);
  }
}
