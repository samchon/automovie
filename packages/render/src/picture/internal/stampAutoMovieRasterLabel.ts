import type {
  IAutoMovieRasterImage,
  IAutoMovieRasterPoint,
} from "@automovie/interface";

/*
 * Burn a short caption, such as a film second or a mark's label, into a
 * picture, white on a dark box, so a thumbnail on a contact sheet still says
 * which moment it shows and a mark says what it is.
 *
 * The box's top-left corner goes at `at`, the picture's top-left corner when
 * omitted, moved left and up as far as needed to keep the box inside the
 * picture. The built-in 3 × 5 pixel font covers digits, `.`, `:`, `-`, `/`,
 * space and lower-case `a`–`z`; other characters draw as blanks. `scale`
 * enlarges each font pixel to a square of that many pixels.
 */
export function stampAutoMovieRasterLabel(
  raster: IAutoMovieRasterImage,
  text: string,
  scale: number,
  at: IAutoMovieRasterPoint = { x: 0, y: 0 },
): void {
  if (scale <= 0) throw new Error("Label scale must be a positive integer");
  const pad: number = scale * 2;
  const boxWidth: number = Math.min(
    raster.width,
    pad * 2 + text.length * 4 * scale - scale,
  );
  const boxHeight: number = Math.min(raster.height, pad * 2 + 5 * scale);

  // The box starts at the anchor, moved back inside the picture where it would leave it.
  const left: number = Math.max(
    0,
    Math.min(Math.round(at.x), raster.width - boxWidth),
  );
  const top: number = Math.max(
    0,
    Math.min(Math.round(at.y), raster.height - boxHeight),
  );
  fill(raster, left, top, boxWidth, boxHeight, [16, 16, 16]);
  for (const [n, character] of [...text.toLowerCase()].entries()) {
    const rows: readonly number[] = GLYPHS[character] ?? [0, 0, 0, 0, 0];
    for (let row: number = 0; row < 5; row++)
      for (let column: number = 0; column < 3; column++)
        if ((rows[row]! >> (2 - column)) & 1)
          fill(
            raster,
            left + pad + (n * 4 + column) * scale,
            top + pad + row * scale,
            scale,
            scale,
            [255, 255, 255],
          );
  }
}

/*
 * Fill a clamped rectangle of the frame with one opaque colour.
 */
function fill(
  raster: IAutoMovieRasterImage,
  x: number,
  y: number,
  width: number,
  height: number,
  rgb: readonly [number, number, number],
): void {
  for (
    let py: number = Math.max(0, y);
    py < Math.min(raster.height, y + height);
    py++
  )
    for (
      let px: number = Math.max(0, x);
      px < Math.min(raster.width, x + width);
      px++
    ) {
      const offset: number = (py * raster.width + px) * 4;
      raster.pixels[offset] = rgb[0];
      raster.pixels[offset + 1] = rgb[1];
      raster.pixels[offset + 2] = rgb[2];
      raster.pixels[offset + 3] = 255;
    }
}

/*
 * 3 × 5 glyphs, one 3-bit row each, most significant bit on the left.
 */
const GLYPHS: Readonly<Record<string, readonly number[]>> = {
  "0": [7, 5, 5, 5, 7],
  "1": [2, 6, 2, 2, 7],
  "2": [7, 1, 7, 4, 7],
  "3": [7, 1, 7, 1, 7],
  "4": [5, 5, 7, 1, 1],
  "5": [7, 4, 7, 1, 7],
  "6": [7, 4, 7, 5, 7],
  "7": [7, 1, 1, 2, 2],
  "8": [7, 5, 7, 5, 7],
  "9": [7, 5, 7, 1, 7],
  ".": [0, 0, 0, 0, 2],
  ":": [0, 2, 0, 2, 0],
  "-": [0, 0, 7, 0, 0],
  "/": [1, 1, 2, 4, 4],
  " ": [0, 0, 0, 0, 0],
  a: [2, 5, 7, 5, 5],
  b: [6, 5, 6, 5, 6],
  c: [3, 4, 4, 4, 3],
  d: [6, 5, 5, 5, 6],
  e: [7, 4, 6, 4, 7],
  f: [7, 4, 6, 4, 4],
  g: [3, 4, 5, 5, 3],
  h: [5, 5, 7, 5, 5],
  i: [7, 2, 2, 2, 7],
  j: [1, 1, 1, 5, 2],
  k: [5, 5, 6, 5, 5],
  l: [4, 4, 4, 4, 7],
  m: [5, 7, 7, 5, 5],
  n: [6, 5, 5, 5, 5],
  o: [2, 5, 5, 5, 2],
  p: [6, 5, 6, 4, 4],
  q: [2, 5, 5, 6, 3],
  r: [6, 5, 6, 5, 5],
  s: [3, 4, 2, 1, 6],
  t: [7, 2, 2, 2, 2],
  u: [5, 5, 5, 5, 7],
  v: [5, 5, 5, 5, 2],
  w: [5, 5, 7, 7, 5],
  x: [5, 5, 2, 5, 5],
  y: [5, 5, 2, 2, 2],
  z: [7, 1, 2, 4, 7],
};
