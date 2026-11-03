import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * A style's own length profile over the scalp, before the lock variation and
 * the hairline's feather: `crop` even; `short` tapering to a third of the
 * input at the nape and sides and the whole length over the vertex (the
 * taper is a smoothstep of the root's height over 0.3 to 0.75 of the chart
 * radius); `bob` the input's length. These are the hair's physical lengths
 * ({@link physical}), which its stiffness reads; the arc a guide integrates
 * ({@link base}) is the same except for a bob, which integrates
 * {@link BOB_REACH} times its length so its strands reach their level cut
 * (`AutoMovieHumanHairCutLevel`) or the body wherever they are rooted. All
 * three profiles are conventions of the style definitions on
 * `IAutoMovieHumanScalpHair.length`.
 */
export namespace AutoMovieHumanHairStrandBase {
  /**
   * Arc a bob integrates over its physical length (convention: enough for
   * every root to reach the level cut or the body, which end it).
   */
  export const BOB_REACH: number = 1.6;

  /**
   * The physical length of one root's hair.
   *
   * @param style Haircut
   * @param length The input's longest hair, millimetres
   * @param u Unit root direction in the head chart's frame
   * @returns Hair length, millimetres
   */
  export function physical(
    style: AutoMovieHumanHairStyle,
    length: number,
    u: AutoMovieHumanSkinVector.Vec3,
  ): number {
    if (style !== AutoMovieHumanHairStyle.Short) return length;

    const top: number = AutoMovieHumanAppearanceNoise.smoothstep(
      0.3,
      0.75,
      u[1],
    );
    return length * (1 / 3 + (2 / 3) * top);
  }

  /**
   * The arc length one root's guide integrates.
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
    const hair: number = physical(style, length, u);
    return style === AutoMovieHumanHairStyle.Bob ? BOB_REACH * hair : hair;
  }
}
