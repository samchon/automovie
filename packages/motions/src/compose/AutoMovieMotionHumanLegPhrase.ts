import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanLeg } from "./AutoMovieMotionHumanLeg";
import type { AutoMovieMotionManner } from "./AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Leg phrases: one foot leaving and rejoining its stance on one clock, a
 * lift, a tap, a swing and a pivot, each built on the leg's own movement
 * (`AutoMovieMotionHumanLeg.place`) and its swing path
 * (`AutoMovieMotionHumanLeg.arc`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a phrase is and what it is built on.
 * @evidence contracts/development/design.md#principled-representation A phrase is one foot's stance, its clock with the standard instants and an optional contact, the arm's phrase mirrored.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The phrase record, the contact window, the blend of two placements and the four phrases; split from `AutoMovieMotionHumanLeg` so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `HumanFoot.IPlacement`, the clock and the leg's movement; no action name appears.
 */
export namespace AutoMovieMotionHumanLegPhrase {
  /**
   * What every leg phrase takes: the leg, the clock whose standard instants
   * (`AutoMovieMotionClock.PHRASE`) it moves on, and where the foot stands
   * before and after.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its meaning, and the optional two what their absence means.
   * @evidence contracts/development/design.md#principled-representation A leg phrase is one foot leaving and rejoining one stance on one clock; the contact states that the place is solid by naming what the foot bears on, so a place in the air cannot carry a contact window.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members shared by `lift`, `tap`, `swing` and `pivot`, mirroring the arm's phrase; the placement, the clock, the contact window and the modifiers are their owners' types. No law reads the leg phrases yet; the kicks, the gaits and the everyday laws rebuilt for #3286 are the consumers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact is one optional record instead of a solid flag beside optional contact fields; `pivot` omits it because its contact is always the ground.
   */
  export interface IPhrase {
    /** The body. */
    body: IHumanBody;

    /** A clock with the standard instants of a phrase. */
    clock: AutoMovieMotionClock.IClock;

    /** The leg. */
    side: AutoMovieMotionHumanLeg.Side;

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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two instants and when no window is returned.
   * @evidence contracts/development/implementation.md#principled-implementation A plan's contact window is a share of its duration, so each instant's seconds are divided by the clock's duration; a place in the air bears nothing and gets no window.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional and one record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the kind and the support are the phrase's own, and an unknown instant throws through the clock.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `tap`, `swing` and `pivot` build their windows here. The arm's `bearing` is the same four lines with the hand as the part; the two are kept beside their phrases rather than joined behind a part parameter.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both interpolations and where the share is clamped.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid placement is a point and a rotation: the point is interpolated on the line and the rotation by spherical interpolation, the constant-speed path between two rotations.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record of two interpolations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ankle is not clamped, so a share past 1 carries a swing past its target and an extent above 1 enlarges a place in the air; the rotation is clamped because a turn past the target's has no meaning the callers ask for.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every leg phrase and the extent's scaling blend placements here, on `Vector3` and `Quaternion.slerp`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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

  /**
   * A placement raised until no point of its sole lies under the floor its
   * stance stands on: a foot that pitches while it is still low would
   * otherwise carry its toes or its heel through the floor on the way to and
   * from a chamber.
   */
  const cleared = (
    props: Pick<IPhrase, "body" | "side" | "stance">,
    placement: HumanFoot.IPlacement,
  ): HumanFoot.IPlacement => {
    const lowest = (foot: HumanFoot.IPlacement): number =>
      Math.min(
        ...(["heel", "ball", "toe"] as const).map(
          (point): number =>
            HumanFoot.point(props.body, props.side, point, foot).y,
        ),
      );
    const under: number = lowest(props.stance) - lowest(placement);
    return under <= 0
      ? placement
      : {
          ankle: { ...placement.ankle, y: placement.ankle.y + under },
          rotation: placement.rotation,
        };
  };

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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, its instants and when the foot is planted.
   * @evidence contracts/development/implementation.md#principled-implementation A foot raised and set back is the stance blended toward the raised placement by the clock's minimum-jerk envelope, at rest at both ends and while held. A raised placement in the air is scaled about the stance by the manner's extent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `place` over the whole clock.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the raised placement is the caller's. The phrase adds no contact window even when a contact is stated, since a raised foot bears on nothing.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the solve to `place`, the blend to `between` and the timing to the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second beyond `place`'s solve.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function lift(
    props: IPhrase & { raised: AutoMovieMotionHumanLeg.Frame },
  ): IAutoMovieMotionHumanPrimitive {
    return AutoMovieMotionHumanLeg.place({
      body: props.body,
      side: props.side,
      from: 0,
      to: props.clock.duration,
      placement: (posture: IHumanPosture, seconds: number) =>
        cleared(
          props,
          between(
            props.stance,
            extended(props, props.stance, props.raised(posture, seconds)),
            props.clock.envelope(
              ["start", "stroke"],
              ["relax", "end"],
              seconds,
            ),
          ),
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, its instants, the clearance's unit and when the foot is planted.
   * @evidence contracts/development/implementation.md#principled-implementation A foot carried to a place clears the floor on the way, so both trips are the leg's arc with the stated clearance on the clock's minimum-jerk progress. A place in the air is scaled about the stance by the manner's extent, and the foot is planted on the place only when it is solid.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `place` whose placement is the outward arc until `relax` and the return arc after it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the place and the clearance are the caller's, and a place in the air is neither planted nor given a window.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `place`, the arc that `step` uses, and `bearing`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second beyond `place`'s solve.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function tap(
    props: IPhrase & {
      target: AutoMovieMotionHumanLeg.Frame;
      clearance: number;
    },
  ): IAutoMovieMotionHumanPrimitive {
    const { clock } = props;
    return {
      ...AutoMovieMotionHumanLeg.place({
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
            ? AutoMovieMotionHumanLeg.arc(
                props.stance,
                target,
                props.clearance,
                clock.progress("start", "stroke", seconds),
              )
            : AutoMovieMotionHumanLeg.arc(
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the phases with their instants, the free and the arrested ending, the contact window and when the foot is planted.
   * @evidence contracts/development/implementation.md#principled-implementation The foot runs from the chamber along the line to the target by `AutoMovieMotionClock.through`, which is 1 at `stroke` with speed, so a free swing travels past the target and an arrested one stops on it; the envelope carries the foot from and back to its stance. A target in the air is scaled about the chamber by the manner's extent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `place` over the whole clock: the chamber before `strokeStart`, the line after it, blended with the stance by the envelope. The arm's `strike` has the same shape.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the overshoot follows from the follow phase's length, not from a stated distance. Stopping on the first surface met is the performance's arrest, not decided here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `place`, `between`, `through` and `bearing`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second beyond `place`'s solve.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function swing(
    props: IPhrase & {
      chamber: AutoMovieMotionHumanLeg.Frame;
      target: AutoMovieMotionHumanLeg.Frame;
      weapons?: readonly IHumanActionPlan.IWeapon[];
    },
  ): IAutoMovieMotionHumanPrimitive {
    const { clock } = props;
    return {
      ...AutoMovieMotionHumanLeg.place({
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
          return cleared(
            props,
            between(
              props.stance,
              p <= 0
                ? chamber
                : between(
                    chamber,
                    extended(props, chamber, props.target(posture, seconds)),
                    p,
                  ),
              clock.envelope(["start", "ready"], ["relax", "end"], seconds),
            ),
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, its instants, the units and signs of the two angles and the contact window.
   * @evidence contracts/development/implementation.md#principled-implementation A foot that turns on the floor rotates about the sole point that stays, so the point is read once from the stance and the ankle is placed by the rigid relation `HumanFoot.pivot` owns as the heading and the pitch grow by the clock's envelope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The stance's point, heading and pitch are read once; the placement adds the enveloped turn and pitch to them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the foot stays planted and its window is a pivot on the ground, so the sole point is held and the rest of the sole is free to turn.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `place`, `HumanFoot.point`, `HumanFoot.pivot` and `bearing`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second beyond `place`'s solve.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive keeps its arguments, one point and two angles.
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
      ...AutoMovieMotionHumanLeg.place({
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
