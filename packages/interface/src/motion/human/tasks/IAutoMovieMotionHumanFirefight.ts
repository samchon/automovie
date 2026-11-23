import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * Firefighting drills with coarse inert props.
 *
 * The extinguisher follows the PASS sequence (OSHA, Portable fire
 * extinguishers,
 * https://osha.gov/etools/evacuation-plans-procedures/emergency-standards/portable-extinguishers/use):
 * pull the pin, aim the nozzle low at the base of the fire, squeeze the lever
 * and sweep side to side. A hose team of a nozzle operator and a backup member
 * grip one hose line and advance; the operator opens the bail and sweeps. A
 * second person beats flames on a lying body with a held cloth.
 */
export namespace IAutoMovieMotionHumanFirefight {
  /** A hose team member's role. */
  export type Role = "nozzle" | "backup";

  /**
   * The extinguisher drill's parameters. The extinguisher declares `pin`,
   * `lever`, `nozzle` and a carrying `handle` affordance.
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
   * A hose team member's parameters. The hose declares a grip affordance per
   * member along its line, and its nozzle a `bail` articulation.
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

  /** Beating flames on a lying partner with a held cloth. */
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
   */
  export interface IStopDropRoll {
    /** Half-turn rolls, alternating sides; 4 when absent. */
    rolls?: number;
  }
}
