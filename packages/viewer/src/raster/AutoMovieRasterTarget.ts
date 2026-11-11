/**
 * The colour and depth buffers one Node frame is drawn into, with the
 * primitive fills `rasterizeAutoMovieScene` needs: depth-tested triangles,
 * lines and points in screen pixels, and conversion to sRGB bytes.
 *
 * Colours are linear RGB floats, the working space three.js materials and
 * lights use; depth is normalized device depth in [-1, 1], smaller nearer.
 * Screen coordinates put pixel centres at half-integers from the top-left.
 *
 * A fill passes the depth test at a pixel when its depth, rounded to the
 * buffer's precision, is not farther than the stored one. Of two fills at one
 * depth the later one is therefore drawn, as under three.js's default depth
 * function, so a mark drawn along another replaces it on every pixel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the colour space, depth convention, pixel-centre convention and depth test every method relies on; each method states its inputs and effect.
 * @evidence contracts/development/design.md#principled-representation Linear float colour keeps lighting sums and supersample averaging exact before one sRGB conversion; a float depth buffer resolves visibility per pixel, and comparing at its own precision makes equal depths tie instead of falling either way by rounding.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The target owns its two buffers and the fills that write them; traversal, shading and encoding stay with their callers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No method knows a scene, material or film; every fill takes plain coordinates and a colour.
 */
export class AutoMovieRasterTarget {
  /** Linear RGB, three floats per pixel, row-major from the top-left. */
  public readonly color: Float32Array;

  /** Normalized device depth per pixel; `Infinity` where nothing was drawn. */
  public readonly depth: Float32Array;

  /** Width in pixels. */
  public readonly width: number;

  /** Height in pixels. */
  public readonly height: number;

  /**
   * Allocate a target filled with one background colour.
   *
   * @param width Width in pixels.
   * @param height Height in pixels.
   * @param background Linear RGB background.
   */
  public constructor(
    width: number,
    height: number,
    background: readonly [number, number, number],
  ) {
    this.width = width;
    this.height = height;
    this.color = new Float32Array(width * height * 3);
    this.depth = new Float32Array(width * height).fill(Infinity);
    for (let index: number = 0; index < width * height; index++)
      this.color.set(background, index * 3);
  }

  /**
   * Fill a screen triangle with one colour, depth-tested per pixel centre.
   *
   * `alpha` below one blends over the current colour; `write` false keeps the
   * depth buffer unchanged, as transparent surfaces do in the Viewer. A `ramp`
   * replaces `rgb` per pixel with the grey it returns for that pixel's
   * normalized device depth, which is how a depth pass stays exact across a
   * triangle larger than a pixel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the coverage rule, how alpha and depth writes behave and what a ramp replaces; the depth test is the class's own.
   * @evidence contracts/development/implementation.md#principled-implementation Barycentric edge functions normalized by the signed area cover pixel centres for either winding, and depth interpolates linearly in screen space because normalized device depth is affine there.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the clamped bounding box tests coverage, depth range and the buffer in that order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Degenerate triangles return without drawing instead of being nudged; depth outside the clip range is rejected rather than clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work is linear in the clamped bounding box area; edge coefficients are computed once per triangle.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Coefficients shared by every pixel are hoisted out of the loop.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One three-float scratch per call for ramped pixels; writes go into the target's existing buffers.
   */
  public triangle(
    x0: number,
    y0: number,
    z0: number,
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    rgb: readonly [number, number, number],
    alpha: number,
    write: boolean,
    ramp: ((depth: number) => number) | null = null,
  ): boolean {
    const area: number = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (!(Math.abs(area) > 1e-12)) return false;
    const minX: number = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    const maxX: number = Math.min(
      this.width - 1,
      Math.ceil(Math.max(x0, x1, x2)),
    );
    const minY: number = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const maxY: number = Math.min(
      this.height - 1,
      Math.ceil(Math.max(y0, y1, y2)),
    );
    if (minX > maxX || minY > maxY) return false;

    // Edge functions of the three sides, divided by the area so each weight
    // is the barycentric coordinate of the opposite vertex.
    const inverse: number = 1 / area;
    const a0: number = (y1 - y2) * inverse;
    const b0: number = (x2 - x1) * inverse;
    const a1: number = (y2 - y0) * inverse;
    const b1: number = (x0 - x2) * inverse;
    const a2: number = (y0 - y1) * inverse;
    const b2: number = (x1 - x0) * inverse;
    const grey: [number, number, number] = [0, 0, 0];
    let drawn: boolean = false;
    for (let y: number = minY; y <= maxY; y++) {
      const py: number = y + 0.5;
      for (let x: number = minX; x <= maxX; x++) {
        const px: number = x + 0.5;
        const w0: number = a0 * (px - x1) + b0 * (py - y1);
        if (w0 < 0) continue;
        const w1: number = a1 * (px - x2) + b1 * (py - y2);
        if (w1 < 0) continue;
        const w2: number = a2 * (px - x0) + b2 * (py - y0);
        if (w2 < 0) continue;
        const z: number = w0 * z0 + w1 * z1 + w2 * z2;
        if (z < -1 || z > 1) continue;
        const index: number = y * this.width + x;
        if (Math.fround(z) > this.depth[index]!) continue;
        if (write) this.depth[index] = z;
        if (ramp === null) this.blend(index, rgb, alpha);
        else {
          const level: number = ramp(z);
          grey[0] = level;
          grey[1] = level;
          grey[2] = level;
          this.blend(index, grey, alpha);
        }
        drawn = true;
      }
    }
    return drawn;
  }

  /**
   * Draw a line between two screen points, testing its depth unless `test` is
   * false. `width` is the stroke in target pixels, one when omitted, rounded
   * down to the nearest odd count so the stroke stays centred on the line.
   *
   * The line takes one pixel in every column it spans, or in every row when
   * it is steeper than a diagonal: the one it crosses at that column's centre,
   * with the depth it has there. Pixels and depths therefore follow from where
   * the line lies and not from the direction it is drawn in, so two strokes
   * along one segment meet the depth test with equal depths. A `ramp` replaces
   * `rgb` at each pixel with the grey it returns for the line's depth there, as
   * a triangle's does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the width and its rounding, which pixel each column or row takes, where its depth is read, the optional depth test and what a ramp replaces.
   * @evidence contracts/development/implementation.md#principled-implementation Sampling at pixel centres along the longer axis visits every column or row once, so the line has no gaps, and makes coverage and depth a function of the line's position alone; an end pixel whose centre lies beyond the segment takes the endpoint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop; per-pixel writes go through the shared point fill.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only columns or rows the stroke cannot reach the raster from are left out; the endpoints are never moved to the raster's border, which would change the slope.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the line's pixel length inside the raster, however far its ends lie outside.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the point fill for the depth test, the ramp and the write.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The line allocates nothing itself; a ramped line's point fills each allocate one grey triple that is released with the fill.
   */
  public line(
    x0: number,
    y0: number,
    z0: number,
    x1: number,
    y1: number,
    z1: number,
    rgb: readonly [number, number, number],
    test: boolean,
    width: number = 1,
    ramp: ((depth: number) => number) | null = null,
  ): void {
    const radius: number = Math.max(0, Math.floor((width - 1) / 2));
    const steep: boolean = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    const from: number = steep ? y0 : x0;
    const to: number = steep ? y1 : x1;
    const first: number = Math.max(-radius, Math.floor(Math.min(from, to)));
    const last: number = Math.min(
      (steep ? this.height : this.width) - 1 + radius,
      Math.floor(Math.max(from, to)),
    );
    for (let cell: number = first; cell <= last; cell++) {
      const t: number =
        to === from
          ? 0
          : Math.min(1, Math.max(0, (cell + 0.5 - from) / (to - from)));
      const across: number = steep ? x0 + (x1 - x0) * t : y0 + (y1 - y0) * t;
      this.point(
        steep ? across : cell + 0.5,
        steep ? cell + 0.5 : across,
        z0 + (z1 - z0) * t,
        radius,
        rgb,
        test,
        ramp,
      );
    }
  }

  /**
   * Fill the square of pixels within `radius` of a screen point at one depth.
   * With `test` on, each pixel takes the class's depth test and, when it
   * passes, stores the depth. A `ramp` replaces `rgb` with the grey it
   * returns for that depth.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the covered square, the depth behaviour and what a ramp replaces.
   * @evidence contracts/development/implementation.md#principled-implementation Each covered pixel takes the same depth test and write as a surface, so points and lines hide behind nearer surfaces.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One nested loop over the clamped square.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Depth outside the clip range is rejected, not clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work for the small radii used.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Lines call it per step instead of repeating the test.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A ramped point allocates one grey triple, released when the fill returns; an unramped one allocates nothing.
   */
  public point(
    x: number,
    y: number,
    z: number,
    radius: number,
    rgb: readonly [number, number, number],
    test: boolean,
    ramp: ((depth: number) => number) | null = null,
  ): void {
    if (z < -1 || z > 1) return;
    let paint: readonly [number, number, number] = rgb;
    if (ramp !== null) {
      const level: number = ramp(z);
      paint = [level, level, level];
    }
    const cx: number = Math.floor(x);
    const cy: number = Math.floor(y);
    for (let py: number = cy - radius; py <= cy + radius; py++) {
      if (py < 0 || py >= this.height) continue;
      for (let px: number = cx - radius; px <= cx + radius; px++) {
        if (px < 0 || px >= this.width) continue;
        const index: number = py * this.width + px;
        if (test && Math.fround(z) > this.depth[index]!) continue;
        if (test) this.depth[index] = z;
        this.blend(index, paint, 1);
      }
    }
  }

  /**
   * Convert to opaque sRGB bytes, averaging `factor` × `factor` blocks when
   * the target was drawn supersampled.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the transfer function, the block averaging and the output size.
   * @evidence contracts/development/implementation.md#principled-implementation Blocks average in linear light before the sRGB transfer, which is the order that keeps antialiased edges at the right brightness.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over output pixels, one over each block.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A size that the factor does not divide throws instead of cropping.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the target's pixel count; the transfer function is a 4096-entry table.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The transfer table is built once per process.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates only the returned bytes.
   */
  public toSrgb(factor: number): Uint8ClampedArray {
    if (this.width % factor !== 0 || this.height % factor !== 0)
      throw new Error(
        "Supersampled raster size is not a multiple of its factor",
      );
    const width: number = this.width / factor;
    const height: number = this.height / factor;
    const out: Uint8ClampedArray = new Uint8ClampedArray(width * height * 4);
    const table: Uint8ClampedArray = srgbTable();
    const samples: number = factor * factor;
    for (let y: number = 0; y < height; y++)
      for (let x: number = 0; x < width; x++) {
        let r: number = 0;
        let g: number = 0;
        let b: number = 0;
        for (let sy: number = 0; sy < factor; sy++)
          for (let sx: number = 0; sx < factor; sx++) {
            const source: number =
              ((y * factor + sy) * this.width + x * factor + sx) * 3;
            r += this.color[source]!;
            g += this.color[source + 1]!;
            b += this.color[source + 2]!;
          }
        const target: number = (y * width + x) * 4;
        out[target] = table[encode(r / samples)]!;
        out[target + 1] = table[encode(g / samples)]!;
        out[target + 2] = table[encode(b / samples)]!;
        out[target + 3] = 255;
      }
    return out;
  }

  /** Mix a colour over one pixel with the given opacity. */
  private blend(
    index: number,
    rgb: readonly [number, number, number],
    alpha: number,
  ): void {
    const offset: number = index * 3;
    if (alpha >= 1) {
      this.color[offset] = rgb[0];
      this.color[offset + 1] = rgb[1];
      this.color[offset + 2] = rgb[2];
      return;
    }
    const keep: number = 1 - alpha;
    this.color[offset] = this.color[offset]! * keep + rgb[0] * alpha;
    this.color[offset + 1] = this.color[offset + 1]! * keep + rgb[1] * alpha;
    this.color[offset + 2] = this.color[offset + 2]! * keep + rgb[2] * alpha;
  }
}

/** Table index of a linear value clamped to [0, 1]. */
function encode(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * (TABLE_SIZE - 1));
}

/** Entries of the linear-to-sRGB table. */
const TABLE_SIZE: number = 4096;

/** The lazily built linear-to-sRGB byte table. */
let table: Uint8ClampedArray | undefined;

/** The linear-to-sRGB byte table, built on first use. */
function srgbTable(): Uint8ClampedArray {
  if (table !== undefined) return table;
  table = new Uint8ClampedArray(TABLE_SIZE);
  for (let index: number = 0; index < TABLE_SIZE; index++) {
    const linear: number = index / (TABLE_SIZE - 1);
    const encoded: number =
      linear <= 0.0031308
        ? 12.92 * linear
        : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
    table[index] = Math.round(encoded * 255);
  }
  return table;
}
