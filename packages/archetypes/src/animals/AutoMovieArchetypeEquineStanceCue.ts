import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { EquineStanceExtras } from "./EquineStanceExtras";

/**
 * The authored whole-body responses of a halted equid: a weight shift, a
 * startle, a baulk, a hoof lifted for a handler, a step aside, a rear and a
 * buck.
 *
 * Each cue has a named entry, hold and exit on the film clock; the exit is the
 * settle back to the stance it started from, except a step aside, which ends
 * standing where it stepped. These are digital animation performances with
 * authored outcomes, the responses observed in equine movement and expression
 * (PMC7931104) and in the experimental reaction to a novel object (J Anim Sci
 * Technol 2021, doi:10.5187/jast.2021.e51); their amplitudes and timings are
 * the cue's or the planner's authored values.
 */
export namespace AutoMovieArchetypeEquineStanceCue {
  /** The phases every response shares. */
  export interface IPhases {
    /** Film second the entry begins. */
    from: number;

    /** Seconds of entry. */
    entry: number;

    /** Seconds held. */
    hold: number;

    /** Seconds of exit, the settle. */
    exit: number;
  }

  /** Shift the body over the planted hooves. */
  export interface IShift extends IPhases {
    /** Discriminator. */
    kind: "shift";

    /** Leftward shift, metres. */
    x: number;

    /** Upward shift, metres. */
    y: number;

    /** Forward shift, metres. */
    z: number;
  }

  /** Startle in place: drop and draw back over the planted hooves. */
  export interface IStartle extends IPhases {
    /** Discriminator. */
    kind: "startle";
  }

  /** Baulk: brace back against going forward. */
  export interface IBaulk extends IPhases {
    /** Discriminator. */
    kind: "baulk";
  }

  /** Lift one hoof, after moving the weight onto the other three. */
  export interface IHoof extends IPhases {
    /** Discriminator. */
    kind: "hoof";

    /** The limb lifted. */
    limb: AutoMovieArchetypeQuadrupedBody.Limb;
  }

  /**
   * Step sideways, one hoof at a time, each after the weight is on the other
   * three.
   */
  export interface IStepAside extends IPhases {
    /** Discriminator. */
    kind: "stepAside";

    /** The side stepped to. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;

    /** Metres stepped. */
    width: number;
  }

  /**
   * Rear: gather onto the hindquarters, then lift the forehand to a trunk pitch
   * with the forelimbs folded, both hind hooves planted.
   */
  export interface IRear extends IPhases {
    /** Discriminator. */
    kind: "rear";

    /** The held trunk pitch, degrees. */
    pitch: number;
  }

  /**
   * Buck: lower the forehand, then lift the hindquarters to a trunk pitch with
   * the hind limbs kicking back, both fore hooves planted.
   */
  export interface IBuck extends IPhases {
    /** Discriminator. */
    kind: "buck";

    /** The held trunk pitch, degrees. */
    pitch: number;
  }

  /**
   * Spin on the haunches or on the centre: turn about the middle of the hind
   * hooves or of all four, every hoof stepping around in turn.
   */
  export interface ISpin extends IPhases {
    /** Discriminator. */
    kind: "spin";

    /**
     * The turn, degrees about up, positive to the left; at most a full turn
     * either way.
     */
    degrees: number;

    /**
     * What it turns about: the middle of the hind hooves, on the haunches, or
     * the middle of all four, on the centre as a lunged horse turns in to face
     * its handler and out onto the other rein; on the haunches when absent.
     */
    about?: AutoMovieArchetypeEquineStanceCue.Pivot;
  }

  /** What a spin turns about. */
  export type Pivot = "haunches" | "centre";

  /**
   * Crow hops: small bucks one after another, the forehand planted and the
   * hindquarters lifted and set down each time.
   */
  export interface ICrowHops extends IPhases {
    /** Discriminator. */
    kind: "crowHops";

    /** How many hops, a whole number from one. */
    count: number;

    /** Each hop's trunk pitch, degrees, hindquarters up. */
    pitch: number;
  }

  /**
   * A set back against a rope: the horse sits back on its hocks, its
   * hindquarters lowered with all four hooves planted, holds, and stands up
   * again.
   */
  export interface ISetBack extends IPhases {
    /** Discriminator. */
    kind: "setBack";

    /**
     * How far the hindquarters drop, a trunk pitch in degrees, more than 0 and
     * less than 45.
     */
    pitch: number;
  }
  /**
   * A held school air on the hindquarters: the pesade, the forehand raised to
   * 45 degrees, or the levade, to about 30 to 35 (Airs above the ground,
   * Wikipedia; IFCE Equipedia).
   */
  export type Air = "pesade" | "levade";

  /** Raise the forehand into a pesade or a levade and hold it. */
  export interface IAir extends IPhases {
    /** Discriminator. */
    kind: "air";

    /** Which air. */
    air: Air;
  }

  /**
   * The courbette: from the levade, leaps forward on the hind legs without the
   * forelegs touching down, then the forehand comes down where the leaps end.
   */
  export interface ICourbette extends IPhases {
    /** Discriminator. */
    kind: "courbette";

    /** How many leaps, a positive whole number. */
    leaps: number;
  }

  /**
   * The capriole: from a gathered halt, the whole horse leaps up, kicks out
   * with the hind legs at the top and lands on all four.
   */
  export interface ICapriole extends IPhases {
    /** Discriminator. */
    kind: "capriole";
  }

  /** A school air: a held pesade or levade, a courbette or a capriole. */
  export type School = IAir | ICourbette | ICapriole;

  /** Any response. */
  export type Cue =
    | IShift
    | IStartle
    | IBaulk
    | IHoof
    | IStepAside
    | IRear
    | IBuck
    | ISpin
    | ICrowHops
    | ISetBack
    | School
    | EquineStanceExtras.Row;
}
