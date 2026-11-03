import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";

/**
 * The lumbar region: the cut between the pelvis and the lower trunk.
 *
 * The lumbar spine is a hinge about the lumbar column, whose joint centre
 * stands on a section centroid of the trunk rather than a vertebral body. Its
 * skin turns with the loin between the iliac crests and the lower ribs, and
 * the plane's sectors read the trunk's own widest skin, so the flanks turn on
 * a longer ramp than the back and belly.
 */
export namespace AutoMovieHumanLumbarBinding {
  /** The region of the `spine` joint. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "lumbar",
    bones: /^spine$/,
  };
}
