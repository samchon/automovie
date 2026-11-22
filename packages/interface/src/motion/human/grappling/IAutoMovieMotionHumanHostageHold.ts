import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";

/**
 * A hostage hold from behind: the holder's free arm lies across the
 * hostage's chest or neck, the other hand presents a held weapon at the
 * hostage's head or throat, and the pair walks backward together. The
 * hostage performs `heldHostage` on the same clock, carried by the hold.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the arm, the weapon's place, the shared walk and the two roles.
 * @evidence contracts/development/design.md#principled-representation A closed arm placement, a weapon point at a named region and a backward distance in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the `hostageHold` and `heldHostage` laws read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The weapon stays at its region within the law's tolerance; a region out of reach is refused.
 */
export namespace IAutoMovieMotionHumanHostageHold {
  /**
   * Where the holding arm lies across the hostage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents Arm: Where the holding arm lies across the hostage.
   */
  export type Arm = "chest" | "neck";

  /**
   * The holder's parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation Subject ids, an affordance id, a region, metres and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `hostageHold.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A weapon point requires the weapon; the law refuses one without it.
   */
  export interface IParams {
    /** The hostage. */
    partner: string;

    /** Where the free arm lies; `chest` when absent. */
    arm?: Arm;

    /** The held weapon presented at the hostage; none when absent. */
    prop?: string;

    /** The weapon's point brought to the region, one of its affordance ids; required with `prop`. */
    point?: string;

    /** The hostage's region the weapon is presented at; `templeRight` when absent. */
    region?: AutoMovieHumanoidRegion;

    /** How far the pair walks backward, metres; 0 when absent, the pair standing still. The speed is this over `seconds`. */
    back?: number;

    /** How long the hold lasts, seconds; 3 when absent (authored). */
    seconds?: number;
  }

  /**
   * The hostage's parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The holder by subject id.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `heldHostage.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hostage's path is read from the holder's own hold.
   */
  export interface IHeld {
    /** The holder. */
    partner: string;
  }
}
