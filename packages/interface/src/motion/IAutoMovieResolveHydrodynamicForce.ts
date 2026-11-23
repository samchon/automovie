import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Data and callback contracts shared by the ResolveHydrodynamicForce
 * operations.
 */
export namespace IAutoMovieResolveHydrodynamicForce {
  /** One segment in the water. */
  export interface IProps {
    /** The segment's volume, m³ (`volume`). */
    volume: number;

    /** Its centre, world metres. */
    centre: IAutoMovieVector3;

    /** Its centre's velocity relative to the water, m/s. */
    velocity: IAutoMovieVector3;

    /** The water plane's height, world metres. */
    surface: number;

    /** The water's density, kg/m³; `WATER` when absent. */
    density?: number;

    /** Gravitational acceleration, m/s²; standard when absent. */
    gravity?: number;
  }

  /** The water's forces on a segment. */
  export interface IForce {
    /** The volume under the plane, m³. */
    submerged: number;

    /** The buoyant force, world newtons. */
    buoyancy: IAutoMovieVector3;

    /** The drag, world newtons. */
    drag: IAutoMovieVector3;
  }
}
