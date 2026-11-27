import type {
  IAutoMoviePhysicalSegment,
  IAutoMovieResolveHydrodynamicForce,
} from "@automovie/interface";

import { ResolveHydrodynamicForceImplementation } from "./internal/ResolveHydrodynamicForceImplementation";

/** Public hydrodynamic operations for Engine Motion. */
export namespace AutoMovieEngineMotionHydrodynamics {
  /** Fresh water density near its maximum at 4 °C, kg/m³. */
  export const WATER: number = ResolveHydrodynamicForceImplementation.WATER;

  /** Textbook drag coefficient of a sphere at subcritical Reynolds numbers. */
  export const DRAG: number = ResolveHydrodynamicForceImplementation.DRAG;

  /**
   * Resolve buoyancy, drag and submerged volume for a body segment.
   *
   * @param props The segment's volume, centre and velocity, water plane and
   *   density.
   * @returns The buoyant force, drag and submerged volume.
   * @throws {Error} When volume or density is not positive.
   */
  export function resolve(
    props: IAutoMovieResolveHydrodynamicForce.IProps,
  ): IAutoMovieResolveHydrodynamicForce.IForce {
    return ResolveHydrodynamicForceImplementation.resolveHydrodynamicForce(
      props,
    );
  }

  /**
   * Sum a segment's collider volumes in closed form.
   *
   * @param segment The profile's segment.
   * @returns Cubic metres.
   */
  export function volume(segment: IAutoMoviePhysicalSegment): number {
    return ResolveHydrodynamicForceImplementation.volume(segment);
  }
}
