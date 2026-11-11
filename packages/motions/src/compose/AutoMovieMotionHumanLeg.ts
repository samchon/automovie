import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import type { AutoMovieMotionManner } from "./AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Leg primitives: a foot kept on the floor, and a foot lifted and set down
 * somewhere else.
 *
 * A foot is a placement of its ankle and its rotation ({@link HumanFoot}),
 * and the leg is an effector goal solved by inverse kinematics. A planted
 * foot declares its toes' joint as the goal's contact, so where the ankle
 * cannot hold the foot flat the heel rises about the ball and the foot does
 * not slide (`HumanFoot.heelOff`). The knee bends over the foot: its hint is
 * ahead of the knee's rest place along the foot's own heading (Perry and
 * Burnfield, Gait Analysis, 2nd ed.).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a foot's placement is, how the leg is solved, what a planted foot declares and where the knee bends.
 * @evidence contracts/development/design.md#principled-representation A leg movement is an ankle placement over time with a flag for bearing on the floor, the two facts a stance and a swing differ by.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One movement (`place`) with two named forms over it (`plant`, `step`), the swing path and the goal builder; the only owner of leg goals built from a foot placement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `HumanFoot.IPlacement` and the posture's goal type; no action name and no fixed body size appears.
 */
export namespace AutoMovieMotionHumanLeg {
  /**
   * A leg side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two sides a leg is on.
   * @evidence contracts/development/design.md#principled-representation The body's bilateral symmetry as a closed union, the form the rig's bone names take.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, used by every function here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A literal union, not a string.
   */
  export type Side = "left" | "right";

  /**
   * A foot's placement as a frame of the action.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @returns The placement, world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each argument is, when the function is called and the result's frame.
   * @evidence contracts/development/design.md#principled-representation A foot that follows something (a swing path, a pivot about its ball) is a function of the posture so far and the time, evaluated when the row is written.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One function type, taken by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A fixed placement is the constant function, so there is no second form for it.
   */
  export type Frame = (
    posture: IHumanPosture,
    seconds: number,
  ) => HumanFoot.IPlacement;

  /**
   * One leg's movement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and its unit.
   * @evidence contracts/development/design.md#principled-representation The span the leg is written over, where the foot is at each second and whether it bears then.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `place`; `plant` and `step` fill them from a clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Bearing is a function of seconds, so a foot that lands inside the span needs no second primitive.
   */
  export interface IPlace {
    /** The body. */
    body: IHumanBody;

    /** The leg. */
    side: Side;

    /** Seconds since the action's start from which the leg is written. */
    from: number;

    /** Seconds since the action's start until which the leg is written. */
    to: number;

    /** Where the foot is. */
    placement: Frame;

    /**
     * Whether the foot bears on the floor.
     *
     * @param seconds Seconds since the action's start.
     * @returns `true` while it is planted.
     */
    planted(seconds: number): boolean;
  }

  /**
   * A foot on its way from one placement to another: the ankle on the
   * straight line between them raised by `4 c s (1 - s)`, a parabola that
   * leaves and lands at the floor and peaks at the clearance `c` half way,
   * and the rotation turned by spherical interpolation.
   *
   * @param from The placement at progress 0.
   * @param to The placement at progress 1.
   * @param clearance The ankle's greatest rise, metres.
   * @param progress How far along, in [0, 1].
   * @returns The placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the path's formula, where it peaks and each input's unit.
   * @evidence contracts/development/implementation.md#principled-implementation The lowest-order curve that leaves and lands at the floor with one peak: a parabola over the straight line, with the foot's turn interpolated on the sphere.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interpolation, one added height and one turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Progress is clamped to [0, 1], so the foot never goes under the floor past either end.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse beyond the engine's vector and quaternion interpolation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function arc(
    from: HumanFoot.IPlacement,
    to: HumanFoot.IPlacement,
    clearance: number,
    progress: number,
  ): HumanFoot.IPlacement {
    const s: number = Math.min(1, Math.max(0, progress));
    const ankle: IAutoMovieVector3 = Vector3.lerp(from.ankle, to.ankle, s);
    return {
      ankle: { ...ankle, y: ankle.y + 4 * clearance * s * (1 - s) },
      rotation: Quaternion.slerp(from.rotation, to.rotation, s),
    };
  }

  /**
   * The limb goal that puts a foot on a placement.
   *
   * @param body The body.
   * @param posture The posture whose root carries the knee's rest place.
   * @param side The leg.
   * @param placement The foot's placement.
   * @param planted Whether the foot bears on the floor.
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and what of the posture is read.
   * @evidence contracts/development/implementation.md#principled-implementation The ankle and the foot's rotation are the goal; the knee's hint follows the foot's heading; a bearing foot declares the toes' joint as its contact so the heel rises about the ball instead of the foot sliding.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record with one conditional pair of members.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A free foot declares neither a plant nor a contact, so the resolver does not pin a foot in the air.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanBend.knee`, `HumanFoot.heading` and `HumanFoot.offset`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function goal(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: Side,
    placement: HumanFoot.IPlacement,
    planted: boolean,
  ): IHumanPosture.IGoal {
    return {
      point: placement.ankle,
      rotation: placement.rotation,
      bend: AutoMovieMotionHumanBend.knee(
        body,
        posture,
        side,
        HumanFoot.heading(placement.rotation),
      ),
      ...(planted
        ? { planted: true, contact: HumanFoot.offset(body, side, "mtp") }
        : {}),
    };
  }

  /**
   * A leg whose foot follows a placement.
   *
   * @param props The movement.
   * @returns The primitive, on the leg's channel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the leg follows and the channel claimed.
   * @evidence contracts/development/implementation.md#principled-implementation Each second the placement and the bearing are evaluated and turned into the leg's goal on the posture so far, so the knee's hint follows the root the earlier rows moved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal written into one limb.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Writes its own limb only and leaves every other member of the posture as it is.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per written second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `goal`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props only and holds no per-second state.
   */
  export function place(props: IPlace): IAutoMovieMotionHumanPrimitive {
    const limb: "leftLeg" | "rightLeg" = `${props.side}Leg`;
    return {
      channels: [limb],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => ({
        ...posture,
        limbs: {
          ...posture.limbs,
          [limb]: goal(
            props.body,
            posture,
            props.side,
            props.placement(posture, seconds),
            props.planted(seconds),
          ),
        },
      }),
    };
  }

  /**
   * A foot kept planted on one placement between two instants.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The leg.
   * @param window The instants the plant starts and ends at.
   * @param at Where the foot stands.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the window and what the foot does in it.
   * @evidence contracts/development/implementation.md#principled-implementation A stance foot is one placement that bears throughout.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `place` with two constant functions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The window is two named instants of the clock, so no time is written twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `place` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function plant(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    side: Side,
    window: readonly [string, string],
    at: HumanFoot.IPlacement,
  ): IAutoMovieMotionHumanPrimitive {
    return place({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      placement: (): HumanFoot.IPlacement => at,
      planted: (): boolean => true,
    });
  }

  /**
   * A foot lifted from one placement and set down on another between two
   * instants, on the clock's minimum-jerk progress along {@link arc}. The
   * foot is free inside the window and planted at its last instant.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The leg.
   * @param window The instants the foot leaves and lands at.
   * @param from Where the foot leaves.
   * @param to Where the foot lands.
   * @param clearance The ankle's greatest rise, metres.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two ends, the window, the time course and when the foot bears.
   * @evidence contracts/development/implementation.md#principled-implementation A swing foot travels its arc on the minimum-jerk profile and bears only once it has arrived, so it lands without sliding.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `place` with the arc and the landing test.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Bearing is read from the clock's linear share reaching 1 and not from the eased progress, which approaches 1 before the instant.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `place`, `arc` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function step(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    side: Side,
    window: readonly [string, string],
    from: HumanFoot.IPlacement,
    to: HumanFoot.IPlacement,
    clearance: number,
  ): IAutoMovieMotionHumanPrimitive {
    return place({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      placement: (_: IHumanPosture, seconds: number): HumanFoot.IPlacement =>
        arc(from, to, clearance, clock.progress(window[0], window[1], seconds)),
      planted: (seconds: number): boolean =>
        clock.linear(window[0], window[1], seconds) >= 1,
    });
  }

  /**
   * What every leg phrase takes: the leg, the clock whose standard instants
   * (`AutoMovieMotionClock.PHRASE`) it moves on, and where the foot stands
   * before and after.
   */
  export interface IPhrase {
    /** The body. */
    body: IHumanBody;

    /** A clock with the standard instants of a phrase. */
    clock: AutoMovieMotionClock.IClock;

    /** The leg. */
    side: Side;

    /** Where the foot stands before and after the phrase. */
    stance: HumanFoot.IPlacement;

    /**
     * What the foot bears on while it is on its place, when the place is
     * solid; absent for a place in the air, which gives no contact window.
     */
    contact?: Pick<IHumanContactWindow, "kind" | "support">;

    /**
     * The manner's size: the extent scales a place in the air about where
     * the foot leaves from. A phrase that states a contact keeps its place
     * whatever the extent. Neutral when absent.
     */
    manner?: Pick<AutoMovieMotionManner.IModifiers, "extent">;
  }

  /**
   * A placement scaled about another by the phrase's extent; unchanged when
   * the phrase states a contact, since a manner never moves a goal on a solid
   * place.
   */
  const extended = (
    props: Pick<IPhrase, "contact" | "manner">,
    about: HumanFoot.IPlacement,
    target: HumanFoot.IPlacement,
  ): HumanFoot.IPlacement => {
    const extent: number = props.manner?.extent ?? 1;
    return props.contact !== undefined || extent === 1
      ? target
      : between(about, target, extent);
  };

  /**
   * The contact window of a foot between two instants.
   *
   * @param props The phrase.
   * @param from The instant the foot comes to bear.
   * @param to The instant it leaves.
   * @returns One window when the phrase states a contact, none otherwise.
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
            part: `${props.side}Foot`,
            kind: props.contact.kind,
            from: props.clock.at(from) / props.clock.duration,
            to: props.clock.at(to) / props.clock.duration,
            support: props.contact.support,
          },
        ];
  }

  /**
   * A placement between two others: the ankle on the straight line and the
   * rotation turned by spherical interpolation.
   *
   * @param from The placement at share 0.
   * @param to The placement at share 1.
   * @param share How far along; not clamped for the ankle, clamped to [0, 1] for the rotation.
   * @returns The placement.
   */
  export function between(
    from: HumanFoot.IPlacement,
    to: HumanFoot.IPlacement,
    share: number,
  ): HumanFoot.IPlacement {
    return {
      ankle: Vector3.add(
        from.ankle,
        Vector3.scale(Vector3.subtract(to.ankle, from.ankle), share),
      ),
      rotation: Quaternion.slerp(
        from.rotation,
        to.rotation,
        Math.min(1, Math.max(0, share)),
      ),
    };
  }

  /** Whether a phrase's foot stands on its stance: only at the clock's two ends. */
  const grounded =
    (clock: AutoMovieMotionClock.IClock) =>
    (seconds: number): boolean =>
      seconds <= 0 || seconds >= clock.duration;

  /**
   * A lift: the foot leaves its stance, is held raised and is set back (a
   * knee raised, a foot drawn up, a leg crossed). It travels from `start` to
   * `stroke`, stays until `relax` and stands again at `end`.
   *
   * @param props The phrase and the raised placement.
   * @returns The primitive; the foot is planted only at the two ends.
   */
  export function lift(
    props: IPhrase & { raised: Frame },
  ): IAutoMovieMotionHumanPrimitive {
    return place({
      body: props.body,
      side: props.side,
      from: 0,
      to: props.clock.duration,
      placement: (posture: IHumanPosture, seconds: number) =>
        between(
          props.stance,
          extended(props, props.stance, props.raised(posture, seconds)),
          props.clock.envelope(["start", "stroke"], ["relax", "end"], seconds),
        ),
      planted: grounded(props.clock),
    });
  }

  /**
   * A tap: the foot swings to a place on an arc, rests on it and swings back
   * (a toe tapped ahead, a foot set on a step and taken off). It lands at
   * `stroke`, stays until `relax` and stands on its stance again at `end`.
   *
   * @param props The phrase, the place and the ankle's greatest rise on the way, metres.
   * @returns The primitive, with a contact window from `stroke` to `relax` when the phrase states a contact; the foot is planted on the place only then.
   */
  export function tap(
    props: IPhrase & { target: Frame; clearance: number },
  ): IAutoMovieMotionHumanPrimitive {
    const { clock } = props;
    return {
      ...place({
        body: props.body,
        side: props.side,
        from: 0,
        to: clock.duration,
        placement: (posture: IHumanPosture, seconds: number) => {
          const target: HumanFoot.IPlacement = extended(
            props,
            props.stance,
            props.target(posture, seconds),
          );
          return seconds <= clock.at("relax")
            ? arc(
                props.stance,
                target,
                props.clearance,
                clock.progress("start", "stroke", seconds),
              )
            : arc(
                target,
                props.stance,
                props.clearance,
                clock.progress("relax", "end", seconds),
              );
        },
        planted: (seconds: number): boolean =>
          grounded(clock)(seconds) ||
          (props.contact !== undefined &&
            seconds >= clock.at("stroke") &&
            seconds <= clock.at("relax")),
      }),
      contacts: bearing(props, "stroke", "relax"),
    };
  }

  /**
   * A swing: the foot is drawn to a chamber by `ready`, extends from
   * `strokeStart` and passes its target at `stroke` at speed. With a follow
   * phase it travels on past the target and slows to rest at `strokeEnd` (a
   * kick in the air); with none it is arrested at the target (a kick met by
   * a body). It stays until `relax` and stands on its stance again at `end`.
   *
   * @param props The phrase, the chamber, the target and the weapons the swing carries.
   * @returns The primitive, with a contact window from `stroke` to `relax` when the phrase states a contact; the foot is planted only at the two ends.
   */
  export function swing(
    props: IPhrase & {
      chamber: Frame;
      target: Frame;
      weapons?: readonly IHumanActionPlan.IWeapon[];
    },
  ): IAutoMovieMotionHumanPrimitive {
    const { clock } = props;
    return {
      ...place({
        body: props.body,
        side: props.side,
        from: 0,
        to: clock.duration,
        placement: (posture: IHumanPosture, seconds: number) => {
          const chamber: HumanFoot.IPlacement = props.chamber(posture, seconds);
          const p: number = AutoMovieMotionClock.through(
            clock,
            ["strokeStart", "stroke", "strokeEnd"],
            seconds,
          );
          return between(
            props.stance,
            p <= 0
              ? chamber
              : between(
                  chamber,
                  extended(props, chamber, props.target(posture, seconds)),
                  p,
                ),
            clock.envelope(["start", "ready"], ["relax", "end"], seconds),
          );
        },
        planted: grounded(clock),
      }),
      contacts: bearing(props, "stroke", "relax"),
      ...(props.weapons === undefined ? {} : { weapons: props.weapons }),
    };
  }

  /**
   * A pivot: the foot turns about a sole point that stays on the floor and
   * turns back (the rear foot of a punch on its ball, the support foot of a
   * round kick, a heel turned out). The turn and the pitch grow from `start`
   * to `stroke`, stay until `relax` and are gone at `end`.
   *
   * @param props The phrase, the sole point that stays, the heading's turn at its fullest in degrees about +Y and the pitch at its fullest in degrees, positive toes up.
   * @returns The primitive, planted throughout, with a pivot window on the ground over the whole clock.
   */
  export function pivot(
    props: Omit<IPhrase, "contact"> & {
      about: "heel" | "ball";
      turn: number;
      pitch: number;
    },
  ): IAutoMovieMotionHumanPrimitive {
    const { clock } = props;
    const at: IAutoMovieVector3 = HumanFoot.point(
      props.body,
      props.side,
      props.about,
      props.stance,
    );
    const heading: number = HumanFoot.heading(props.stance.rotation);
    const pitch: number = HumanFoot.pitch(props.stance.rotation);
    return {
      ...place({
        body: props.body,
        side: props.side,
        from: 0,
        to: clock.duration,
        placement: (_: IHumanPosture, seconds: number) => {
          const w: number = clock.envelope(
            ["start", "stroke"],
            ["relax", "end"],
            seconds,
          );
          return HumanFoot.pivot(
            props.body,
            props.side,
            props.about,
            at,
            heading + props.turn * w,
            pitch + props.pitch * w,
          );
        },
        planted: (): boolean => true,
      }),
      contacts: bearing(
        {
          clock,
          side: props.side,
          contact: { kind: "pivot", support: { kind: "ground" } },
        },
        "start",
        "end",
      ),
    };
  }
}
