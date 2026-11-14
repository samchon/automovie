import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanArmMove } from "./AutoMovieMotionHumanArmMove";
import { AutoMovieMotionHumanArmTarget } from "./AutoMovieMotionHumanArmTarget";
import type { AutoMovieMotionManner } from "./AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * The arm's phrases on a clock's standard instants: a visit, a stroke, a
 * strike and an oscillation of the hand, the contact window a phrase bears,
 * and the swing of an arm that hangs.
 *
 * The members are `AutoMovieMotionHumanArm`'s, which names them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phrases the file holds and who names them.
 * @evidence contracts/development/design.md#principled-representation Each phrase is one move whose target and weight are read off the clock's instants (Kendon's gesture phases), so a law states a phrase and not its windows.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The phrase record, four phrases, the contact window and the swing; `AutoMovieMotionHumanArm` re-exports each by name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every phrase delegates its movement to `AutoMovieMotionHumanArmMove.move`; a manner never moves a goal on a solid place, which `extended` keeps in one place.
 */
export namespace AutoMovieMotionHumanArmPhrase {
  /**
   * What every arm phrase takes: the arm, the clock whose standard instants
   * (`AutoMovieMotionClock.PHRASE`) it moves on, and where the hand leaves
   * from and returns to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its meaning, and the optional two what their absence means.
   * @evidence contracts/development/design.md#principled-representation A phrase is one arm moving on one clock from and back to one origin; the contact states that the place is solid by naming what the hand bears on, so a place in the air cannot carry a contact window.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members shared by `visit`, `stroke`, `strike` and `oscillate`; the clock, the origin, the contact window and the modifiers are their owners' types. No law reads the arm phrases yet: the reactions move no arm to a place, and the laws rebuilt for #3286 are the consumers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact is one optional record instead of a solid flag beside optional contact fields; the manner is picked from the manner's own modifiers.
   */
  export interface IPhrase {
    /** The body. */
    body: IHumanBody;

    /** A clock with the standard instants of a phrase. */
    clock: AutoMovieMotionClock.IClock;

    /** The arm. */
    side: HumanHand.Side;

    /** Where the hand is before and after the phrase. */
    origin: AutoMovieMotionHumanArmTarget.IOrigin;

    /**
     * What the hand bears on while it is on its place, when the place is
     * solid; absent for a place in the air, which gives no contact window.
     */
    contact?: Pick<IHumanContactWindow, "kind" | "support">;

    /**
     * The manner's sizes: the extent scales a place in the air and a
     * free-space amplitude, and the curvature bows the hand's way out and
     * back. A phrase that states a contact keeps its place whatever the
     * extent. Neutral when absent.
     */
    manner?: Pick<AutoMovieMotionManner.IModifiers, "extent" | "curvature">;
  }

  /**
   * A target with its point scaled about another point by the phrase's
   * extent; unchanged when the phrase states a contact, since a manner never
   * moves a goal on a solid place.
   */
  const extended = (
    props: Pick<IPhrase, "contact" | "manner">,
    about: IAutoMovieVector3,
    target: AutoMovieMotionHumanArmTarget.ITarget,
  ): AutoMovieMotionHumanArmTarget.ITarget => {
    const extent: number = props.manner?.extent ?? 1;
    return props.contact !== undefined || extent === 1
      ? target
      : {
          ...target,
          point: Vector3.add(
            about,
            Vector3.scale(Vector3.subtract(target.point, about), extent),
          ),
        };
  };

  /**
   * The contact window of a hand between two instants.
   *
   * @param props The phrase.
   * @param from The instant the hand comes to bear.
   * @param to The instant it leaves.
   * @returns One window when the phrase states a contact, none otherwise.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two instants and when no window is returned.
   * @evidence contracts/development/implementation.md#principled-implementation A plan's contact window is a share of its duration, so each instant's seconds are divided by the clock's duration; a place in the air bears nothing and gets no window.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional and one record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the kind and the support are the phrase's own, and an unknown instant throws through the clock.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every arm phrase builds its window here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function bearing(
    props: Pick<IPhrase, "clock" | "side" | "contact">,
    from: string,
    to: string,
  ): IHumanContactWindow[] {
    return props.contact === undefined
      ? []
      : [
          {
            part: `${props.side}Hand`,
            kind: props.contact.kind,
            from: props.clock.at(from) / props.clock.duration,
            to: props.clock.at(to) / props.clock.duration,
            support: props.contact.support,
          },
        ];
  }

  /**
   * A visit: the hand goes to a place, stays on it and comes back (a touch,
   * an offered hand, a hand laid on a table, a mimed grasp). It travels from
   * `start` to `stroke`, stays until `relax` and is back at `end`.
   *
   * @param props The phrase and the place's target.
   * @returns The primitive, with a contact window from `stroke` to `relax` when the phrase states a contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, the instants it travels, stays and returns on, and when it carries a contact window.
   * @evidence contracts/development/implementation.md#principled-implementation A point-to-point reach and its return are minimum-jerk movements (Flash and Hogan 1985), so the hand's weight toward the place is the clock's envelope rising to `stroke` and falling from `relax`, at rest on the place between. A place in the air is scaled about the origin by the manner's extent; a solid one is not.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `move` over the whole clock with the envelope as its weight, and the window from `bearing`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the place, the origin and the timing are the caller's, and no constant is stated here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the blend, the fit and the curved path to `move`, and the timing to the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second beyond `move`'s fit.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function visit(
    props: IPhrase & { target: AutoMovieMotionHumanArmTarget.Frame },
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...AutoMovieMotionHumanArmMove.move({
        body: props.body,
        side: props.side,
        from: 0,
        to: props.clock.duration,
        origin: props.origin,
        target: (
          posture: IHumanPosture,
          seconds: number,
        ): AutoMovieMotionHumanArmTarget.ITarget =>
          extended(
            props,
            AutoMovieMotionHumanArmTarget.point(posture, props.origin),
            props.target(posture, seconds),
          ),
        weight: (seconds: number): number =>
          props.clock.envelope(["start", "stroke"], ["relax", "end"], seconds),
        curvature: props.manner?.curvature ?? 0,
      }),
      contacts: bearing(props, "stroke", "relax"),
    };
  }

  /**
   * A stroke: the hand is brought to a ready pose by `ready`, waits until
   * `strokeStart`, follows a path until `strokeEnd`, stays at the path's end
   * until `relax` and is back at `end` (a gesture, a guard, a drawn line).
   *
   * @param props The phrase and the path: the target at the stroke's progress, 0 at the ready pose and 1 at the stroke's end.
   * @returns The primitive, with a contact window from `strokeStart` to `relax` when the phrase states a contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the phases with their instants, what the path's progress means and when it carries a contact window.
   * @evidence contracts/development/implementation.md#principled-implementation The phases of a gesture (Kendon 1980: preparation, hold, stroke, hold, retraction): the weight rises to the ready pose by `ready` and falls from `relax`, and the path is read at the clock's minimum-jerk progress from `strokeStart` to `strokeEnd`. A path in the air is scaled about its ready point by the manner's extent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `move` over the whole clock; the path decides the shape and this function only the progress it is read at.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the path and the timing are the caller's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `move`, the clock and `bearing`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second beyond `move`'s fit and the caller's path, which is read twice when the extent scales it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function stroke(
    props: IPhrase & {
      path: (
        posture: IHumanPosture,
        seconds: number,
        progress: number,
      ) => AutoMovieMotionHumanArmTarget.ITarget;
    },
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...AutoMovieMotionHumanArmMove.move({
        body: props.body,
        side: props.side,
        from: 0,
        to: props.clock.duration,
        origin: props.origin,
        target: (
          posture: IHumanPosture,
          seconds: number,
        ): AutoMovieMotionHumanArmTarget.ITarget => {
          const progress: number = props.clock.progress(
            "strokeStart",
            "strokeEnd",
            seconds,
          );
          const at: AutoMovieMotionHumanArmTarget.ITarget = props.path(
            posture,
            seconds,
            progress,
          );
          return progress <= 0
            ? at
            : extended(props, props.path(posture, seconds, 0).point, at);
        },
        weight: (seconds: number): number =>
          props.clock.envelope(["start", "ready"], ["relax", "end"], seconds),
        curvature: props.manner?.curvature ?? 0,
      }),
      contacts: bearing(props, "strokeStart", "relax"),
    };
  }

  /**
   * A strike: the hand is drawn to a chamber by `ready`, extends from
   * `strokeStart` and passes its target at `stroke` at speed. With a follow
   * phase it travels on past the target and slows to rest at `strokeEnd` (a
   * punch in the air); with none it is arrested at the target (a fist met by
   * a body). It stays until `relax` and is back at `end`.
   *
   * @param props The phrase, the chamber, the target and the weapons the strike carries.
   * @returns The primitive, with a contact window from `stroke` to `relax` when the phrase states a contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the phases with their instants, the free and the arrested ending and when it carries a contact window.
   * @evidence contracts/development/implementation.md#principled-implementation The hand's point runs from the chamber along the line to the target by `AutoMovieMotionClock.through`, which is 1 at `stroke` with speed, so a free strike travels past the target by the overshoot and an arrested one stops on it; the rotation and the bend stop at the target's. A target in the air is scaled about the chamber by the manner's extent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `move` over the whole clock whose target is the chamber before `strokeStart` and the line after it; the weapons pass through to the primitive.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the overshoot follows from the follow phase's length, not from a stated distance. Stopping on the first surface met is the performance's arrest, not decided here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `move`, `through` and `bearing`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second beyond `move`'s fit.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function strike(
    props: IPhrase & {
      chamber: AutoMovieMotionHumanArmTarget.Frame;
      target: AutoMovieMotionHumanArmTarget.Frame;
      weapons?: readonly IHumanActionPlan.IWeapon[];
    },
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...AutoMovieMotionHumanArmMove.move({
        body: props.body,
        side: props.side,
        from: 0,
        to: props.clock.duration,
        origin: props.origin,
        target: (
          posture: IHumanPosture,
          seconds: number,
        ): AutoMovieMotionHumanArmTarget.ITarget => {
          const chamber: AutoMovieMotionHumanArmTarget.ITarget = props.chamber(
            posture,
            seconds,
          );
          const p: number = AutoMovieMotionClock.through(
            props.clock,
            ["strokeStart", "stroke", "strokeEnd"],
            seconds,
          );
          if (p <= 0) return chamber;
          const target: AutoMovieMotionHumanArmTarget.ITarget = extended(
            props,
            chamber.point,
            props.target(posture, seconds),
          );
          return {
            ...target,
            point: Vector3.add(
              chamber.point,
              Vector3.scale(Vector3.subtract(target.point, chamber.point), p),
            ),
            rotation: Quaternion.slerp(
              chamber.rotation,
              target.rotation,
              Math.min(1, p),
            ),
            bend: Vector3.lerp(chamber.bend, target.bend, Math.min(1, p)),
          };
        },
        weight: (seconds: number): number =>
          props.clock.envelope(["start", "ready"], ["relax", "end"], seconds),
        curvature: props.manner?.curvature ?? 0,
      }),
      contacts: bearing(props, "stroke", "relax"),
      ...(props.weapons === undefined ? {} : { weapons: props.weapons }),
    };
  }

  /**
   * An oscillation: the hand is brought to a pose by `ready`, moves back and
   * forth about it from `strokeStart` to `strokeEnd` and is back at `end` (a
   * wave, a pump, a rub).
   *
   * @param props The phrase, the cycle count and the pose: the target at a swing in [-1, 1] about the pose.
   * @returns The primitive, with a contact window from `strokeStart` to `strokeEnd` when the phrase states a contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the phases with their instants, what the pose's swing means and when it carries a contact window.
   * @evidence contracts/development/implementation.md#principled-implementation A repeated movement about a pose is `AutoMovieMotionClock.wave`, which leaves and rejoins the pose at rest; the pose maps the swing to a target, so the amplitude and its direction are the caller's. In the air the swing is scaled by the manner's extent; on a solid place it is not.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `move` over the whole clock, its weight the envelope to `ready` and from `relax`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: no amplitude or period is stated here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `move`, `wave` and `bearing`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second beyond `move`'s fit.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function oscillate(
    props: IPhrase & {
      cycles: number;
      pose: (
        posture: IHumanPosture,
        seconds: number,
        swing: number,
      ) => AutoMovieMotionHumanArmTarget.ITarget;
    },
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...AutoMovieMotionHumanArmMove.move({
        body: props.body,
        side: props.side,
        from: 0,
        to: props.clock.duration,
        origin: props.origin,
        target: (
          posture: IHumanPosture,
          seconds: number,
        ): AutoMovieMotionHumanArmTarget.ITarget =>
          props.pose(
            posture,
            seconds,
            (props.contact === undefined ? (props.manner?.extent ?? 1) : 1) *
              AutoMovieMotionClock.wave(
                props.clock,
                ["strokeStart", "strokeEnd"],
                props.cycles,
                seconds,
              ),
          ),
        weight: (seconds: number): number =>
          props.clock.envelope(["start", "ready"], ["relax", "end"], seconds),
        curvature: props.manner?.curvature ?? 0,
      }),
      contacts: bearing(props, "strokeStart", "strokeEnd"),
    };
  }

  /**
   * An arm's joint angles in a swing: clinical degrees of the shoulder and the elbow.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its axes and unit.
   * @evidence contracts/development/design.md#principled-representation A pendular arm is described by its joint angles, not by a hand goal: the shoulder's three clinical angles and the elbow's one, in the degrees a posture's joints are written in.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read only by `swing`; the swim law's arm strokes (`sport/swim.ts`) are its consumer so far, and the gaits rebuilt for #3286 are the next.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both members are required; the elbow is one number because a hinge has one angle.
   */
  export interface ISwing {
    /** The upper arm's `[flexion, abduction, twist]`, degrees. */
    upper: readonly [number, number, number];

    /** The elbow's flexion, degrees. */
    elbow: number;
  }

  /**
   * A swing: the arm hangs from the shoulder and swings about it as a
   * pendulum, by joint angles and with no goal for the hand (the arm swing of
   * a walk, a run, a jump). The arm's limb goal is released for the window.
   *
   * @param side The arm.
   * @param from Seconds since the action's start from which the arm is written.
   * @param to Seconds since the action's start until which the arm is written.
   * @param angles The shoulder's and the elbow's angles at a second.
   * @returns The primitive, on the arm's channel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, that the arm's goal is released, and the window's unit.
   * @evidence contracts/development/implementation.md#principled-implementation A swinging arm is driven from the shoulder with no place for the hand, so the two joints are written by angle and the arm's limb goal is removed, which leaves the solver nothing to pull the hand to.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One write: the two joints set and the limb goal deleted. The window is in seconds because a gait's phase, not a named instant, drives the angles.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the angles are the caller's, and the other joints and limbs pass through.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function swing(
    side: HumanHand.Side,
    from: number,
    to: number,
    angles: (posture: IHumanPosture, seconds: number) => ISwing,
  ): IAutoMovieMotionHumanPrimitive {
    const limb: "leftArm" | "rightArm" = `${side}Arm`;
    return {
      channels: [limb],
      from,
      to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const swung: ISwing = angles(posture, seconds);
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        delete limbs[limb];
        return {
          ...posture,
          joints: {
            ...posture.joints,
            [`${side}UpperArm`]: swung.upper,
            [`${side}LowerArm`]: [swung.elbow, 0, 0],
          },
          limbs,
        };
      },
    };
  }
}
