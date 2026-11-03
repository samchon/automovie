import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";
import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";
import { AutoMovieHumanLimbCapsule } from "./AutoMovieHumanLimbCapsule";

/**
 * The thumb's carpometacarpal region: the saddle joint at the trapezium and
 * the thumb's metacarpal, which carries the thenar eminence.
 *
 * The metacarpal's flesh is the thenar, not a digit's girth: a digit's girth
 * there left 7-fold stretches across the thenar at neutral. Its radius is the
 * skin's depth at the middle of the segment. The palm's capsule is its rival
 * as well as the other digits, since the thenar and the palm are one skin.
 */
export namespace AutoMovieHumanThumbCmcBinding {
  /** The region of the `ThumbMetacarpal` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "thumbCmc",
    bones: /ThumbMetacarpal$/,
    digit: true,
    radii: (
      input: IAutoMovieHumanBindingRegion.IRadiiInput,
    ): IAutoMovieHumanBindingRegion.IRadii => {
      const radius: number = AutoMovieHumanLimbCapsule.depth(
        [
          (input.from[0] + input.to[0]) / 2,
          (input.from[1] + input.to[1]) / 2,
          (input.from[2] + input.to[2]) / 2,
        ],
        input.skin,
      );
      return { radius, near: radius, far: radius };
    },
    rivals: (
      hand: IAutoMovieHumanBindingLimb,
    ): IAutoMovieHumanBindingLimb[] => [hand],
  };
}
