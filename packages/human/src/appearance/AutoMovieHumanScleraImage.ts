import { encodeAutoMoviePng } from "@automovie/engine/render/encodeAutoMoviePng";
import type { IAutoMovieImage } from "@automovie/interface";

import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";

/**
 * Procedural conjunctival vessel image over the visible sclera, an sRGB
 * multiplier on the sclera's vertex-coloured base.
 *
 * Layout: u runs once around the gaze axis (the sclera's revolution angle,
 * 0 and 0.5 on the horizontal meridian), v from the limbus (0) back to the
 * sclera's hidden edge (1), matching the sclera UVs of
 * `AutoMovieHumanEyeball`. At 512 x 128 pixels over a globe of 12 mm
 * radius a pixel spans about 0.15 mm both ways, so the thinnest drawn
 * vessel (about 0.08 mm, half a pixel) is at the image's limit.
 *
 * Vessels: bulbar conjunctival vessels run from the fornices toward the
 * limbus, branch as they go, thin out and fade before reaching it, and are
 * most visible in the exposed horizontal (nasal and temporal) zones. Each
 * vessel here is a seeded walk from far back toward the limbus with a
 * meandering heading, a tapering width and fading opacity, spawning
 * thinner branches; walks start on either horizontal side within about 40
 * degrees of the meridian. Counts, widths and colour are conventions, not
 * measurements of vessel density. The image is shared by every person and
 * both eyes (the right eye mirrors it through its UV mapping).
 */
export namespace AutoMovieHumanScleraImage {
  /** Image id the sclera material cites. */
  export const id: string = "human.eye.sclera.vessels";

  /** Width in pixels, around the eye. */
  export const width: number = 512;

  /** Height in pixels, from limbus to the hidden edge. */
  export const height: number = 128;

  /**
   * Generate the vessel image.
   *
   * @returns RGB PNG image
   */
  export function generate(): IAutoMovieImage {
    const N: typeof AutoMovieHumanAppearanceNoise =
      AutoMovieHumanAppearanceNoise;

    // Vessel opacity per pixel, composited as the maximum of overlapping
    // vessels so crossings do not darken twice.
    const cover: Float64Array = new Float64Array(width * height);

    // Pending walks: [u px, v px, bias heading (radians, 0 = toward the
    // limbus), width px, opacity, seed].
    const pending: Array<[number, number, number, number, number, number]> = [];
    for (let k: number = 0; k < 34; ++k) {
      const side: number = N.hash(70, k) < 0.5 ? 0 : 0.5;
      const spread: number = (N.hash(71, k) - 0.5) * 0.22;
      pending.push([
        (side + spread) * width,
        (0.45 + 0.4 * N.hash(72, k)) * height,
        (N.hash(75, k) - 0.5) * 0.6,
        1.1 + 0.9 * N.hash(73, k),
        0.22 + 0.25 * N.hash(74, k),
        k * 97 + 1,
      ]);
    }

    while (pending.length !== 0) {
      const walk: [number, number, number, number, number, number] =
        pending.pop()!;
      let u: number = walk[0];
      let v: number = walk[1];
      const bias: number = walk[2];
      let size: number = walk[3];
      let opacity: number = walk[4];
      const seed: number = walk[5];
      for (
        let step: number = 0;
        step < 400 && v > 0.06 * height && size > 0.25;
        ++step
      ) {
        splat(cover, u, v, size, opacity);

        // Tortuosity: the heading wanders smoothly (period about 20 steps,
        // up to 0.6 rad) about the walk's own bias, so a vessel snakes but
        // keeps its course toward the limbus.
        const heading: number =
          bias + 1.2 * (N.periodic1(seed, step * 0.05, 4096) - 0.5);
        u += Math.sin(heading) * 0.8;
        v -= Math.cos(heading) * 0.8;

        // Taper and fade toward the limbus.
        size *= 0.993;
        opacity *= 0.991;

        // Occasional branch, thinner and diverging by 0.5 to 0.9 rad, its
        // course kept within 1.2 rad of the limbus direction.
        if (N.hash(seed, step) < 0.025 && size > 0.6)
          pending.push([
            u,
            v,
            Math.max(
              -1.2,
              Math.min(
                1.2,
                heading +
                  (N.hash(seed + 1, step) < 0.5 ? -1 : 1) *
                    (0.5 + 0.4 * N.hash(seed + 2, step)),
              ),
            ),
            size * 0.6,
            opacity * 0.8,
            seed * 31 + step,
          ]);
      }
    }

    // Composite a deep red vessel colour over white; the base sclera tint
    // comes from the vertex colours this image multiplies.
    const red: [number, number, number] = [176, 52, 50];
    const pixels: Uint8Array = new Uint8Array(width * height * 3);
    for (let i: number = 0; i < width * height; ++i) {
      const a: number = Math.min(1, cover[i]!);
      for (let c: number = 0; c < 3; ++c)
        pixels[i * 3 + c] = Math.round(255 + (red[c]! - 255) * a);
    }
    return {
      id,
      mimeType: "image/png",
      data: encodeAutoMoviePng({ width, height, channels: 3, pixels }),
    };
  }
}

/**
 * Draw one soft disc of a vessel, wrapping around in u.
 *
 * @param cover Opacity buffer
 * @param u Centre column in pixels
 * @param v Centre row in pixels
 * @param size Vessel width in pixels
 * @param opacity Peak opacity
 */
function splat(
  cover: Float64Array,
  u: number,
  v: number,
  size: number,
  opacity: number,
): void {
  const w: number = AutoMovieHumanScleraImage.width;
  const h: number = AutoMovieHumanScleraImage.height;
  const r: number = size / 2;
  for (let y: number = Math.floor(v - r - 1); y <= Math.ceil(v + r + 1); ++y) {
    if (y < 0 || y >= h) continue;
    for (
      let x: number = Math.floor(u - r - 1);
      x <= Math.ceil(u + r + 1);
      ++x
    ) {
      const d: number = Math.hypot(x + 0.5 - u, y + 0.5 - v);

      // Sub-pixel vessels keep their area: coverage scales with width when
      // the width is under a pixel.
      const edge: number =
        1 -
        AutoMovieHumanAppearanceNoise.smoothstep(
          Math.max(r - 0.5, 0),
          r + 0.6,
          d,
        );
      const a: number = opacity * edge * Math.min(1, size);
      const at: number = y * w + (((x % w) + w) % w);
      if (a > cover[at]!) cover[at] = a;
    }
  }
}
