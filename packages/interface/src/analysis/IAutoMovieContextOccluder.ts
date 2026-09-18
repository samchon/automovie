import { IAutoMovieHalfSpacePlane } from "../architecture/IAutoMovieHalfSpacePlane";

/**
 * One neighbouring mass, as the intersection of its half-spaces.
 *
 * A convex mass is all a shading study needs and all this record allows. It is
 * a blocker, so it carries no material, no interior and no ownership: a
 * neighbour that could carry those would be a second building this work does
 * not own.
 *
 * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-geometry-trace Exposes `IAutoMovieContextOccluder` as the portable data boundary for the lighting environment geometry trace requirement.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Types `IAutoMovieContextOccluder` for the clv environment image spatial variation system contract.
 */
export interface IAutoMovieContextOccluder {
  /**
   * Stable occluder identity within the context.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-geometry-trace Exposes `id` as the portable data boundary for the lighting environment geometry trace requirement.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Types `id` for the clv environment image spatial variation system contract.
   */
  id: string;

  /**
   * Open semantic label such as `neighbour-tower` or `boundary-wall`.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-geometry-trace Exposes `kind` as the portable data boundary for the lighting environment geometry trace requirement.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Types `kind` for the clv environment image spatial variation system contract.
   */
  kind: string;

  /**
   * Half-spaces whose intersection is the mass; at least four, since fewer
   * cannot bound a solid in three dimensions.
   *
   * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-geometry-trace Exposes `planes` as the portable data boundary for the lighting environment geometry trace requirement.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-image-spatial-variation Types `planes` for the clv environment image spatial variation system contract.
   */
  planes: IAutoMovieHalfSpacePlane[];
}
