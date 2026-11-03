import { encodeAutoMoviePng } from "@automovie/engine/render/encodeAutoMoviePng";
import type { IAutoMovieImage } from "@automovie/interface";

import { AutoMovieHumanHairOcclusion } from "./AutoMovieHumanHairOcclusion";
import { AutoMovieHumanScalpCoverageDepth } from "./AutoMovieHumanScalpCoverageDepth";

/**
 * The scalp layer's coverage image: from the optical depth of each texel
 * (`AutoMovieHumanScalpCoverageDepth`) the alpha 1 - T * L, T the share of
 * scalp real hair lets through and L the share of the sky's light that the
 * scalp seen through it receives (`AutoMovieHumanHairOcclusion`), as an RGBA
 * PNG whose colour is white and whose alpha is the share of scalp the hair
 * hides or shades, the shade drawn in the layer's dark hair tone. The
 * image's id names its bytes (an FNV-1a hash of the pixels), since one shot
 * may hold several people and an id must name one image.
 */
export namespace AutoMovieHumanScalpCoverageImage {
  /**
   * Share of scalp the hair hides per texel, 1 - T.
   *
   * @param depth Optical depth per texel
   * @returns Alpha per texel
   */
  export function alpha(depth: Float64Array): Float64Array {
    const out: Float64Array = new Float64Array(depth.length);
    for (let i: number = 0; i < depth.length; ++i)
      out[i] =
        1 -
        AutoMovieHumanHairOcclusion.seen(depth[i]!) *
          AutoMovieHumanHairOcclusion.lit(depth[i]!);
    return out;
  }

  /**
   * Encode the alpha as the coverage image.
   *
   * @param alpha Alpha per texel, row-major by elevation then azimuth
   * @returns The image
   */
  export function image(alpha: Float64Array): IAutoMovieImage {
    const { WIDTH, HEIGHT } = AutoMovieHumanScalpCoverageDepth;
    const pixels: Uint8Array = new Uint8Array(WIDTH * HEIGHT * 4).fill(255);
    for (let i: number = 0; i < WIDTH * HEIGHT; ++i)
      pixels[i * 4 + 3] = Math.round(255 * alpha[i]!);
    return {
      id: `human.hair.scalp.coverage.${fnv(pixels)}`,
      mimeType: "image/png",
      data: encodeAutoMoviePng({
        width: WIDTH,
        height: HEIGHT,
        channels: 4,
        pixels,
      }),
    };
  }
}

/**
 * FNV-1a hash of bytes as eight hex digits.
 *
 * @param bytes Bytes
 * @returns Hex digest
 */
function fnv(bytes: Uint8Array): string {
  let h: number = 0x811c9dc5;
  for (let i: number = 0; i < bytes.length; ++i) {
    h ^= bytes[i]!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
