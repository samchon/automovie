import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";

/**
 * The knee region: the hinge between the femur and the tibia.
 *
 * The knee flexes through 140 degrees about the condyles, stretching the skin
 * over the patella in front and folding the popliteal skin behind. The joint
 * line lies above the patella's apex in extension (Gray 1918); the ramp's
 * sectors read the front and the back separately.
 */
export namespace AutoMovieHumanKneeBinding {
  /** The region of the `LowerLeg` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "knee",
    bones: /LowerLeg$/,
  };
}
