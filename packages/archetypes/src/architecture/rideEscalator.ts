import type {
  AutoMovieHumanSide,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../core";
import { createEscalator } from "./createEscalator";

/** A unit scale: the rides move rigid frames. */
const ONE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/** The identity rotation of a level tread. */
const LEVEL: IAutoMovieTransform["rotation"] = { x: 0, y: 0, z: 0, w: 1 };

/**
 * An escalator running at its rated speed in one direction, read on the ride's
 * clock: second 0 is when each named station holds its tread.
 *
 * Every tread moves along the step band (`createEscalator.station`) at the
 * rated speed and stays level. On the straight incline all treads move
 * together, so the inclined flight is one rigid frame translating along the
 * incline, which a climb on the moving steps reads. Each handrail moves at the
 * step band's speed, as EN 115-1 couples them, at the handrail height above the
 * tread under it.
 *
 * @param escalator The installed escalator.
 * @param placement Its world placement.
 * @param direction The running direction: `up` moves treads from the lower comb
 *   to the upper comb.
 * @returns The tread, flight and handrail frames on the ride's clock.
 */
export function rideEscalator(
  escalator: AutoMovieArchetype<
    createEscalator.Affordance,
    createEscalator.Dimension
  >,
  placement: IAutoMovieTransform,
  direction: rideEscalator.Direction,
): rideEscalator.IRide {
  const profile: createEscalator.IProfile = createEscalator.profile(escalator);
  const sign: number = direction === "up" ? 1 : -1;
  const at = (offset: IAutoMovieVector3): IAutoMovieTransform =>
    AutoMovieArchetypeFrame.compose(placement, {
      translation: offset,
      rotation: LEVEL,
      scale: ONE,
    });
  const along = (station: number, seconds: number): IAutoMovieVector3 =>
    createEscalator.station(profile, station + sign * profile.speed * seconds);
  return {
    profile,
    direction,
    tread: (station: number, seconds: number): IAutoMovieTransform =>
      at(along(station, seconds)),
    flight: (seconds: number): IAutoMovieTransform => {
      const travel: number = sign * profile.speed * seconds;
      return at({
        x: 0,
        y: travel * Math.sin(profile.angle),
        z: travel * Math.cos(profile.angle),
      });
    },
    handrail: (
      side: AutoMovieHumanSide,
      station: number,
      seconds: number,
    ): IAutoMovieTransform => {
      const under: IAutoMovieVector3 = along(station, seconds);
      return at({
        x: (side === "left" ? 1 : -1) * profile.rail,
        y: under.y + profile.handrail,
        z: under.z,
      });
    },
  };
}

/** The ride's direction, frames and the admitted climb on its moving flight. */
export namespace rideEscalator {
  /** The running direction. */
  export type Direction = "up" | "down";

  /** One running escalator's readers. */
  export interface IRide {
    /** The step band of the escalator. */
    profile: createEscalator.IProfile;

    /** The running direction. */
    direction: Direction;

    /**
     * The tread that holds `station` metres along the band at second 0, at a
     * ride second.
     *
     * @param station Metres along the band from the lower comb at second 0.
     * @param seconds Ride seconds.
     * @returns The level tread's top centre in the world.
     */
    tread(station: number, seconds: number): IAutoMovieTransform;

    /**
     * The straight inclined flight as one rigid frame, identity placement at
     * second 0.
     *
     * @param seconds Ride seconds.
     * @returns The flight's world frame.
     */
    flight(seconds: number): IAutoMovieTransform;

    /**
     * The handrail point above the tread at `station` at second 0.
     *
     * @param side The handrail's side of the band, facing `+Z`.
     * @param station Metres along the band at second 0.
     * @param seconds Ride seconds.
     * @returns The handrail point in the world.
     */
    handrail(
      side: AutoMovieHumanSide,
      station: number,
      seconds: number,
    ): IAutoMovieTransform;
  }

  /**
   * The moving flight a climb in `heading` reads, refused against the running
   * direction unless the author asks for it.
   *
   * @param ride The running escalator.
   * @param heading The climb's direction on the steps.
   * @param against Whether the author stages walking against the steps.
   * @returns The flight's world frame on the ride's clock.
   * @throws {AutoMovieArchetypeRefusal} When the climb runs against the steps
   *   and `against` is not set.
   */
  export function climb(
    ride: IRide,
    heading: Direction,
    against?: boolean,
  ): (seconds: number) => IAutoMovieTransform {
    if (heading !== ride.direction && against !== true)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "escalator",
        axis: "climb.heading",
        value: heading,
        feasible: { kind: "alternatives", values: [ride.direction] },
        reason: `the escalator runs ${ride.direction}`,
        fix: "climb with the steps, or state that the climb is against them",
      });
    return ride.flight;
  }
}
