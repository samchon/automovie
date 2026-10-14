import { IAutoMovieTransform } from "@automovie/interface";

/**
 * Shared engine-test identity transform: zero metre translation, identity quaternion and unit scale. Existing callers borrow this mutable singleton; extraction preserves its original shared identity.
 */
export const IDENTITY_TRANSFORM: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
