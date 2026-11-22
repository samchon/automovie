import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * Firefighting drills with coarse inert props.
 *
 * The extinguisher follows the PASS sequence (OSHA, Portable fire
 * extinguishers,
 * https://osha.gov/etools/evacuation-plans-procedures/emergency-standards/portable-extinguishers/use):
 * pull the pin, aim the nozzle low at the base of the fire, squeeze the
 * lever and sweep side to side. A hose team of a nozzle operator and a
 * backup member grip one hose line and advance; the operator opens the bail
 * and sweeps. A second person beats flames on a lying body with a held
 * cloth.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three drills, their order and the source.
 * @evidence contracts/development/design.md#principled-representation Props by subject id and their named affordances, a target, counts, degrees and metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the `extinguish`, `hoseLine` and `beatFlames` laws read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A target beyond the nozzle's reach is refused; the discharge is a screen cue, never simulated.
 */
export namespace IAutoMovieMotionHumanFirefight {
  /**
   * A hose team member's role.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents Role: A hose team member's role.
   */
  export type Role = "nozzle" | "backup";

  /**
   * The extinguisher drill's parameters. The extinguisher declares `pin`,
   * `lever`, `nozzle` and a carrying `handle` affordance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation A prop, a target, a count, degrees and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `extinguish.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law refuses a target the nozzle cannot reach.
   */
  export interface IExtinguish {
    /** The held extinguisher's scene subject id. */
    prop: string;

    /** The fire's base the nozzle aims at. */
    target: IAutoMovieMotionTarget;

    /** Side-to-side sweeps; 3 when absent. */
    sweeps?: number;

    /** The sweep's full angle about the aim, degrees; 40 when absent. */
    span?: number;
  }

  /**
   * A hose team member's parameters. The hose declares a grip affordance
   * per member along its line, and its nozzle a `bail` articulation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation A prop, a role, an affordance id, metres, a target and a count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `hoseLine.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the nozzle operator opens the bail and sweeps.
   */
  export interface IHoseLine {
    /** The hose line's scene subject id. */
    prop: string;

    /** The member's role on the line. */
    role: Role;

    /** The hose's affordance this member grips. */
    grip: string;

    /** How far the team advances, metres; 0 when absent. */
    advance?: number;

    /** What the nozzle sweeps over; required for the nozzle operator. */
    target?: IAutoMovieMotionTarget;

    /** Side-to-side sweeps; 3 when absent. */
    sweeps?: number;
  }

  /**
   * Beating flames on a lying partner with a held cloth.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation A prop, a partner, a region and a count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `beatFlames.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each stroke lands on the named region.
   */
  export interface IBeatFlames {
    /** The held cloth's scene subject id. */
    prop: string;

    /** The lying partner. */
    partner: string;

    /** The partner's region the strokes land on. */
    region: AutoMovieHumanoidRegion;

    /** Strokes; 4 when absent. */
    count?: number;
  }

  /**
   * Stop, drop and roll from standing (NFPA, Steps to Safety): stop, drop to
   * prone with the hands over the face, then roll to the side and back.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation A count of rolls.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `stopDropRoll.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hands stay on the face through the roll.
   */
  export interface IStopDropRoll {
    /** Half-turn rolls, alternating sides; 4 when absent. */
    rolls?: number;
  }
}
