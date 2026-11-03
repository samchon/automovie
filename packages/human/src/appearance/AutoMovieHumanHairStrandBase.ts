import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * A style's own length profile over the scalp, before the lock variation and
 * the hairline's feather: `crop` even; `short` tapering to a third of the
 * input at the nape and sides and the whole length over the vertex (the
 * taper is a smoothstep of the root's height over 0.3 to 0.75 of the chart
 * radius); `bob` integrated 1.6 times the input, to end at its level cut
 * (`AutoMovieHumanHairCutLevel`) or on the body. All three are conventions of
 * the style definitions on `IAutoMovieHumanScalpHair.length`.
 */
export namespace AutoMovieHumanHairStrandBase {
  /**
   * The base length of one root's strand.
   *
   * @param style Haircut
   * @param length The input's longest hair, millimetres
   * @param u Unit root direction in the head chart's frame
   * @returns Arc length to integrate, millimetres
   */
  export function base(
    style: AutoMovieHumanHairStyle,
    length: number,
    u: AutoMovieHumanSkinVector.Vec3,
  ): number {
    const top: number = AutoMovieHumanAppearanceNoise.smoothstep(
      0.3,
      0.75,
      u[1],
    );
    if (style === AutoMovieHumanHairStyle.Short)
      return length * (1 / 3 + (2 / 3) * top);
    if (style === AutoMovieHumanHairStyle.Bob) return length * 1.6;
    return length;
  }
}
