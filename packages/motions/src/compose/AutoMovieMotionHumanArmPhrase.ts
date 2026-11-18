import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmPhrase,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanArmMove } from "./AutoMovieMotionHumanArmMove";
import { AutoMovieMotionHumanArmTarget } from "./AutoMovieMotionHumanArmTarget";

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
   * A target with its point scaled about another point by the phrase's
   * extent; unchanged when the phrase states a contact, since a manner never
   * moves a goal on a solid place.
   */
  const extended = (
    props: Pick<IAutoMovieMotionHumanArmPhrase.IPhrase, "contact" | "manner">,
    about: IAutoMovieVector3,
    target: IAutoMovieMotionHumanArmTarget.ITarget,
  ): IAutoMovieMotionHumanArmTarget.ITarget => {
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
    props: Pick<IAutoMovieMotionHumanArmPhrase.IPhrase, "clock" | "side" | "contact">,
    from: string,
    to: string,
  ): IAutoMovieMotionHumanContactWindow[] {
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates blend/curve/timing to their owners and forwards Move's same-body FK/genuine ROM loan through the actual target invocation; current target data is never cached here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second beyond `move`'s fit.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function visit(
    props: IAutoMovieMotionHumanArmPhrase.IVisitProps,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...AutoMovieMotionHumanArmMove.move({
        body: props.body,
        side: props.side,
        from: 0,
        to: props.clock.duration,
        origin: props.origin,
        target: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          resolution?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[2],
          projection?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[3],
        ): IAutoMovieMotionHumanArmTarget.ITarget =>
          extended(
            props,
            AutoMovieMotionHumanArmTarget.point(posture, props.origin),
            props.target(posture, seconds, resolution, projection),
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
   * @param props The phrase and the path: current target at progress 0 through 1, optionally borrowing same-body FK and genuine ROM metadata as its fourth/fifth arguments only during that invocation.
   * @returns The primitive, with a contact window from `strokeStart` to `relax` when the phrase states a contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States phases, path progress and contact window; both the current-progress and original zero-progress path calls receive the same optional synchronous FK/ROM metadata.
   * @evidence contracts/development/implementation.md#principled-implementation The phases of a gesture (Kendon 1980: preparation, hold, stroke, hold, retraction): the weight rises to the ready pose by `ready` and falls from `relax`, and the path is read at the clock's minimum-jerk progress from `strokeStart` to `strokeEnd`. A path in the air is scaled about its ready point by the manner's extent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `move` over the whole clock; the path decides the shape and this function only the progress it is read at.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the path and the timing are the caller's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Move supplies the current same-body FK/genuine ROM loan to both original path invocations. Their actual posture/seconds/progress remain distinct inputs, and each original path/extent/contact calculation still runs without a sampled target cache.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second beyond `move`'s fit and the caller's path, which is read at both current and zero progress whenever progress is positive, regardless of contact or extent.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function stroke(
    props: IAutoMovieMotionHumanArmPhrase.IStrokeProps,
  ): IAutoMovieMotionHumanPrimitive {
    return strokePrimitive(props, undefined, false);
  }

  /**
   * A native contact stroke whose owner has checked the onset's dependencies.
   * Contact strokes never apply free-space extent. A native path can omit
   * the unused onset target or keep its own onset validation without solving
   * a second elbow. General stroke paths retain both callback observations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the native contact and optional onset-validation boundary.
   * @evidence contracts/development/implementation.md#principled-implementation A bearing target's extent is fixed by the contact, so the onset target cannot change its position.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares the regular stroke primitive with an optional onset validator.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Callers must preserve any original dynamic onset refusal and external callback observation before using this route.
   * @evidence contracts/development/implementation.md#efficient-algorithms Evaluates one complete target per sample plus any required onset validation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The original clock, arm move and bearing window consume the unchanged current target.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the stroke and optional validator for the life of the primitive.
   */
  export function preparedStroke(
    props: IAutoMovieMotionHumanArmPhrase.IStrokeProps & {
      contact: NonNullable<
        IAutoMovieMotionHumanArmPhrase.IStrokeProps["contact"]
      >;
    },
    validateOnset?: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ) => void,
  ): IAutoMovieMotionHumanPrimitive {
    return strokePrimitive(props, validateOnset, true);
  }

  /** Keep one hand transport and clock for both native and general paths. */
  function strokePrimitive(
    props: IAutoMovieMotionHumanArmPhrase.IStrokeProps,
    validateOnset: Parameters<typeof preparedStroke>[1],
    prepared: boolean,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...AutoMovieMotionHumanArmMove.move({
        body: props.body,
        side: props.side,
        from: 0,
        to: props.clock.duration,
        origin: props.origin,
        target: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          resolution?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[2],
          projection?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[3],
        ): IAutoMovieMotionHumanArmTarget.ITarget => {
          const progress: number = props.clock.progress(
            "strokeStart",
            "strokeEnd",
            seconds,
          );
          const at: IAutoMovieMotionHumanArmTarget.ITarget = props.path(
            posture,
            seconds,
            progress,
            resolution,
            projection,
          );
          if (progress <= 0) return at;
          if (prepared) {
            validateOnset?.(posture, seconds);
            return at;
          }
          return extended(
            props,
            props.path(posture, seconds, 0, resolution, projection).point,
            at,
          );
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Move's optional same-body FK/genuine ROM metadata reaches the actual chamber and target callbacks. through/bearing retain timing/contact ownership and no callback answer is memoized.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second beyond `move`'s fit.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function strike(
    props: IAutoMovieMotionHumanArmPhrase.IStrikeProps,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...AutoMovieMotionHumanArmMove.move({
        body: props.body,
        side: props.side,
        from: 0,
        to: props.clock.duration,
        origin: props.origin,
        target: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          resolution?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[2],
          projection?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[3],
        ): IAutoMovieMotionHumanArmTarget.ITarget => {
          const chamber: IAutoMovieMotionHumanArmTarget.ITarget = props.chamber(
            posture,
            seconds,
            resolution,
            projection,
          );
          const p: number = AutoMovieMotionClock.through(
            props.clock,
            ["strokeStart", "stroke", "strokeEnd"],
            seconds,
          );
          if (p <= 0) return chamber;
          const target: IAutoMovieMotionHumanArmTarget.ITarget = extended(
            props,
            chamber.point,
            props.target(posture, seconds, resolution, projection),
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
    props: IAutoMovieMotionHumanArmPhrase.IOscillateProps,
      ): IAutoMovieMotionHumanPrimitive {
    return {
      ...AutoMovieMotionHumanArmMove.move({
        body: props.body,
        side: props.side,
        from: 0,
        to: props.clock.duration,
        origin: props.origin,
        target: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanArmTarget.ITarget =>
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
    side: AutoMovieHumanSide,
    from: number,
    to: number,
    angles: (posture: IAutoMovieMotionHumanPosture, seconds: number) => IAutoMovieMotionHumanArmPhrase.ISwing,
  ): IAutoMovieMotionHumanPrimitive {
    const limb: "leftArm" | "rightArm" = `${side}Arm`;
    return {
      channels: [limb],
      from,
      to,
      write: (posture: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanPosture => {
        const swung: IAutoMovieMotionHumanArmPhrase.ISwing = angles(posture, seconds);
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
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
