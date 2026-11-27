import type {
  AutoMovieHumanSide,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../../core";
import type { AutoMovieArchetypeEscalator } from "../AutoMovieArchetypeEscalator";
/** A unit scale: the rides move rigid frames. */
const ONE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };
/** The identity rotation of a level tread. */
const LEVEL: IAutoMovieTransform["rotation"] = { x: 0, y: 0, z: 0, w: 1 };
/**
 * An escalator running at its rated speed in one direction, read on the ride's
 * clock: second 0 is when each named station holds its tread.
 *
 * Every tread moves along the step band (`AutoMovieArchetypeEscalator.station`) at the
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
export function rideEscalatorImplementation(
  escalator: AutoMovieArchetype<
    AutoMovieArchetypeEscalator.Affordance,
    AutoMovieArchetypeEscalator.Dimension
  >,
  placement: IAutoMovieTransform,
  direction: AutoMovieArchetypeEscalator.RideDirection,
  profileOf: (
    escalator: Pick<
      AutoMovieArchetype<
        AutoMovieArchetypeEscalator.Affordance,
        AutoMovieArchetypeEscalator.Dimension
      >,
      "dimensions"
    >,
  ) => AutoMovieArchetypeEscalator.IProfile,
  stationAt: (
    band: AutoMovieArchetypeEscalator.IProfile,
    station: number,
  ) => IAutoMovieVector3,
): AutoMovieArchetypeEscalator.IRideResult {
  const profile: AutoMovieArchetypeEscalator.IProfile =
    profileOf(escalator);
  const sign: number = direction === "up" ? 1 : -1;
  const at = (offset: IAutoMovieVector3): IAutoMovieTransform =>
    AutoMovieArchetypeFrame.compose(placement, {
      translation: offset,
      rotation: LEVEL,
      scale: ONE,
    });
  const along = (station: number, seconds: number): IAutoMovieVector3 =>
    stationAt(
      profile,
      station + sign * profile.speed * seconds,
    );
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
