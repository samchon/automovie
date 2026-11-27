import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanLegPhrase,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanLeg } from "./AutoMovieMotionHumanLeg";

/*
 * Leg phrases: one foot leaving and rejoining its stance on one clock, a lift,
 * a tap, a swing and a pivot, each built on the leg's own movement
 * (`AutoMovieMotionHumanLeg.place`) and its swing path
 * (`AutoMovieMotionHumanLeg.arc`).
 */
export namespace AutoMovieMotionHumanLegPhrase {
  /*
   * The contact window of a foot between two instants.
   * Parameter props: The phrase.
   * Parameter from: The instant the foot comes to bear.
   * Parameter to: The instant it leaves.
   * Returns: One window when the phrase states a contact, none otherwise.
   */
  export function bearing(
    props: Pick<IAutoMovieMotionHumanLegPhrase.IPhrase, BearingProps>,
    from: string,
    to: string,
  ): IAutoMovieMotionHumanContactWindow[] {
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

  /*
   * A placement between two others: the ankle on the straight line and the
   * rotation turned by spherical interpolation.
   * Parameter from: The placement at share 0.
   * Parameter to: The placement at share 1.
   * Parameter share: How far along; not clamped for the ankle, clamped to [0, 1]
   * for the rotation.
   * Returns: The placement.
   */
  export function between(
    from: IAutoMovieMotionHumanFoot.IPlacement,
    to: IAutoMovieMotionHumanFoot.IPlacement,
    share: number,
  ): IAutoMovieMotionHumanFoot.IPlacement {
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

  /*
   * Prepare repeated interpolation of one unchanged pair of placements. The
   * ankle still extrapolates outside the unit interval, while the quaternion
   * receives the original explicit [0, 1] clamp.
   * Parameter from: The unchanged departure placement, borrowed for this reader.
   * Parameter to: The unchanged arrival placement, borrowed for this reader.
   * Returns: A reader producing a fresh ankle, rotation and placement at every
   * actual share.
   */
  export function prepareBetween(
    from: IAutoMovieMotionHumanFoot.IPlacement,
    to: IAutoMovieMotionHumanFoot.IPlacement,
  ): (share: number) => IAutoMovieMotionHumanFoot.IPlacement {
    const rotation: ReturnType<typeof Quaternion.prepareSlerp> =
      Quaternion.prepareSlerp(from.rotation, to.rotation);
    const ankle: ReturnType<typeof Vector3.prepareLerp> = Vector3.prepareLerp(
      from.ankle,
      to.ankle,
    );
    return (share: number): IAutoMovieMotionHumanFoot.IPlacement => {
      return {
        ankle: ankle(share),
        rotation: rotation(Math.min(1, Math.max(0, share))),
      };
    };
  }

  /*
   * A lift: the foot leaves its stance, is held raised and is set back (a knee
   * raised, a foot drawn up, a leg crossed). It travels from `start` to
   * `stroke`, stays until `relax` and stands again at `end`.
   * Parameter props: The phrase and the raised placement.
   * Returns: The primitive; the foot is planted only at the two ends.
   */
  export function lift(
    props: IAutoMovieMotionHumanLegPhrase.ILiftProps,
  ): IAutoMovieMotionHumanPrimitive {
    return AutoMovieMotionHumanLeg.place({
      body: props.body,
      side: props.side,
      from: 0,
      to: props.clock.duration,
      placement: (posture: IAutoMovieMotionHumanPosture, seconds: number) => {
        const weight: number = props.clock.envelope(
          ["start", "stroke"],
          ["relax", "end"],
          seconds,
        );
        return cleared(
          props,
          extended(props, props.stance, props.raised(posture, seconds)),
          weight,
        );
      },
      planted: grounded(props.clock),
    });
  }

  /*
   * A tap: the foot swings to a place on an arc, rests on it and swings back (a
   * toe tapped ahead, a foot set on a step and taken off). It lands at
   * `stroke`, stays until `relax` and stands on its stance again at `end`.
   * Parameter props: The phrase, the place and the ankle's greatest rise on the
   * way, metres.
   * Returns: The primitive, with a contact window from `stroke` to `relax` when
   * the phrase states a contact; the foot is planted on the place only then.
   */
  export function tap(
    props: IAutoMovieMotionHumanLegPhrase.ITapProps,
  ): IAutoMovieMotionHumanPrimitive {
    const { clock } = props;
    return {
      ...AutoMovieMotionHumanLeg.place({
        body: props.body,
        side: props.side,
        from: 0,
        to: clock.duration,
        placement: (posture: IAutoMovieMotionHumanPosture, seconds: number) => {
          const target: IAutoMovieMotionHumanFoot.IPlacement = extended(
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

  /*
   * A swing: the foot is drawn to a chamber by `ready`, extends from
   * `strokeStart` and passes its target at `stroke` at speed. With a follow
   * phase it travels on past the target and slows to rest at `strokeEnd` (a
   * kick in the air); with none it is arrested at the target (a kick met by a
   * body). It stays until `relax` and stands on its stance again at `end`.
   * Parameter props: The phrase, the chamber, the target and the weapons the swing
   * carries.
   * Returns: The primitive, with a contact window from `stroke` to `relax` when
   * the phrase states a contact; the foot is planted only at the two ends.
   */
  export function swing(
    props: IAutoMovieMotionHumanLegPhrase.ISwingProps,
  ): IAutoMovieMotionHumanPrimitive {
    const { clock } = props;
    return {
      ...AutoMovieMotionHumanLeg.place({
        body: props.body,
        side: props.side,
        from: 0,
        to: clock.duration,
        placement: (posture: IAutoMovieMotionHumanPosture, seconds: number) => {
          const chamber: IAutoMovieMotionHumanFoot.IPlacement = props.chamber(
            posture,
            seconds,
          );
          const p: number = AutoMovieMotionClock.through(
            clock,
            ["strokeStart", "stroke", "strokeEnd"],
            seconds,
          );
          const weight: number = clock.envelope(
            ["start", "ready"],
            ["relax", "end"],
            seconds,
          );
          return cleared(
            props,
            p <= 0
              ? chamber
              : between(
                  chamber,
                  extended(props, chamber, props.target(posture, seconds)),
                  p,
                ),
            weight,
          );
        },
        planted: grounded(clock),
      }),
      contacts: bearing(props, "stroke", "relax"),
      ...(props.weapons === undefined ? {} : { weapons: props.weapons }),
    };
  }

  /*
   * A pivot: the foot turns about a sole point that stays on the floor and
   * turns back (the rear foot of a punch on its ball, the support foot of a
   * round kick, a heel turned out). The turn and the pitch grow from `start` to
   * `stroke`, stay until `relax` and are gone at `end`.
   * Parameter props: The phrase, the sole point that stays, the heading's turn at
   * its fullest in degrees about +Y and the pitch at its fullest in degrees,
   * positive toes up.
   * Returns: The primitive, planted throughout, with a pivot window on the
   * ground over the whole clock.
   */
  export function pivot(
    props: IAutoMovieMotionHumanLegPhrase.IPivotProps,
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
        placement: (_: IAutoMovieMotionHumanPosture, seconds: number) => {
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

  /*
   * A placement scaled about another by the phrase's extent; unchanged when the
   * phrase states a contact, since a manner never moves a goal on a solid
   * place.
   */
  const extended = (
    props: Pick<IAutoMovieMotionHumanLegPhrase.IPhrase, ExtendedProps>,
    about: IAutoMovieMotionHumanFoot.IPlacement,
    target: IAutoMovieMotionHumanFoot.IPlacement,
  ): IAutoMovieMotionHumanFoot.IPlacement => {
    const extent: number = props.manner?.extent ?? 1;
    return props.contact !== undefined || extent === 1
      ? target
      : between(about, target, extent);
  };

  /*
   * The lowest sole point's least height over the floor in mid-swing, metres:
   * the minimum toe clearance of normal gait, 12.9 mm (Winter 1992, Can J Sport
   * Sci 17(1):1-6).
   */
  const TOE_CLEARANCE: number = 0.0129;

  /*
   * The share of the stance blend, by the clock's minimum-jerk envelope, under
   * which a foot moves only vertically: the last third of its transit, terminal
   * swing in Perry and Burnfield's phases (Gait Analysis, 2nd ed.), in which
   * the foot is already over its landing place and comes down onto it. On
   * leaving, the same third lifts it before it travels.
   */
  const TERMINAL: number = AutoMovieEngineMotionSampling.minimumJerkShare(1 / 3);

  /*
   * A foot in transit between its stance and a moving placement at a share of
   * the stance blend: it lifts off before it travels and is over its landing
   * place before it sets down (`TERMINAL`), its sole clears the floor its
   * stance stands on by the minimum toe clearance in between, and no point of
   * its sole ever lies under that floor. At share 0 it stands on its stance; at
   * share 1 it is the moving placement itself, so a target on the floor or on a
   * ball is reached exactly.
   */
  const cleared = (
    props: Pick<IAutoMovieMotionHumanLegPhrase.IPhrase, ClearedProps>,
    moving: IAutoMovieMotionHumanFoot.IPlacement,
    share: number,
  ): IAutoMovieMotionHumanFoot.IPlacement => {
    const stance: IAutoMovieMotionHumanFoot.IPlacement = props.stance;
    const lifted: number = Math.min(1, Math.max(0, share));
    const across: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.min(1, Math.max(0, (lifted - TERMINAL) / (1 - TERMINAL))),
    );
    const placement: IAutoMovieMotionHumanFoot.IPlacement = {
      ankle: {
        x: stance.ankle.x + (moving.ankle.x - stance.ankle.x) * across,
        y: stance.ankle.y + (moving.ankle.y - stance.ankle.y) * share,
        z: stance.ankle.z + (moving.ankle.z - stance.ankle.z) * across,
      },
      rotation: Quaternion.slerp(stance.rotation, moving.rotation, lifted),
    };
    const lowest = (foot: IAutoMovieMotionHumanFoot.IPlacement): number =>
      Math.min(
        ...(["heel", "ball", "toe"] as const).map(
          (point): number =>
            HumanFoot.point(props.body, props.side, point, foot).y,
        ),
      );
    const clearance: number =
      TOE_CLEARANCE * Math.min(1, lifted / TERMINAL, (1 - lifted) / TERMINAL);
    const under: number = lowest(stance) + clearance - lowest(placement);
    return under <= 0
      ? placement
      : {
          ankle: { ...placement.ankle, y: placement.ankle.y + under },
          rotation: placement.rotation,
        };
  };

  /*
   * Whether a phrase's foot stands on its stance: only at the clock's two ends.
   */
  const grounded =
    (clock: IAutoMovieMotionClock) =>
    (seconds: number): boolean =>
      seconds <= 0 || seconds >= clock.duration;
}

/*
 * The alternatives of `ClearedProps`'s site.
 */
type ClearedProps = "body" | "side" | "stance";

/*
 * The alternatives of `BearingProps`'s site.
 */
type BearingProps = "clock" | "side" | "contact";

/*
 * The alternatives of `ExtendedProps`'s site.
 */
type ExtendedProps = "contact" | "manner";
