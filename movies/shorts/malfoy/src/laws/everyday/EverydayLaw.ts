import type { IBodyMeasure } from "../body/IBodyMeasure";

/**
 * Timing and geometry laws of everyday handling: sitting, handing over,
 * withdrawing, hiding, dropping, picking up, carrying cups, the charmed
 * crane's glide and the small gestures of the cast's habits. Every value is
 * the everyday studies' measured value, their stated production choice, or
 * the cast's settings.
 *
 * ```ts
 * EverydayLaw.TIMES.offer; // { duration: 0.7, contact: 0.7 }
 * EverydayLaw.handoverPoint(giver, receiver, measure);
 * ```
 *
 * @evidence docs/research/everyday/sitting.md#stand-to-sit Stand to sit 1.5–2.5 s; sit to stand 1.2–2.0 s; one sideways shift 0.8–1.2 s moving at most 0.6 m.
 * @evidence docs/research/everyday/handover.md#phases Transport and reach 0.5–1.0 s; transfer 0.35–0.50 s for paper, 0.50–0.64 s for a filled cup; handover point near the chests' midpoint, lower with distance.
 * @evidence docs/research/everyday/handover.md#withdrawal Withdrawal 0.3–0.6 s.
 * @evidence docs/research/everyday/handover.md#dropped A dropped sheet falls 1 m in 1.2–1.8 s, drifting up to 0.3 m.
 * @evidence docs/research/everyday/handover.md#pick-up Lowering and rising 0.8–1.2 s each; heads 0.35 m ahead of the feet at full hinge.
 * @evidence docs/research/everyday/handover.md#crane The crane glides level at 1.0–1.5 m/s for at most 6 m.
 * @evidence docs/research/everyday/handover.md#cups Cups carried upright within 10°, at most 1.0 m/s, at most six steps.
 * @evidence docs/body/settings/cast/carina-malfoy.md#forehead-touch About a second at the forehead.
 * @evidence docs/body/settings/cast/harry-potter.md#gives-room Palms and a half-metre step back within 0.6 s.
 * @evidence docs/body/settings/cast/harry-potter.md#pushes-glasses Finger to the bridge within 1 s.
 * @evidence docs/body/settings/cast/carina-malfoy.md#chin-up The chin lifts about 10° and holds about a second, shoulders square.
 * @evidence docs/research/everyday/walking.md#transitions A walker stopped by someone stepping into the path stops a hand's breadth short, 0.42 m between pelvis points.
 * @evidence contracts/development/common.md#meaningful-documentation States every value's unit and source.
 * @evidence contracts/development/design.md#principled-representation Seconds and metres; each action's duration and contact offset in one table.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The values the schedule timing and the motion laws read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene is named.
 * @evidence contracts/development/behaviors.md#studied-laws Each constant cites its study range.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure values and functions.
 */
export namespace EverydayLaw {
  /** An action's seconds and the offset of its contact instant. */
  export interface ITime {
    /** Seconds. */
    duration: number;

    /** Seconds from the start to the contact instant. */
    contact?: number;
  }

  /** Durations of the fixed-length everyday actions, each inside its study's range. */
  export const TIMES = Object.freeze({
    sit: { duration: 2.0, contact: 1.6 },
    rise: { duration: 1.6, contact: 0 },
    look: { duration: 0.4 },
    offer: { duration: 0.7, contact: 0.7 },
    withdraw: { duration: 0.45, contact: 0 },
    receive: { duration: 0.7, contact: 0.7 },
    pull: { duration: 0.25, contact: 0 },
    release: { duration: 0.4, contact: 0 },
    openPalm: { duration: 0.6, contact: 0.6 },
    lowerHand: { duration: 0.5 },
    pocket: { duration: 0.5 },
    hide: { duration: 0.4, contact: 0.4 },
    drop: { duration: 0.2, contact: 0.05 },
    pickUpFloor: { duration: 2.0, contact: 1.0 },
    pickUpSill: { duration: 1.2, contact: 0.6 },
    putDown: { duration: 1.0, contact: 0.6 },
    unfoldHalf: { duration: 1.2, contact: 1.2 },
    unfoldOpen: { duration: 2.0, contact: 2.0 },
    fold: { duration: 1.0, contact: 1.0 },
    raise: { duration: 0.6, contact: 0.6 },
    drink: { duration: 2.0, contact: 1.0 },
    read: { duration: 1.2, contact: 0.6 },
    launch: { duration: 0.5, contact: 0.35 },
    reachAfter: { duration: 0.5, contact: 0.5 },
    drawBack: { duration: 0.5 },
    catchReach: { duration: 0.4, contact: 0.4 },
    touchForehead: { duration: 1.6, contact: 0.3 },
    pushGlasses: { duration: 0.8, contact: 0.4 },
    giveRoom: { duration: 1.0, contact: 0.4 },
    bend: { duration: 1.0, contact: 1.0 },
    straighten: { duration: 0.9, contact: 0 },
    liftChin: { duration: 1.4, contact: 0.2 },
  } satisfies Record<string, ITime>);

  /** The lifted chin's head pitch, radians: about 10° up. */
  export const CHIN_LIFT: number = (10 * Math.PI) / 180;

  /** Distance between two people's pelvis points when they stand a hand's breadth apart chest to chest, metres: 0.1 m between fronts plus two half chest depths. */
  export const FACE_TO_FACE: number = 0.42;

  /** Most a seated person shifts in one move, metres. */
  export const SHIFT_LIMIT: number = 0.6;

  /** Seconds per sideways shift. */
  export const SHIFT_SECONDS: number = 1.0;

  /** Hip joint centre above the seat surface when seated, metres: a production inference from the buttock tissue below the hip joint. */
  export const HIP_ABOVE_SEAT: number = 0.09;

  /** Forward distance of the seated feet from the seat's front edge, metres: thighs level, shins vertical. */
  export const SEATED_FEET_FORWARD: number = 0.05;

  /** Seconds per metre of a dropped sheet's fall, the middle of 1.2–1.8 s. */
  export const PAPER_FALL_PER_METRE: number = 1.5;

  /** Sideways drift of a dropped sheet, metres, inside the 0.3 m bound. */
  export const PAPER_DRIFT: number = 0.15;

  /** Crane glide speed, metres per second, inside 1.0–1.5. */
  export const CRANE_SPEED: number = 1.2;

  /** Longest crane glide, metres. */
  export const CRANE_RANGE: number = 6;

  /** Fastest cup carry, metres per second. */
  export const CUP_CARRY_SPEED: number = 1.0;

  /** Most steps with a filled cup. */
  export const CUP_CARRY_STEPS: number = 6;

  /** Distance between chests for an arm's-length conversation, metres (0.8–1.2). */
  export const CONVERSATION: number = 1.0;

  /** Distance between chests for handing something over, metres (0.5–0.9). */
  export const HANDING: number = 0.7;

  /** How far a withdrawn first offer stops short of the receiver's hand, metres: a handspan. */
  export const HANDSPAN: number = 0.18;

  /** Give-room step, metres. */
  export const GIVE_ROOM: number = 0.5;

  /**
   * Seconds both hands hold an object during its transfer, interpolated in
   * mass between the measured 0.50 s at 90 g and 0.64 s at 1.8 kg, and from
   * 0.35 s for a weightless sheet to the 90 g value below it.
   *
   * @param mass Kilograms.
   * @returns Seconds.
   * @evidence docs/research/everyday/handover.md#phases The two measured transfers and the paper inference.
   */
  export function transfer(mass: number): number {
    if (mass <= 0.09) return 0.35 + ((0.5 - 0.35) * Math.max(0, mass)) / 0.09;
    return 0.5 + ((0.64 - 0.5) * Math.min(1.8 - 0.09, mass - 0.09)) / (1.8 - 0.09);
  }

  /**
   * The handover point's height between two people: chest height at
   * handing distance, falling toward the waist as they stand farther apart.
   *
   * @param measure The giver's body.
   * @param distance Chest-to-chest distance, metres.
   * @returns Metres above the floor.
   * @evidence docs/research/everyday/handover.md#phases The point lowers as the people stand farther apart (Hansen et al. 2017 through the review); the slope is a production choice.
   */
  export function handoverHeight(measure: IBodyMeasure, distance: number): number {
    const chest: number = measure.shoulder - 0.2;
    const waist: number = measure.hip + 0.12;
    const lowered: number = chest - 0.35 * Math.max(0, distance - HANDING);
    return Math.max(waist, Math.min(chest, lowered));
  }

  /**
   * The bend depth at which two people bending toward each other from a gap
   * meet head to head halfway: each head travels forward by the trunk's lean
   * (0.03 + 0.95 depth radians, the bend posture's hinge) less the pelvis's
   * 0.12 depth shift back, until it is a head radius (9 cm) short of the
   * midpoint; 1 when the heads never meet before the hands reach the floor.
   *
   * @param measure The bending body.
   * @param gap Distance between the two floor points, metres.
   * @returns Depth in [0, 1].
   * @evidence docs/research/everyday/handover.md#pick-up Heads 0.35 m ahead of the feet at full hinge meet from 0.8-0.9 m apart before the hands reach the floor.
   */
  export function meetDepth(measure: IBodyMeasure, gap: number): number {
    const reach = (d: number): number => Math.sin(0.03 + 0.95 * d) * (measure.head - measure.hip) - 0.12 * d;
    const want: number = gap / 2 - 0.09;
    if (reach(1) < want) return 1;
    let lo: number = 0;
    let hi: number = 1;
    for (let k = 0; k < 40; k++) {
      const mid: number = (lo + hi) / 2;
      if (reach(mid) < want) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  /**
   * Seconds a dropped sheet takes to fall a height.
   *
   * @param height Metres.
   * @returns Seconds.
   * @evidence docs/research/everyday/handover.md#dropped 1.2–1.8 s per metre.
   */
  export function paperFall(height: number): number {
    return Math.max(0, height) * PAPER_FALL_PER_METRE;
  }

  /**
   * Seconds of a seated shift.
   *
   * @param metres Distance along the seat.
   * @returns Seconds: one shift per 0.6 m.
   * @evidence docs/research/everyday/sitting.md#shift At most 0.6 m per shift, 0.8–1.2 s each.
   */
  export function shift(metres: number): number {
    return Math.max(1, Math.ceil(Math.abs(metres) / SHIFT_LIMIT - 1e-9)) * SHIFT_SECONDS;
  }
}
