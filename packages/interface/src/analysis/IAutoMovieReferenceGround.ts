import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The reference ground as one plane.
 *
 * A ray that leaves a sample below this plane sees ground, not sky. The plane
 * is the datum an analysis measures the horizon against, and deliberately not a
 * terrain: landscape, roads and natural water are outside the building scope.
 *
 * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-geometry-trace Exposes `IAutoMovieReferenceGround` as the portable data boundary for the lighting environment geometry trace requirement.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Types `IAutoMovieReferenceGround` for the clv environment image spatial variation system contract.
 */
export interface IAutoMovieReferenceGround {
  /**
   * World direction pointing from the ground into the sky; non-zero.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-geometry-trace Exposes `up` as the portable data boundary for the lighting environment geometry trace requirement.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Types `up` for the clv environment image spatial variation system contract.
   */
  up: IAutoMovieVector3;

  /**
   * Plane constant in metres, read as `dot(normalize(up), point) = elevation`.
   * A point is above ground when its projection exceeds this value.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-geometry-trace Exposes `elevation` as the portable data boundary for the lighting environment geometry trace requirement.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Types `elevation` for the clv environment image spatial variation system contract.
   */
  elevation: number;
}
