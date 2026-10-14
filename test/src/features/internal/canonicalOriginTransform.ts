import type { IAutoMovieTransform } from "@automovie/interface";

/** The identity placement every fixture element is staged at.
 *
 * Create a fresh identity transform for authored envelope elements. Zero translation, quaternion (0,0,0,1) and unit scale are the declared identity rather than a product-derived placement; constructing this fixture alone is not behavior proof.
 *
 * Consumers own assertions and change placement or hierarchy beside this baseline; this builder validates no transform and supplies no transformed-output expectation. This synchronous portable declaration is reached through explicit imports or the compatibility barrel, registers no dynamic case, installs no consumer and starts no process, browser, native artifact build or GPU.
 */
export const canonicalOriginTransform: () => IAutoMovieTransform =
  (): IAutoMovieTransform => ({
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });
