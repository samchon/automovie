import { AutoMoviePrimitiveShape } from "@automovie/interface";

/**
 * Analytic solid volume of a primitive, in cubic meters.
 *
 * These are the true solid volumes (a cone is `1/3 π r² h`, a capsule is a
 * cylinder plus a full sphere), not the render tessellation's approximations.
 * The physics layer weighs real shapes. A `plane` is a degenerate solid and
 * contributes no volume.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-weight-cues Derives a physical weight cue from the authored primitive dimensions.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Supplies the solid-volume fact used by center-of-mass support reasoning.
 * @author Samchon
 */
export const primitiveVolume = (shape: AutoMoviePrimitiveShape): number => {
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
