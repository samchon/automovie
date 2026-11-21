import type { IAutoMovieTransform } from "@automovie/interface";

import type { Archetype, ArchetypeCourse, ArchetypeRide } from "../core";
import type { QuadrupedGait } from "./QuadrupedGait";
import type { createHorse } from "./createHorse";

/**
 * The hitch places, the authored team course, the per-horse draught states and the displayed samples of several harnessed horses put to one pole vehicle (`HorseTeam`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the hitch kinds, each horse's place, the course, the states and the sample.
 * @evidence contracts/development/design.md#principled-representation Closed unions for the hitch kinds, roles and stages; metres, seconds and course legs for the inputs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned beside `HorseTeam`, its only producer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Trace and breeching states are authored looks by role and stage, not simulated forces.
 */
export namespace HorseTeamPlan {
  /**
   * A team's hitch: two abreast on a pole; two in single file; two pairs; three pairs; four abreast, the inner pair on the pole.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each hitch's arrangement.
   * @evidence contracts/development/design.md#principled-representation A closed union the layout expands into places.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The teams the scene list and the issue name.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Hitch = "pair" | "tandem" | "fourInHand" | "sixUp" | "quadriga";

  /**
   * A horse's role: a wheeler, poled or shafted next to the vehicle, which brakes it through the pole and breeching; a leader, drawing by traces only, which cannot brake it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each role can do.
   * @evidence contracts/development/design.md#principled-representation A closed union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the states and the lines.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Role = "wheeler" | "leader";

  /**
   * The team's stage: drawing, or braking to the course's end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each stage.
   * @evidence contracts/development/design.md#principled-representation A closed union read off the team course's speed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carried by each sample.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Stage = "pull" | "brake";

  /**
   * One horse's place in the hitch: its role, its offset to the left of the pole's line and its distance ahead of the pole head along the path, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and sign of each offset.
   * @evidence contracts/development/design.md#principled-representation A role and two metre offsets in the team's path frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by the layout and read by every horse's course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPlace {
    /** The horse's role. */
    role: Role;
    /** Its root's offset to the left of the pole's line, metres. */
    lateral: number;
    /** Its root's distance ahead of the pole head along the path, metres; negative behind it. */
    ahead: number;
  }

  /**
   * The team take: the hitch, its spacing, the pole head's course and the authored states.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit.
   * @evidence contracts/development/design.md#principled-representation The pole head's legs, start and speeds, positive spacings and rates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `HorseTeam` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each horse's course is derived from this one, never authored apart, so the horses cannot drift out of their places.
   */
  export interface IParams {
    /** The hitch. */
    hitch: Hitch;
    /** Centre-to-centre spacing of horses abreast, metres. */
    spacing: number;
    /** Root-to-root distance between ranks, metres. */
    length: number;
    /** Where the pole head starts and its heading. */
    start: ArchetypeCourse.ICourse["start"];
    /** The pole head's legs: straights and turns, the first and last straight and longer than the farthest rank's offset. */
    legs: readonly ArchetypeCourse.Leg[];
    /** The team's speed on its straights, metres per second; also its start speed. */
    cruise: number;
    /** The rate every horse changes speed at, metres per second squared. */
    rate: number;
    /** The gait every horse keeps. */
    gait: QuadrupedGait.Gait;
    /** A wheeler's trace from its point of draft back to the vehicle's bar, metres along the vehicle. */
    trace: number;
    /** Whether the team brakes to a stop at the end; it ends at speed otherwise. */
    stop: boolean;
    /** A slack trace's sag, metres. */
    sag: number;
  }

  /**
   * One displayed second of the team.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's space.
   * @evidence contracts/development/design.md#principled-representation Each horse's ride sample in place order, the vehicle's model and placement, the laid spans and the per-horse breeching state.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by the team's sampler.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISample<VehicleId extends string, VehicleD extends string> {
    /** The stage. */
    stage: Stage;
    /** Each horse, in place order. */
    horses: readonly ArchetypeRide.ISample<
      createHorse.Affordance,
      createHorse.Dimension
    >[];
    /** Whether each horse's breeching holds the vehicle back, in place order. */
    breeching: readonly boolean[];
    /** The vehicle in its placement's model space. */
    vehicle: Archetype<VehicleId, VehicleD>;
    /** The vehicle's world placement. */
    placement: IAutoMovieTransform;
    /** Pole straps, traces and lead traces as laid; a slack trace sags. */
    lines: readonly ArchetypeRide.ILineState[];
  }

  /**
   * A team take sampled by film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the places, rides, braking second and sampler.
   * @evidence contracts/development/design.md#principled-representation The expanded places, every horse's own ride and a pure sampler.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `HorseTeam`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No playback state.
   */
  export interface ITeam<VehicleId extends string, VehicleD extends string> {
    /** The film second the team's course ends. */
    duration: number;
    /** The second braking begins; the duration when the team does not stop. */
    brake: number;
    /** Each horse's place, in the order of the horses given. */
    places: readonly IPlace[];
    /** Each horse's own ride. */
    rides: readonly ArchetypeRide.IRide<
      createHorse.Affordance,
      createHorse.Dimension
    >[];
    /**
     * The team at a film second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit and the fresh sample.
     * @evidence contracts/development/implementation.md#principled-implementation Each horse's own ride, the vehicle towed by the pole head, and spans laid between the actual collar parts and the vehicle's bars.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Read every ride and the vehicle, then lay the spans by role and stage.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every span end is a posed part or a vehicle-rigid point; nothing is cached.
     * @evidence contracts/development/implementation.md#efficient-algorithms One sample per horse and one vehicle sample.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the prepared rides and towing.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and retains nothing.
     */
    at: (seconds: number) => ISample<VehicleId, VehicleD>;
  }
}
