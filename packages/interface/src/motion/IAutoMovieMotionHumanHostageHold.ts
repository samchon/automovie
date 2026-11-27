import type { AutoMovieHumanoidRegion } from "../skeleton/AutoMovieHumanoidRegion";

/**
 * A hostage hold from behind: the holder's free arm lies across the hostage's
 * chest or neck, the other hand presents a held weapon at the hostage's head or
 * throat, and the pair walks backward together. The hostage performs
 * `heldHostage` on the same clock, carried by the hold.
 */
export namespace IAutoMovieMotionHumanHostageHold {
  /** Where the holding arm lies across the hostage. */
  export type Arm = "chest" | "neck";

  /** The holder's parameters. */
  export interface IParams {
    /** The hostage. */
    partner: string;

    /** Where the free arm lies; `chest` when absent. */
    arm?: Arm;

    /** The held weapon presented at the hostage; none when absent. */
    prop?: string;

    /**
     * The weapon's point brought to the region, one of its affordance ids;
     * required with `prop`.
     */
    point?: string;

    /**
     * The hostage's region the weapon is presented at; `templeRight` when
     * absent.
     */
    region?: AutoMovieHumanoidRegion;

    /**
     * How far the pair walks backward, metres; 0 when absent, the pair standing
     * still. The speed is this over `seconds`.
     */
    back?: number;

    /** How long the hold lasts, seconds; 3 when absent (authored). */
    duration?: number;
  }

  /** The hostage's parameters. */
  export interface IHeld {
    /** The holder. */
    partner: string;
  }
}
