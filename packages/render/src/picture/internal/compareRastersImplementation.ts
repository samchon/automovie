import type {
  IAutoMovieRasterComparison,
  IAutoMovieRasterImage,
} from "@automovie/interface";

/*
 * Compare two pictures of one size pixel by pixel, for reading what a
 * correction changed and what it left alone.
 *
 * A pixel is changed when its largest red, green or blue difference exceeds
 * `tolerance`, a byte count that is zero when omitted. The difference image
 * shows the newer picture as grey at half its luma, so the subject stays
 * recognizable, with every changed pixel in magenta.
 *
 * ```ts
 * const difference = AutoMovieRenderPicture.compareRasters(before, after);
 * if (difference.changed > 0) sheet.add(difference.image, "changed");
 * ```
 */
export function compareRastersImplementation(
  before: IAutoMovieRasterImage,
  after: IAutoMovieRasterImage,
  tolerance: number = 0,
): IAutoMovieRasterComparison {
  if (before.width !== after.width || before.height !== after.height)
    throw new Error(
      `Compared rasters differ in size: ${before.width}x${before.height} against ${after.width}x${after.height}`,
    );
  const count: number = after.width * after.height;
  if (before.pixels.length !== count * 4 || after.pixels.length !== count * 4)
    throw new Error("Raster pixels do not match its size");
  if (tolerance < 0)
    throw new Error("Comparison tolerance must be a non-negative number");

  const pixels: Uint8ClampedArray = new Uint8ClampedArray(count * 4);
  let changed: number = 0;
  let maximum: number = 0;
  let left: number = after.width;
  let top: number = after.height;
  let right: number = -1;
  let bottom: number = -1;
  for (let index: number = 0; index < count; index++) {
    const offset: number = index * 4;
    const r: number = after.pixels[offset]!;
    const g: number = after.pixels[offset + 1]!;
    const b: number = after.pixels[offset + 2]!;
    const delta: number = Math.max(
      Math.abs(r - before.pixels[offset]!),
      Math.abs(g - before.pixels[offset + 1]!),
      Math.abs(b - before.pixels[offset + 2]!),
    );
    maximum = Math.max(maximum, delta);
    pixels[offset + 3] = 255;

    // Unchanged: the newer picture, dimmed so the marks stand out.
    if (delta <= tolerance) {
      const grey: number = (0.2126 * r + 0.7152 * g + 0.0722 * b) * 0.5;
      pixels[offset] = grey;
      pixels[offset + 1] = grey;
      pixels[offset + 2] = grey;
      continue;
    }

    // Changed: magenta, and the box grows to hold it.
    pixels[offset] = 255;
    pixels[offset + 2] = 255;
    changed++;
    const x: number = index % after.width;
    const y: number = Math.floor(index / after.width);
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
  return {
    image: { width: after.width, height: after.height, pixels },
    changed,
    ratio: changed / count,
    maximum,
    bounds: changed === 0 ? null : { left, top, right, bottom },
  };
}
