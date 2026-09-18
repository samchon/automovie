import { AutoMoviePrimitiveShape, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Centroid of a primitive in its own local frame (meters).
 *
 * Only the cone is asymmetric along its axis: a solid cone's centroid sits a
 * quarter of its height from the base toward the apex. The engine tessellates a
 * cone with its wide base at `+Y` and apex at `-Y`, so that centroid is at
 * `+height/4`. Every other primitive is centered on its origin.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-weight-cues Locates each primitive's contribution to the center-of-mass proxy.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Supplies the local centroid used by support and load-transfer reasoning.
 * @author Samchon
 */
export const primitiveCentroid = (
  shape: AutoMoviePrimitiveShape,
): IAutoMovieVector3 => {
  if (shape.type === "cone") return { x: 0, y: shape.height / 4, z: 0 };
  return { x: 0, y: 0, z: 0 };
};
