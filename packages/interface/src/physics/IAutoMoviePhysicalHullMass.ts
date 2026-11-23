import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Uniform convex-solid volume and centroidal inertia per unit mass in the
 * hull's local frame.
 */
export namespace IAutoMoviePhysicalHullMass {
  /**
   * Uniform-solid convex-hull mass properties before assigning material density
   * or mass.
   *
   * Volume is cubic metres; centerOfMass is in the input points' frame; inertia
   * is principal moment per unit mass in square metres, sorted ascending.
   * physicalHullMass allocates the result from hull tetrahedra and centroidal
   * principal axes; consumers multiply inertia by their chosen mass. The
   * producer rejects a hull spanning no volume. The quaternion maps principal
   * coordinates to the shape frame; these values do not include placement in
   * the world.
   */
  export type IResult = {
    /** Positive hull volume in cubic metres. */
    volume: number;

    /** Uniform-solid centroid in the input points' shape-local frame, metres. */
    centerOfMass: IAutoMovieVector3;

    /**
     * Centroidal principal moments per unit mass, square metres, with x <= y <=
     * z; multiply by mass for kg m².
     */
    inertia: IAutoMovieVector3;

    /**
     * Unit quaternion rotating the principal inertia frame into the input
     * points' frame.
     */
    inertiaRotation: IAutoMovieQuaternion;
  };
}
