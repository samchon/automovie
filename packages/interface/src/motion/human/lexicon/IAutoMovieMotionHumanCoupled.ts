import type { IAutoMovieMotionHumanCarried } from "./IAutoMovieMotionHumanCarried";

/**
 * The two-body compositions: carries with their lift and set-down, a supported
 * walk, and throws and takedowns, each a mutual record over shipped laws, with
 * no law per hold.
 *
 * - **carry**: the bearer performs `bearing` with the borne person named, the
 *   borne person `borne` on the bearer, so the pair is one coupled meeting: a
 *   fireman's carry (`overShoulder`), a piggyback, a cradle, a supported walk
 *   (`supported`), a drag, each with the lift into it and the set-down out of
 *   it as the borne body's support sequence.
 * - **throw**: the thrower takes a collar-and-sleeve grip and enters under the
 *   thrown body, its fulcrum lowered to the height of the thrown body's front
 *   (`clinch` with `under`, tsukuri), and the thrown person answers the pull
 *   through it (`perturb`) with the author's outcome, turning over the throw's
 *   fulcrum on the thrower when thrown. The pull itself is the performance's
 *   force input (`IAutoMovieMotionHumanPerformance.IInput.forces`, sized by
 *   `HumanForceExchange.breaking` or `pull`), since a force starts no action.
 *
 * The fulcrum of each throw is the thrower's region the thrown body turns over
 * in the throw's common description: seoi-nage over the upper back and
 * shoulder, o-goshi over the hip at the lower back, o-soto-gari backward over
 * the reaping thigh, the single-leg takedown over the shoulder driven into the
 * hip.
 *
 * - **carry** also gives the dance's waist lift and overhead lift (`waistLift`,
 *   `overheadLift`: the lifted body coupled to the lifter, the overhead one
 *   held an arm's length above the shoulders).
 * - **supportWalk**: one person walked between two helpers, each with `bearing`
 *   on its side of a supported walk and the helped person `borne` on both, one
 *   coupled meeting of three roles.
 * - **helpUp**: helping someone up from the floor, both performing `support`, the
 *   helped hand gripping the helper's palm until the feet bear alone.
 *
 * Arm wrestling is `HumanSocial.armWrestle` with the author's winner; the
 * loser's trunk turn the winner's torque gives is not planned. A tug of war has
 * no law.
 */
export namespace IAutoMovieMotionHumanCoupled {
  /** The shared parameters of a carry. */
  export interface ICarry {
    /** The carry; `piggyback` when absent. */
    carry?: IAutoMovieMotionHumanCarried.Carry;

    /**
     * Seconds carried; 2 s when absent (`HumanCarriedBorne`, provisional: no
     * study of a carry's length). It is the whole span of the pair's coupled
     * meeting, lift and set-down included.
     */
    hold?: number;

    /**
     * Seconds of the lift into the carry, inside `seconds`; none when absent:
     * the carried body starts in the carry. Provisional: no lifting time was
     * read.
     */
    lift?: number;

    /**
     * Seconds of the set-down, inside `seconds`; none when absent: the carry
     * ends in place. Provisional: no setting-down time was read.
     */
    setDown?: number;

    /** Kilograms the borne person carries besides their body; none when absent. */
    mass?: number;
  }

  /** The shared parameters of helping someone up from the floor. */
  export interface IHelpUp {
    /**
     * The hand both hold by, the helper's and the helped's alike, as a
     * handshake takes them; `right` when absent.
     */
    hand?: "left" | "right";
  }

  /** The shared parameters of a walk between two helpers. */
  export interface ISupportWalk {
    /** Seconds supported; the laws' own when absent. */
    duration?: number;
  }

  /** A throw or a takedown by its common name. */
  export type Throw = "seoiNage" | "oGoshi" | "oSotoGari" | "singleLeg";

  /** The shared parameters of a throw. */
  export interface IThrow {
    /** The throw; `seoiNage` when absent. */
    kind?: IAutoMovieMotionHumanCoupled.Throw;

    /** The author's outcome: thrown, resisted or yielded; `thrown` when absent. */
    outcome?: "thrown" | "resist" | "yield";

    /** Seconds the thrower holds the grip; the clinch's own when absent. */
    hold?: number;
  }
}
