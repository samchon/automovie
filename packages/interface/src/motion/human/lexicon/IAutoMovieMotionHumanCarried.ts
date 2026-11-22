import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanCarriedDrag } from "./IAutoMovieMotionHumanCarriedDrag";
import type { IAutoMovieMotionHumanCarriedLift } from "./IAutoMovieMotionHumanCarriedLift";

/**
 * Being carried by another person: on the back, in the arms or over a
 * shoulder. The carried person keeps the posture they are in and goes
 * rigidly with one bone of the carrier (the upper chest when none is
 * named), so whatever the carrier does (walk, turn, stoop) takes them
 * along. The carrier performs their own action, such as a carry of the
 * load in both hands. Register `HumanCarried.carried` to use it.
 *
 * The named carries (`CARRIES`: piggyback, cradle, over the shoulder,
 * supported) are two laws for the two people: `borne` puts the carried body
 * in the carry's posture with its resting region on the carrier's, and
 * `bearing`, performed over the carrier's own action, puts the carrier's
 * hands where the carry holds.
 *
 * First pass: the lift into the carry and the set-down are not planned,
 * the carried body does not sag or cling, and its weight does not lean the
 * carrier.
 *
 * @evidence contracts/development/common.md#meaningful-documentation on: The carrier's bone the body goes with; the upper chest when absent. hold: Seconds carried. turn: The carried body's heading from the carrier's, degrees about +Y.
 * @evidence contracts/development/design.md#principled-representation on: The carrier's bone the body goes with; the upper chest when absent. hold: Seconds carried. turn: The carried body's heading from the carrier's, degrees about +Y.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarried.ts (HumanCarried.carried, context); lexicon/HumanCarriedBearing.ts (HumanCarriedBearing.plan.first, c); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.kind, carry); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.kind, rows); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.couple, carry); lexicon/HumanCarriedLean.ts (HumanCarriedLean.layer, carry).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieMotionHumanCarriedDrag.Name, AutoMovieHumanoidRegion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanCarried {
  /**
   * Parameters of being carried.
   *
   * @evidence contracts/development/common.md#meaningful-documentation on: The carrier's bone the body goes with; the upper chest when absent. hold: Seconds carried.
   * @evidence contracts/development/design.md#principled-representation on: The carrier's bone the body goes with; the upper chest when absent. hold: Seconds carried.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarried.ts (HumanCarried.carried, context); lexicon/HumanCarried.ts (HumanCarried.carried).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IParams {
    /** The carrier's subject id. */
    partner: string;

    /** The carrier's bone the body goes with; the upper chest when absent. */
    on?: AutoMovieHumanoidBone;

    /** Seconds carried. */
    hold: number;
  }

  /**
   * A named way one person carries another.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A named way one person carries another.
   * @evidence contracts/development/design.md#principled-representation Closed choices "piggyback", "cradle", "overShoulder", "supported", "supportedLeft", "waistLift", "overheadLift", "shoulders" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarriedBearing.ts (HumanCarriedBearing.plan.first, c); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.kind, carry); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.kind, rows); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.couple, carry); lexicon/HumanCarriedLean.ts (HumanCarriedLean.layer, carry); lexicon/HumanCarried.ts (HumanCarried.CARRIES).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanCarriedDrag.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type Carry =
    | "piggyback"
    | "cradle"
    | "overShoulder"
    | "supported"
    | "supportedLeft"
    | "waistLift"
    | "overheadLift"
    | "shoulders"
    | IAutoMovieMotionHumanCarriedDrag.Name;

  /**
   * An offset by its parts in a performer's floor frame: toward the named hand's side, up and forward.
   *
   * @evidence contracts/development/common.md#meaningful-documentation out: Toward the hand's own side. up: Up. forward: Forward.
   * @evidence contracts/development/design.md#principled-representation out: Toward the hand's own side. up: Up. forward: Forward.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in lexicon/HumanCarried.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in IAutoMovieMotionHumanCarried.IOffset.
   */
  export interface IOffset {
    /** Toward the hand's own side. */
    out: number;

    /** Up. */
    up: number;

    /** Forward. */
    forward: number;
  }

  /**
   * One carry: how the carried body lies against the carrier and where the carrier's hands hold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation turn: The carried body's heading from the carrier's, degrees about +Y. pitch: The carried body's forward tip, degrees. legs: The carried body's hip and knee flexion and hip abduction, degrees.
   * @evidence contracts/development/design.md#principled-representation turn: The carried body's heading from the carrier's, degrees about +Y. pitch: The carried body's forward tip, degrees. legs: The carried body's hip and knee flexion and hip abduction, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.kind, rows); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.couple, row); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit, row); lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.posture, row); lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.holds, row); lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.key, row).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidRegion, IAutoMovieMotionHumanCarried.IHold identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IRow {
    /** The carried body's region that rests on the carrier. */
    mine: AutoMovieHumanoidRegion;

    /** The carrier's region it rests on. */
    theirs: AutoMovieHumanoidRegion;

    /** The carried body's heading from the carrier's, degrees about +Y. */
    turn: number;

    /** The carried body's forward tip, degrees. */
    pitch: number;

    /** The carried body's hip and knee flexion and hip abduction, degrees. */
    legs: readonly [number, number, number];

    /** The borne knees wrap outside the bearer's two sides. */
    straddles?: boolean;

    /** The carrier's regions the carried person's left and right wrists go to; null for an arm that hangs. */
    clings: readonly [
      AutoMovieHumanoidRegion | null,
      AutoMovieHumanoidRegion | null,
    ];

    /** Where the carrier's left and right wrists hold: an own region and an offset from it in arm lengths; null for a free arm. */
    holds: readonly [
      IAutoMovieMotionHumanCarried.IHold | null,
      IAutoMovieMotionHumanCarried.IHold | null,
    ];

    /** How far above the carrier's region the carried region rests, in the carrier's arm lengths (upper arm and forearm): a lift held at the arms' reach; none when absent. */
    rise?: number;
  }

  /**
   * Where a carrying hand holds, on the carrier's own body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation region: The carrier's own region the place is measured from. offset: The wrist's offset from it, arm lengths.
   * @evidence contracts/development/design.md#principled-representation region: The carrier's own region the place is measured from. offset: The wrist's offset from it, arm lengths.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarriedBearing.ts (HumanCarriedBearing.plan); lexicon/HumanCarriedCouplingRigid.ts (HumanCarriedCouplingRigid.read).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidRegion, IAutoMovieMotionHumanCarried.IOffset identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IHold {
    /** The carrier's own region the place is measured from. */
    region: AutoMovieHumanoidRegion;

    /** The wrist's offset from it, arm lengths. */
    offset: IAutoMovieMotionHumanCarried.IOffset;

    /** The fingers' preferred tangent in the held region bone's local frame. */
    fingers?: IAutoMovieVector3;

    /** A hand shape the hold needs, such as a flat supporting palm. */
    shape?: IAutoMovieMotionHumanHand.Shape;
  }

  /**
   * Parameters of being carried in a named carry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation partner: The carrier's subject id; absent, the body takes the carry's posture where it stands, resting on nothing. carry: The carry; `piggyback` when absent. hold: Seconds carried, more than none; 2 when absent. Exclusive minimum: 0. Unit: "s".
   * @evidence contracts/development/design.md#principled-representation partner: The carrier's subject id; absent, the body takes the carry's posture where it stands, resting on nothing. carry: The carry; `piggyback` when absent. hold: Seconds carried, more than none; 2 when absent. Exclusive minimum: 0. Unit: "s".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarried.ts (HumanCarried.borne, context); lexicon/HumanCarriedBorne.ts (HumanCarriedBorne.plan, context); lexicon/HumanCarried.ts (HumanCarried.borne).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanCarried.Carry identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IBorne extends IAutoMovieMotionHumanCarriedLift.IParams {
    /** The carrier's subject id; absent, the body takes the carry's posture where it stands, resting on nothing. */
    partner?: string;

    /** The carry; `piggyback` when absent. */
    carry?: IAutoMovieMotionHumanCarried.Carry;

    /** Seconds carried, more than none; 2 when absent. */
    hold?: number;

    /** Kilograms the carried person carries besides their body (a pack, gear), at least 0, which the carrier bears too; none when absent. */
    mass?: number;

    /** A second helper's subject id, on the carry's other side (`HumanCarriedCoupling.PAIRED`: a supported walk between two helpers); none when absent. */
    with?: string;
  }

  /**
   * Parameters of the carrier's hold in a named carry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation carry: The carry; `piggyback` when absent. of: The carried person's subject id: the hands then hold where the coupled carry puts that body (#3437); the carry's own places when absent. mass: Kilograms the carried person carries besides their body, as their `borne` states it; none when absent. Inclusive minimum: 0.
   * @evidence contracts/development/design.md#principled-representation carry: The carry; `piggyback` when absent. of: The carried person's subject id: the hands then hold where the coupled carry puts that body (#3437); the carry's own places when absent. mass: Kilograms the carried person carries besides their body, as their `borne` states it; none when absent. Inclusive minimum: 0.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarried.ts (HumanCarried.bearing, context); lexicon/HumanCarriedBearing.ts (HumanCarriedBearing.plan, context); lexicon/HumanCarried.ts (HumanCarried.bearing).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanCarried.Carry identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IBearing {
    /** The carry; `piggyback` when absent. */
    carry?: IAutoMovieMotionHumanCarried.Carry;

    /** The carried person's subject id: the hands then hold where the coupled carry puts that body (#3437); the carry's own places when absent. */
    of?: string;

    /** Kilograms the carried person carries besides their body, at least 0, as their `borne` states it; none when absent. */
    mass?: number;

    /** The other helper's subject id when two helpers carry one person (`HumanCarriedCoupling.PAIRED`): this one is the second when its carry is the other side's; none when absent. */
    beside?: string;

    /** Seconds held, more than none; 2 when absent. */
    hold?: number;
  }
}
