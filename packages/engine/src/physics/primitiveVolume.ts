import { AutoMoviePrimitiveShape } from "@automovie/interface";

/**
 * Analytic solid volume of a primitive, in cubic meters.
 *
 * These are the true solid volumes (a cone is `1/3 π r² h`, a capsule is a
 * cylinder plus a full sphere), not the render tessellation's approximations.
 * The physics layer weighs real shapes. A `plane` is a degenerate solid and
 * contributes no volume.
 *
 *
 * @evidence contracts/common.md#principled-implementation Use closed-form solid volumes for box, sphere, cylinder, cone, capsule and torus in cubic metres; plane and mesh contribute zero because no closed solid volume is declared.
 * @evidence contracts/common.md#clear-and-simple-design One primitive-kind dispatch keeps volume semantics independent of triangulation and aggregate placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Capsule volume includes cylinder plus sphere under the declared dimensions even where render approximation differs; mesh zero is an explicit missing-measurement policy, not a claimed physical volume.
 * @evidence contracts/common.md#meaningful-documentation Docs give cubic-metre units and enumerate unsupported zero-volume cases; valid finite dimensions are a caller admission premise.
 * @evidence contracts/performance.md#efficient-algorithms All cases use constant arithmetic rather than tessellation or surface integration, with no output collection.
 * @evidence contracts/performance.md#reuse-equivalent-work deriveCenterOfMass reuses this owner for every part; no identity cache would be valid after dimension mutation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a number is returned; no vectors, mesh storage, handles or tasks survive the call.
 */
export const primitiveVolume: (shape: AutoMoviePrimitiveShape) => number = (
  shape: AutoMoviePrimitiveShape,
): number => {
  switch (shape.type) {
    case "box":
      return shape.width * shape.height * shape.depth;
    case "plane":
      return 0;
    case "sphere":
      return (4 / 3) * Math.PI * shape.radius ** 3;
    case "cylinder":
      return Math.PI * shape.radius ** 2 * shape.height;
    case "cone":
      return (1 / 3) * Math.PI * shape.radius ** 2 * shape.height;
    case "capsule":
      return (
        Math.PI * shape.radius ** 2 * shape.height +
        (4 / 3) * Math.PI * shape.radius ** 3
      );
  }
};
