import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanCarriedDrag } from "./IAutoMovieMotionHumanCarriedDrag";
import type { IAutoMovieMotionHumanCarriedLift } from "./IAutoMovieMotionHumanCarriedLift";

/**
 * Being carried by another person: on the back, in the arms or over a shoulder.
 * The carried person keeps the posture they are in and goes rigidly with one
 * bone of the carrier (the upper chest when none is named), so whatever the
 * carrier does (walk, turn, stoop) takes them along. The carrier performs their
 * own action, such as a carry of the load in both hands. Register
 * `HumanCarried.carried` to use it.
 *
 * The named carries (`CARRIES`: piggyback, cradle, over the shoulder,
 * supported) are two laws for the two people: `borne` puts the carried body in
 * the carry's posture with its resting region on the carrier's, and `bearing`,
 * performed over the carrier's own action, puts the carrier's hands where the
 * carry holds.
 *
 * First pass: the lift into the carry and the set-down are not planned, the
 * carried body does not sag or cling, and its weight does not lean the
 * carrier.
 */
export namespace IAutoMovieMotionHumanCarried {
  /** Parameters of being carried. */
  export interface IParams {
    /** The carrier's subject id. */
    partner: string;

    /** The carrier's bone the body goes with; the upper chest when absent. */
    on?: AutoMovieHumanoidBone;

    /** Seconds carried. */
    hold: number;
  }

  /** A named way one person carries another. */
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
   * An offset by its parts in a performer's floor frame: toward the named
   * hand's side, up and forward.
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
   * One carry: how the carried body lies against the carrier and where the
   * carrier's hands hold.
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

    /**
     * The carrier's regions the carried person's left and right wrists go to;
     * null for an arm that hangs.
     */
    clings: readonly [
      AutoMovieHumanoidRegion | null,
      AutoMovieHumanoidRegion | null,
    ];

    /**
     * Where the carrier's left and right wrists hold: an own region and an
     * offset from it in arm lengths; null for a free arm.
     */
    holds: readonly [
      IAutoMovieMotionHumanCarried.IHold | null,
      IAutoMovieMotionHumanCarried.IHold | null,
    ];

    /**
     * How far above the carrier's region the carried region rests, in the
     * carrier's arm lengths (upper arm and forearm): a lift held at the arms'
     * reach; none when absent.
     */
    rise?: number;
  }

  /** Where a carrying hand holds, on the carrier's own body. */
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

  /** Parameters of being carried in a named carry. */
  export interface IBorne extends IAutoMovieMotionHumanCarriedLift.IParams {
    /**
     * The carrier's subject id; absent, the body takes the carry's posture
     * where it stands, resting on nothing.
     */
    partner?: string;

    /** The carry; `piggyback` when absent. */
    carry?: IAutoMovieMotionHumanCarried.Carry;

    /** Seconds carried, more than none; 2 when absent. */
    hold?: number;

    /**
     * Kilograms the carried person carries besides their body (a pack, gear),
     * at least 0, which the carrier bears too; none when absent.
     */
    mass?: number;

    /**
     * A second helper's subject id, on the carry's other side
     * (`HumanCarriedCoupling.PAIRED`: a supported walk between two helpers);
     * none when absent.
     */
    with?: string;
  }

  /** Parameters of the carrier's hold in a named carry. */
  export interface IBearing extends IAutoMovieMotionHumanCarriedLift.IParams {
    /** The carry; `piggyback` when absent. */
    carry?: IAutoMovieMotionHumanCarried.Carry;

    /**
     * The carried person's subject id: the hands then hold where the coupled
     * carry puts that body; the carry's own places when absent.
     */
    of?: string;

    /**
     * Kilograms the carried person carries besides their body, at least 0, as
     * their `borne` states it; none when absent.
     */
    mass?: number;

    /**
     * The other helper's subject id when two helpers carry one person
     * (`HumanCarriedCoupling.PAIRED`): this one is the second when its carry is
     * the other side's; none when absent.
     */
    beside?: string;

    /** Seconds held, more than none; 2 when absent. */
    hold?: number;
  }
}
