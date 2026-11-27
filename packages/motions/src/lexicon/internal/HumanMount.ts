import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { sitPlace } from "../../everyday/internal/sitPlace";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";

/** The record of `IOVERItem`'s site. */
type IOVERItem = { above: number; behind: number };

/** The alternatives of `HANGEntryItem`'s site. */
type HANGEntryItem = "ahead" | "astride";

/**
 * The shapes of getting onto and off a high seat (`HumanMountOn`,
 * `HumanMountOff`): a bar stool, a saddle, a wall. Each length is a share of
 * the body's own thigh, so one value fits every body, and each value is
 * provisional: no measurement of mounting was read.
 *
 * `sit` gets onto such a seat and `rise` gets off it. The seat comes from
 * `HumanObject.seat`, which reads the object's foot rests with it, and
 * `HumanRide.ride` then carries the seated body with a support that moves.
 */
export namespace HumanMount {
  /**
   * How far above a high seat the seat socket passes before it sets down or
   * after it leaves sideways, thigh lengths (provisional).
   */
  export const HOP: number = 0.15;

  /**
   * Seconds a body already on the seat takes to settle into sitting on it, as
   * after getting off is broken off (provisional).
   */
  export const SETTLE: number = 0.5;

  /**
   * How near its rest an entry foot's ankle lies for the foot to be on it
   * already, metres: the campaign's 5 mm contact bound.
   */
  export const ON: number = 0.005;

  /**
   * Peak forward trunk inclination while getting onto or off a high seat,
   * degrees (provisional).
   */
  export const LEAN: number = 20;

  /**
   * How far each hanging upper arm abducts while the legs climb onto or off a
   * high seat, clear of a lifted thigh, degrees (provisional).
   */
  export const OPEN: number = 20;

  /**
   * How far a pushing foot's toes point down as it leaves the floor, degrees:
   * it pushes off from the ball (provisional).
   */
  export const POINT: number = 40;

  /**
   * How far a pushing foot's heel rolls up over its ball before the toes leave
   * the floor, degrees: the toes' extension at the metatarsophalangeal joints
   * in a push-off (provisional).
   */
  export const TOE_ROLL: number = 50;

  /**
   * The share of the leg's length a swinging foot's ankle keeps within from its
   * hip: short of straight, so the knee keeps a bend the limb fit can follow
   * (provisional).
   */
  export const SWING_REACH: number = 0.97;

  /**
   * The thigh's direction from the hip when a foot hangs from a high seat, in
   * the sitter's frame with `x` outward: level ahead on a seat sat on with both
   * legs ahead, where the seat bears the thigh, and dropped and spread on one
   * sat astride (provisional; the shank hangs plumb under the knee).
   */
  export const HANG: Readonly<
    Record<HANGEntryItem, readonly [number, number, number]>
  > = {
    ahead: [0.05, 0, 1],
    astride: [0.5, -0.55, 0.67],
  };

  /**
   * Where the ankle of a leg swung over a seat sat astride passes, thigh
   * lengths above and behind the seated socket (provisional).
   */
  export const OVER: Readonly<IOVERItem> = {
    above: 0.6,
    behind: 0.8,
  };

  /**
   * How far ahead of the seated socket the pelvis stands after getting off a
   * high seat forwards, thigh lengths (provisional: clear of the front edge by
   * about a quarter thigh).
   */
  export const AHEAD: number = 1.25;

  /**
   * How far beyond the near foot's place on a seat sat astride the pelvis
   * stands after getting off sideways, thigh lengths (provisional).
   */
  export const BESIDE: number = 0.6;

  /** A foot's placement off the floor, on its way to or from a high seat. */
  export interface IFoot {
    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** A world point the knee bends toward. */
    bend: IAutoMovieVector3;

    /** The foot's heading, degrees about +Y; it stays level. */
    yaw: number;
  }

  /**
   * The distances from a hip joint an ankle can be placed at: the sitting's own
   * band (`sitPlace.band`), so getting on and off a high seat places feet where
   * sitting does.
   *
   * @param body The body.
   * @returns The least and the greatest distance, metres.
   */
  export function span(
    body: IAutoMovieMotionHumanBody,
  ): readonly [number, number] {
    return sitPlace.band(body, "left");
  }

  /**
   * Whether an entry foot stands on the floor: planted, with its ankle within
   * half a thigh's radius of its standing height. A foot planted on a rest,
   * hanging or in flight does not.
   *
   * @param body The body.
   * @param foot The foot's displayed entry state.
   * @returns Whether it stands on the floor.
   */
  export function grounded(
    body: IAutoMovieMotionHumanBody,
    foot: IAutoMovieMotionHumanEntryState.IFoot,
  ): boolean {
    return (
      foot.planted &&
      foot.ankle.y <= body.measure.ankleHeight + 0.5 * body.measure.thighRadius
    );
  }

  /**
   * Where an entry foot is, as a placement to hold or to leave from: its
   * displayed ankle and heading, and the knee's aim the entry posture gave it,
   * or straight ahead of the ankle when that posture set none in the world.
   *
   * @param entry The entry state.
   * @param side The foot.
   * @returns The placement.
   */
  export function held(
    entry: IAutoMovieMotionHumanEntryState,
    side: AutoMovieHumanSide,
  ): IFoot {
    const limb: IAutoMovieHumanLimbGoal | undefined =
      entry.posture.limbs[`${side}Leg`];
    const ankle: IAutoMovieVector3 = entry.feet[side].ankle;
    return {
      ankle,
      bend:
        limb !== undefined && limb.on === undefined
          ? limb.bend
          : HumanFrame.point(
              { origin: ankle, yaw: entry.posture.yaw },
              { x: 0, y: 0, z: 1 },
            ),
      yaw: HumanFoot.heading(entry.feet[side].rotation),
    };
  }

  /**
   * A leg goal on a foot's placement.
   *
   * @param body The body.
   * @param side The leg.
   * @param foot The placement.
   * @param planted Whether the foot bears there.
   * @returns The goal.
   */
  export function leg(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    foot: IFoot,
    planted: boolean,
  ): IAutoMovieHumanLimbGoal {
    return {
      point: foot.ankle,
      bend: foot.bend,
      rotation: HumanFrame.turn(foot.yaw),
      planted,
      ...(planted ? { contact: HumanFoot.offset(body, side, "ball") } : {}),
    };
  }

  /**
   * A foot a share of the way between two placements: the ankle on the straight
   * line between them, or on the curve through `over` at its middle, raised by
   * `lift sin(pi share)`; the knee's aim and the heading go the same share.
   * Along the floor the ankle runs the cycloid's share `s - sin(2 pi s) / (2
   * pi)`, whose rate and acceleration vanish at both ends, so the foot rises
   * off its place before it travels and comes down onto the next before it
   * stops (the cycloid foot trajectory of Sakakibara, Kan, Hosoda, Hattori and
   * Fujie 1990, "Foot trajectory for a quadruped walking machine", IEEE IROS,
   * pp. 315-322): a sole still on the floor as the swing begins is lifted, not
   * dragged along it.
   *
   * @param from Where it leaves.
   * @param to Where it arrives.
   * @param share 0 at `from` to 1 at `to`.
   * @param lift The clearance at the middle, metres.
   * @param over A point the ankle passes at the middle, as a leg swung over a
   *   saddle passes above it.
   * @returns The placement.
   */
  export function between(
    from: IFoot,
    to: IFoot,
    share: number,
    lift: number,
    over?: IAutoMovieVector3,
  ): IFoot {
    const s: number = Math.min(1, Math.max(0, share));
    const along: number = s - Math.sin(2 * Math.PI * s) / (2 * Math.PI);
    const line: IAutoMovieVector3 = {
      x: from.ankle.x + (to.ankle.x - from.ankle.x) * along,
      y: from.ankle.y + (to.ankle.y - from.ankle.y) * s,
      z: from.ankle.z + (to.ankle.z - from.ankle.z) * along,
    };
    const ankle: IAutoMovieVector3 =
      over === undefined
        ? line
        : Vector3.add(
            line,
            Vector3.scale(
              Vector3.subtract(over, Vector3.lerp(from.ankle, to.ankle, 0.5)),
              4 * s * (1 - s),
            ),
          );
    return {
      ankle: { ...ankle, y: ankle.y + lift * Math.sin(Math.PI * s) },
      bend: Vector3.lerp(from.bend, to.bend, s),
      yaw: from.yaw + (to.yaw - from.yaw) * s,
    };
  }
}
