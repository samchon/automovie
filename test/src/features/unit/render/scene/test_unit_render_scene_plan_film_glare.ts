import { planAutoMovieFilmGlare } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * The glare plan realizes the contract's lens kernel: at a 1280 × 720 frame,
 * one bright pixel keeps its expected centre value and the frame keeps its
 * energy once the plan's pyramid, taps and bilinear read back are applied.
 *
 * Scenarios:
 *
 * 1. Every kernel's taps sum, centre plus twice the rest, to one.
 * 2. A single pixel of 1000 at the frame centre, with `glare: { strength: 0.1 }`,
 *    reads 904.7 ± 5 at its centre: 0.9 × 1000 plus 0.1 × 1000 × 0.0470, the
 *    kernels' combined continuous centre weight; the spread's own centre lies
 *    within 5 % of 0.0470.
 * 3. The frame's summed energy stays 1000 within 0.5 %.
 * 4. A taller frame blurs its widest kernel deeper in the pyramid, and every
 *    kernel keeps at most 12 taps a side besides its centre, since the chosen
 *    level leaves a deviation below four level pixels, so the cost per level
 *    pixel stays bounded whatever the raster.
 */
export function test_unit_render_scene_plan_film_glare(): void {
  const kernels: planAutoMovieFilmGlare.IKernel[] = planAutoMovieFilmGlare(720);

  // 1. Normalized taps.
  TestValidator.predicate(
    "taps sum to one",
    kernels.every(
      (kernel: planAutoMovieFilmGlare.IKernel): boolean =>
        Math.abs(
          kernel.weights.reduce(
            (sum: number, value: number): number => sum + 2 * value,
            0,
          ) -
            kernel.weights[0]! -
            1,
        ) <= 1e-12,
    ),
  );

  // 2. The centre of one bright pixel.
  const spread: number = kernels.reduce(
    (sum: number, kernel: planAutoMovieFilmGlare.IKernel): number =>
      sum +
      kernel.weight *
        response(kernel, 1280, 640)[640]! *
        response(kernel, 720, 360)[360]!,
    0,
  );
  const continuous: number =
    0.6 / (2 * Math.PI * 1.44 ** 2) +
    0.3 / (2 * Math.PI * 7.2 ** 2) +
    0.1 / (2 * Math.PI * 36 ** 2);
  const centre: number = 0.9 * 1000 + 0.1 * 1000 * spread;
  TestValidator.predicate(
    "the centre reads 904.7 ± 5 and the spread's centre is the kernel's",
    Math.abs(centre - 904.7) <= 5 &&
      Math.abs(spread - continuous) <= 0.05 * continuous,
  );

  // 3. Energy.
  const energy: number =
    0.9 * 1000 +
    0.1 *
      1000 *
      kernels.reduce(
        (sum: number, kernel: planAutoMovieFilmGlare.IKernel): number =>
          sum +
          kernel.weight *
            total(response(kernel, 1280, 640)) *
            total(response(kernel, 720, 360)),
        0,
      );
  TestValidator.predicate(
    "the frame keeps its energy",
    Math.abs(energy - 1000) <= 5,
  );

  // 4. A taller frame goes deeper, not wider.
  const tall: planAutoMovieFilmGlare.IKernel = planAutoMovieFilmGlare(2160)[2]!;
  TestValidator.predicate(
    "a taller frame blurs deeper with no more taps",
    tall.level > kernels[2]!.level &&
      [tall, ...kernels].every(
        (kernel: planAutoMovieFilmGlare.IKernel): boolean =>
          kernel.weights.length <= 13,
      ),
  );
}

/**
 * One axis of a kernel's response to a unit impulse at `at` on a line of `size`
 * pixels, as the GPU passes compute it: averaged into level pixels of width
 * `2^level`, blurred by the taps, then read back at each full-resolution pixel
 * centre by linear interpolation between level pixel centres.
 */
function response(
  kernel: planAutoMovieFilmGlare.IKernel,
  size: number,
  at: number,
): number[] {
  const step: number = 2 ** kernel.level;
  const cells: number = Math.ceil(size / step);
  const level: number[] = new Array<number>(cells).fill(0);
  level[Math.floor(at / step)] = 1 / step;
  const blurred: number[] = level.map((_: number, index: number): number =>
    kernel.weights.reduce(
      (sum: number, weight: number, offset: number): number =>
        offset === 0
          ? sum + weight * level[index]!
          : sum +
            weight *
              ((level[index + offset] ?? 0) + (level[index - offset] ?? 0)),
      0,
    ),
  );
  return Array.from({ length: size }, (_: unknown, pixel: number): number => {
    const u: number = (pixel + 0.5) / step - 0.5;
    const low: number = Math.max(0, Math.floor(u));
    const high: number = Math.min(cells - 1, low + 1);
    const t: number = Math.min(1, Math.max(0, u - low));
    return (1 - t) * blurred[low]! + t * blurred[high]!;
  });
}

/** The sum of a line. */
function total(line: readonly number[]): number {
  return line.reduce((sum: number, value: number): number => sum + value, 0);
}
