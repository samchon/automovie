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
 * The arm's phrases on a clock's standard instants: a visit, a stroke, a strike
 * and an oscillation of the hand, the contact window a phrase bears, and the
 * swing of an arm that hangs.
 *
 * The members are `AutoMovieMotionHumanArm`'s, which names them.
 */
export namespace AutoMovieMotionHumanArmPhrase {
  /**
   * A target with its point scaled about another point by the phrase's extent;
   * unchanged when the phrase states a contact, since a manner never moves a
   * goal on a solid place.
   */
  const extended = (
    props: Pick<IAutoMovieMotionHumanArmPhrase.IPhrase, ExtendedProps>,
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
   */
  export function bearing(
    props: Pick<IAutoMovieMotionHumanArmPhrase.IPhrase, BearingProps>,
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
   * A visit: the hand goes to a place, stays on it and comes back (a touch, an
   * offered hand, a hand laid on a table, a mimed grasp). It travels from
   * `start` to `stroke`, stays until `relax` and is back at `end`.
   *
   * @param props The phrase and the place's target.
   * @returns The primitive, with a contact window from `stroke` to `relax` when
   *   the phrase states a contact.
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
          evaluation?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[4],
        ): IAutoMovieMotionHumanArmTarget.ITarget =>
          extended(
            props,
            AutoMovieMotionHumanArmTarget.point(posture, props.origin),
            props.target(posture, seconds, resolution, projection, evaluation),
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
   * @param props The phrase and the path: current target at progress 0 through
   *   1, optionally borrowing same-body FK and genuine ROM metadata as its
   *   fourth/fifth arguments only during that invocation.
   * @returns The primitive, with a contact window from `strokeStart` to `relax`
   *   when the phrase states a contact.
   */
  export function stroke(
    props: IAutoMovieMotionHumanArmPhrase.IStrokeProps,
  ): IAutoMovieMotionHumanPrimitive {
    return strokePrimitive(props, undefined, false);
  }

  /**
   * A native contact stroke whose owner has checked the onset's dependencies.
   * Contact strokes never apply free-space extent. A native path can omit the
   * unused onset target or keep its own onset validation without solving a
   * second elbow. General stroke paths retain both callback observations.
   */
  export function preparedStroke(
    props: IAutoMovieMotionHumanArmPhrase.IStrokeProps & IPreparedStrokeProps,
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
    const target = (
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
    };
    const move: IAutoMovieMotionHumanPrimitive =
      AutoMovieMotionHumanArmMove.move(
        {
          body: props.body,
          side: props.side,
          from: 0,
          to: props.clock.duration,
          origin: props.origin,
          target,
          weight: (seconds: number): number =>
            props.clock.envelope(["start", "ready"], ["relax", "end"], seconds),
          curvature: props.manner?.curvature ?? 0,
        },
      );
    return {
      ...move,
      contacts: bearing(props, "strokeStart", "relax"),
    };
  }

  /**
   * A strike: the hand is drawn to a chamber by `ready`, extends from
   * `strokeStart` and passes its target at `stroke` at speed. With a follow
   * phase it travels on past the target and slows to rest at `strokeEnd` (a
   * punch in the air); with none it is arrested at the target (a fist met by a
   * body). It stays until `relax` and is back at `end`.
   *
   * @param props The phrase, the chamber, the target and the weapons the strike
   *   carries.
   * @returns The primitive, with a contact window from `stroke` to `relax` when
   *   the phrase states a contact.
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
          evaluation?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[4],
        ): IAutoMovieMotionHumanArmTarget.ITarget => {
          const chamber: IAutoMovieMotionHumanArmTarget.ITarget = props.chamber(
            posture,
            seconds,
            resolution,
            projection,
            evaluation,
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
            props.target(posture, seconds, resolution, projection, evaluation),
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
   * @param props The phrase, the cycle count and the pose: the target at a
   *   swing in [-1, 1] about the pose.
   * @returns The primitive, with a contact window from `strokeStart` to
   *   `strokeEnd` when the phrase states a contact.
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
   * A swing: the arm hangs from the shoulder and swings about it as a pendulum,
   * by joint angles and with no goal for the hand (the arm swing of a walk, a
   * run, a jump). The arm's limb goal is released for the window.
   *
   * @param side The arm.
   * @param from Seconds since the action's start from which the arm is written.
   * @param to Seconds since the action's start until which the arm is written.
   * @param angles The shoulder's and the elbow's angles at a second.
   * @returns The primitive, on the arm's channel.
   */
  export function swing(
    side: AutoMovieHumanSide,
    from: number,
    to: number,
    angles: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ) => IAutoMovieMotionHumanArmPhrase.ISwing,
  ): IAutoMovieMotionHumanPrimitive {
    const limb: SwingLimb = `${side}Arm`;
    return {
      channels: [limb],
      from,
      to,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const swung: IAutoMovieMotionHumanArmPhrase.ISwing = angles(
          posture,
          seconds,
        );
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
        };
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

/** The alternatives of `SwingLimb`'s site. */
type SwingLimb = "leftArm" | "rightArm";

/** The record of `IPreparedStrokeProps`'s site. */
type IPreparedStrokeProps = {
  contact: NonNullable<IAutoMovieMotionHumanArmPhrase.IStrokeProps["contact"]>;
};

/** The alternatives of `BearingProps`'s site. */
type BearingProps = "clock" | "side" | "contact";

/** The alternatives of `ExtendedProps`'s site. */
type ExtendedProps = "contact" | "manner";
