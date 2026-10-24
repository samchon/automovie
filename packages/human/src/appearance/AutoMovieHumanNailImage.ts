import { encodeAutoMoviePng } from "@automovie/engine/render/encodeAutoMoviePng";
import type { IAutoMovieImage } from "@automovie/interface";

import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";

/** Shared nail colour and relief images; their outline also bounds the physical plate. */
export namespace AutoMovieHumanNailImage {
  /** Colour image identifier. */
  export const colorId: string = "human.nail.color";
  /** Normal image identifier. */
  export const normalId: string = "human.nail.normal";
  /** Image edge in pixels. */
  export const size: number = 256;

  /** Images of the first {@link generate} call. */
  let cache: IAutoMovieImage[] | null = null;

  /**
   * The shared nail images: sRGB colour with coverage alpha, and a normal map,
   * both with u across the nail and v from the cuticle (row 0) to the free
   * edge.
   *
   * Coverage is a rounded nail outline: a cuticle arc bowing toward the root
   * at the middle by a fifth of the length, lateral folds at 0.88 of the
   * half-width and a free edge rounded by a sixth of the length. Colour is a
   * pink bed, a faint whiter lunula in the proximal fifth, a slightly darker
   * cuticle band, a pinker onychodermal line and a cream free edge in the
   * distal tenth, with
   * longitudinal streaks of 2 percent. Height rises over the outer 12 percent
   * of the outline and carries very faint longitudinal ridges, so the plate
   * edge reads as rounded. All values are conventions.
   *
   * @returns Colour and normal images
   */
  export function generate(): IAutoMovieImage[] {
    if (cache !== null)
      return cache.map(
        (image: IAutoMovieImage): IAutoMovieImage => ({
          ...image,
        }),
      );
    const N: number = size;
    const noise: typeof AutoMovieHumanAppearanceNoise =
      AutoMovieHumanAppearanceNoise;
    const color: Uint8Array = new Uint8Array(N * N * 4);
    const height: Float64Array = new Float64Array(N * N);
    const px: number = 1 / N;
    for (let y: number = 0; y < N; ++y)
      for (let x: number = 0; x < N; ++x) {
        const u: number = (x + 0.5) / N;
        const v: number = (y + 0.5) / N;
        const across: number = Math.abs(2 * u - 1);
        const proximal: number = 0.04 + 0.2 * across * across;
        const free: number = 0.99 - 0.16 * across ** 2.5;

        // Signed distance inside the outline, in normalized units.
        const inside: number = Math.min(
          v - proximal,
          free - v,
          (0.88 - across) * 0.5,
        );
        const coverage: number = AutoMovieHumanAppearanceNoise.smoothstep(
          -px,
          px,
          inside,
        );
        const depth: number = (v - proximal) / Math.max(1e-6, free - proximal);

        // Bed, then lunula, cuticle band, onychodermal line and free edge.
        let c: [number, number, number] = [0.82, 0.47, 0.46];
        const lunula: number =
          1 -
          AutoMovieHumanAppearanceNoise.smoothstep(
            0.12,
            0.2,
            depth + 0.08 * across * across,
          );
        c = mix(c, [0.86, 0.72, 0.7], 0.6 * lunula);
        const cuticle: number =
          1 - AutoMovieHumanAppearanceNoise.smoothstep(0.0, 0.035, depth);
        c = mix(c, [0.7, 0.45, 0.43], 0.5 * cuticle);
        const edge: number = AutoMovieHumanAppearanceNoise.smoothstep(
          0.9,
          0.93,
          depth,
        );
        const line: number = Math.exp(-(((depth - 0.91) / 0.015) ** 2));
        c = mix(c, [0.96, 0.9, 0.84], edge);
        c = mix(c, [0.72, 0.42, 0.42], 0.35 * line);
        const streak: number =
          1 + 0.02 * (noise.periodic1(951, u * 48, 48) - 0.5);
        const at: number = (y * N + x) * 4;
        for (let k: number = 0; k < 3; ++k)
          color[at + k] = srgb(Math.min(1, c[k]! * streak));
        color[at + 3] = Math.round(255 * coverage);

        height[y * N + x] =
          0.012 *
            AutoMovieHumanAppearanceNoise.smoothstep(
              0,
              0.1,
              Math.max(0, inside),
            ) +
          0.0002 * noise.periodic1(952, u * 64, 64);
      }

    // Normal map from the height in normalized units over the nail width.
    const normal: Uint8Array = new Uint8Array(N * N * 3);
    for (let y: number = 0; y < N; ++y)
      for (let x: number = 0; x < N; ++x) {
        const dx: number =
          (height[y * N + Math.min(N - 1, x + 1)]! -
            height[y * N + Math.max(0, x - 1)]!) /
          (2 * px);
        const dy: number =
          (height[Math.min(N - 1, y + 1) * N + x]! -
            height[Math.max(0, y - 1) * N + x]!) /
          (2 * px);
        const length: number = Math.hypot(dx, dy, 1);
        const at: number = (y * N + x) * 3;
        normal[at] = Math.round(127.5 * (1 - dx / length));
        normal[at + 1] = Math.round(127.5 * (1 - dy / length));
        normal[at + 2] = Math.round(127.5 * (1 + 1 / length));
      }
    cache = [
      {
        id: colorId,
        mimeType: "image/png",
        data: encodeAutoMoviePng({
          width: N,
          height: N,
          channels: 4,
          pixels: color,
        }),
      },
      {
        id: normalId,
        mimeType: "image/png",
        data: encodeAutoMoviePng({
          width: N,
          height: N,
          channels: 3,
          pixels: normal,
        }),
      },
    ];
    return generate();
  }

  /**
   * Linear blend of two colours.
   *
   * @param a First colour
   * @param b Second colour
   * @param t Weight of the second, `[0, 1]`
   * @returns Blended colour
   */
  function mix(
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    t: number,
  ): [number, number, number] {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }

  /**
   * sRGB byte of a linear value (IEC 61966-2-1 transfer).
   *
   * @param linear Linear value in `[0, 1]`
   * @returns Encoded byte
   */
  function srgb(linear: number): number {
    const c: number = Math.min(1, Math.max(0, linear));
    const e: number =
      c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(255 * e);
  }
}
