import type { IAutoMovieTransform } from "@automovie/interface";

import type {
  AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
} from "../core";
import { type AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";

/**
 * The hitch places, the authored team course, the per-horse draught states and
 * the displayed samples of several harnessed horses put to one pole vehicle
 * (`AutoMovieArchetypeEquineTeam.create`).
 */
export namespace AutoMovieArchetypeEquineTeamPlan {
  /**
   * A team's hitch: two abreast on a pole; two in single file; two pairs; three
   * pairs; four abreast, the inner pair on the pole.
   */
  export type Hitch = "pair" | "tandem" | "fourInHand" | "sixUp" | "quadriga";

  /**
   * A horse's role: a wheeler, poled or shafted next to the vehicle, which
   * brakes it through the pole and breeching; a leader, drawing by traces only,
   * which cannot brake it.
   */
  export type Role = "wheeler" | "leader";

  /** The team's stage: drawing, or braking to the course's end. */
  export type Stage = "pull" | "brake";

  /**
   * One horse's place in the hitch: its role, its offset to the left of the
   * pole's line and its distance ahead of the pole head along the path,
   * metres.
   */
  export interface IPlace {
    /** The horse's role. */
    role: Role;
    /** Its root's offset to the left of the pole's line, metres. */
    lateral: number;
    /**
     * Its root's distance ahead of the pole head along the path, metres;
     * negative behind it.
     */
    ahead: number;
  }

  /**
   * The team take: the hitch, its spacing, the pole head's course and the
   * authored states.
   */
  export interface IParams {
    /** The hitch. */
    hitch: Hitch;
    /** Centre-to-centre spacing of horses abreast, metres. */
    spacing: number;
    /** Root-to-root distance between ranks, metres. */
    length: number;
    /** Where the pole head starts and its heading. */
    start: AutoMovieArchetypeCourse.ICourse["start"];
    /**
     * The pole head's legs: straights and turns, the first and last straight
     * and longer than the farthest rank's offset.
     */
    legs: readonly AutoMovieArchetypeCourse.Leg[];
    /**
     * The team's speed on its straights, metres per second; also its start
     * speed.
     */
    cruise: number;
    /** The rate every horse changes speed at, metres per second squared. */
    rate: number;
    /** The gait every horse keeps. */
    gait: AutoMovieArchetypeQuadrupedGait.Gait;
    /**
     * A wheeler's trace from its point of draft back to the vehicle's bar,
     * metres along the vehicle.
     */
    trace: number;
    /** Whether the team brakes to a stop at the end; it ends at speed otherwise. */
    stop: boolean;
    /** A slack trace's sag, metres. */
    sag: number;
  }

  /** One displayed second of the team. */
  export interface ISample<VehicleId extends string, VehicleD extends string> {
    /** The stage. */
    stage: Stage;
    /** Each horse, in place order. */
    horses: readonly AutoMovieArchetypeRide.ISample<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >[];
    /** Whether each horse's breeching holds the vehicle back, in place order. */
    breeching: readonly boolean[];
    /** The vehicle in its placement's model space. */
    vehicle: AutoMovieArchetype<VehicleId, VehicleD>;
    /** The vehicle's world placement. */
    placement: IAutoMovieTransform;
    /** Pole straps, traces and lead traces as laid; a slack trace sags. */
    lines: readonly AutoMovieArchetypeRide.ILineState[];
  }

  /** A team take sampled by film second. */
  export interface ITeam<VehicleId extends string, VehicleD extends string> {
    /** The film second the team's course ends. */
    duration: number;
    /** The second braking begins; the duration when the team does not stop. */
    brake: number;
    /** Each horse's place, in the order of the horses given. */
    places: readonly IPlace[];
    /** Each horse's own ride. */
    rides: readonly AutoMovieArchetypeRide.IRide<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >[];
    /**
     * The vehicle's towed ride, the moving support a driver, charioteer or
     * passenger rides.
     */
    vehicle: AutoMovieArchetypeRide.ITowedRide<VehicleId, VehicleD>;
    /** The team at a film second. */
    at: (seconds: number) => ISample<VehicleId, VehicleD>;
  }
}
