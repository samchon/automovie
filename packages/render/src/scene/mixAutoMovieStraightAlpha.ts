import { isAutoMovieDisplayBlendWeight } from "./isAutoMovieDisplayBlendWeight.js";

/**
 * Mix two straight-alpha RGBA byte pixels at a weight, as
 * `AutoMovieDisplayCompositor` mixes a dissolve or a fade, and return the
 * straight-alpha result in bytes.
 *
 * Each pixel's colour is first associated with its alpha (colour times alpha
 * over 255), the associated colours and the alphas are mixed with the same
 * weight, `(1 - weight) * outgoing + weight * incoming`, and the colour is
 * divided by the mixed alpha back into straight colour, 0 where the mixed alpha
 * is 0, each rounded to the nearest byte. Mixing straight colour instead lets a
 * transparent pixel's black pull down every half-covered edge, a dark fringe
 * when the layer is composited (Porter and Duff, "Compositing Digital Images",
 * 1984). Two opaque pixels mix exactly as straight colour does.
 *
 * With `incoming` null the mix is a fade toward a fully transparent pixel:
 * associated colour and alpha fall together, so the straight colour stays the
 * outgoing pixel's own and only its alpha falls.
 *
 * It throws for a weight outside `[0, 1]`.
 */
export function mixAutoMovieStraightAlpha(
  outgoing: readonly [number, number, number, number],
  incoming: readonly [number, number, number, number] | null,
  weight: number,
): [number, number, number, number] {
  if (!isAutoMovieDisplayBlendWeight(weight))
    throw new Error(`A mix weight of ${weight} is outside 0 to 1`);
  const second: readonly [number, number, number, number] = incoming ?? [
    0, 0, 0, 0,
  ];

  // Associated colour, mixed with alpha at one weight.
  const alpha: number = (1 - weight) * outgoing[3] + weight * second[3];
  const channel: (index: 0 | 1 | 2) => number = (index: 0 | 1 | 2): number => {
    if (alpha === 0) return 0;
    const associated: number =
      ((1 - weight) * outgoing[index] * outgoing[3] +
        weight * second[index] * second[3]) /
      255;
    return Math.min(255, Math.round((associated * 255) / alpha));
  };
  return [channel(0), channel(1), channel(2), Math.round(alpha)];
}
