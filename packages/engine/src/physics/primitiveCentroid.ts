import {
  AutoMoviePrimitiveShape,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Centroid of a primitive in its own local frame (meters).
 *
 * Only the cone is asymmetric along its axis: a solid cone's centroid sits a
 * quarter of its height from the base toward the apex. The engine tessellates a
 * cone with its wide base at `+Y` and apex at `-Y`, so that centroid is at
 * `+height/4`. Every other primitive is centered on its origin.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Use symmetry for centered primitives and the solid cone centroid at +height/4 for the declared cone whose broad base is +Y; mesh positions and articulated placement are outside this primitive-local formula.
 * @evidence contracts/common.md#clear-and-simple-design The primitive-kind switch owns local centroids; aggregate TRS and mass weighting remain in deriveCenterOfMass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cone orientation follows tessellateCone's top-radius base, not a fixture convention; no measured result is substituted for a formula.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies local metre coordinates, symmetric zero centers and the cone orientation that determines the centroid sign.
 * @evidence contracts/performance.md#efficient-algorithms Each closed primitive case requires O(1) arithmetic and a fresh vector, with no vertex scan.
 * @evidence contracts/performance.md#reuse-equivalent-work deriveCenterOfMass shares these canonical formulas; values are recomputed from the current primitive dimensions rather than cached by mutable identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the fixed-size returned vector escapes; there is no geometry retention or resource acquisition.
 */
export const primitiveCentroid: (
  shape: AutoMoviePrimitiveShape,
) => IAutoMovieVector3 = (
  shape: AutoMoviePrimitiveShape,
): IAutoMovieVector3 => {
  if (shape.type === "cone") return { x: 0, y: shape.height / 4, z: 0 };
  return { x: 0, y: 0, z: 0 };
};
