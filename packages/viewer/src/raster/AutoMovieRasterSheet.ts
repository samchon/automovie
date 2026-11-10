import type { IAutoMovieSceneRaster } from "./IAutoMovieSceneRaster.js";
import { stampAutoMovieRasterLabel } from "./stampAutoMovieRasterLabel.js";

/**
 * A contact sheet of Node-drawn frames, filled one frame at a time: each
 * frame is area-averaged into its cell in row-major order and captioned
 * after reduction, so the caption stays legible however small the cell is.
 *
 * Frames are reduced as they arrive, so a sheet never holds more than its own
 * pixels; the finished sheet is an ordinary raster for
 * `encodeAutoMovieRasterPng`.
 *
 * ```ts
 * const sheet = new AutoMovieRasterSheet(20, 5, 180, 320);
 * for (const [seconds, frame] of frames) sheet.add(frame, `${seconds}s`);
 * await writeFile("sheet.png", encodeAutoMovieRasterPng(sheet.finish()));
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the fill order, the reduction, when captions are drawn, the memory bound and how the result is encoded.
 * @evidence contracts/development/design.md#principled-representation The sheet is itself an IAutoMovieSceneRaster, so encoding and captioning reuse the frame path unchanged.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A constructor, `add` and `finish`; layout is fixed by the constructor.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing names a film or capture command; captions are caller text.
 */
export class AutoMovieRasterSheet {
  /** The sheet pixels, opaque RGBA. */
  private readonly sheet: IAutoMovieSceneRaster;

  /** Cells filled so far. */
  private count: number;

  /** Number of cells. */
  private readonly capacity: number;

  /** Cells per row. */
  private readonly columns: number;

  /** Cell width in pixels. */
  private readonly cellWidth: number;

  /** Cell height in pixels. */
  private readonly cellHeight: number;

  /**
   * Allocate an empty sheet.
   *
   * @param capacity Number of cells, a positive integer.
   * @param columns Cells per row, a positive integer.
   * @param cellWidth Cell width in pixels, a positive integer.
   * @param cellHeight Cell height in pixels, a positive integer.
   */
  public constructor(
    capacity: number,
    columns: number,
    cellWidth: number,
    cellHeight: number,
  ) {
    this.capacity = capacity;
    this.columns = columns;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    if (
      ![capacity, columns, cellWidth, cellHeight].every(
        (value: number): boolean => Number.isSafeInteger(value) && value > 0,
      )
    )
      throw new Error(
        "Sheet capacity, columns and cell size must be positive integers",
      );
    const used: number = Math.min(columns, capacity);
    const width: number = used * cellWidth;
    const height: number = Math.ceil(capacity / used) * cellHeight;
    if (width * height > 64_000_000)
      throw new Error("Sheet exceeds 64 megapixels");
    this.sheet = {
      width,
      height,
      pixels: new Uint8ClampedArray(width * height * 4),
      statistics: {
        meshes: 0,
        triangles: 0,
        lines: 0,
        points: 0,
        skipped: {},
        untextured: 0,
        approximated: 0,
      },
    };
    for (let offset: number = 3; offset < this.sheet.pixels.length; offset += 4)
      this.sheet.pixels[offset] = 255;
    this.count = 0;
  }

  /**
   * Reduce one frame into the next cell and caption it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the frame fills the next cell and receives the caption.
   * @evidence contracts/development/implementation.md#principled-implementation Each cell pixel averages the source pixels its footprint covers, so thin lines and small figures survive reduction instead of being skipped by point sampling.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the cell's pixels, then one caption.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A full sheet throws instead of overwriting a cell.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the source frame's pixel count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caption reuses the frame label stamp on a cell view of the sheet.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The frame is not retained.
   */
  public add(frame: IAutoMovieSceneRaster, caption: string): void {
    if (this.count >= this.capacity) throw new Error("The sheet is full");
    const left: number = (this.count % this.columns) * this.cellWidth;
    const top: number = Math.floor(this.count / this.columns) * this.cellHeight;
    const cell: IAutoMovieSceneRaster = {
      width: this.cellWidth,
      height: this.cellHeight,
      pixels: new Uint8ClampedArray(this.cellWidth * this.cellHeight * 4),
      statistics: this.sheet.statistics,
    };
    for (let y: number = 0; y < this.cellHeight; y++) {
      const y0: number = Math.floor((y * frame.height) / this.cellHeight);
      const y1: number = Math.max(
        y0 + 1,
        Math.floor(((y + 1) * frame.height) / this.cellHeight),
      );
      for (let x: number = 0; x < this.cellWidth; x++) {
        const x0: number = Math.floor((x * frame.width) / this.cellWidth);
        const x1: number = Math.max(
          x0 + 1,
          Math.floor(((x + 1) * frame.width) / this.cellWidth),
        );
        let r: number = 0;
        let g: number = 0;
        let b: number = 0;
        for (let sy: number = y0; sy < y1; sy++)
          for (let sx: number = x0; sx < x1; sx++) {
            const source: number = (sy * frame.width + sx) * 4;
            r += frame.pixels[source]!;
            g += frame.pixels[source + 1]!;
            b += frame.pixels[source + 2]!;
          }
        const n: number = (y1 - y0) * (x1 - x0);
        const target: number = (y * this.cellWidth + x) * 4;
        cell.pixels[target] = r / n;
        cell.pixels[target + 1] = g / n;
        cell.pixels[target + 2] = b / n;
        cell.pixels[target + 3] = 255;
      }
    }
    stampAutoMovieRasterLabel(
      cell,
      caption,
      Math.max(1, Math.round(this.cellHeight / 90)),
    );
    for (let y: number = 0; y < this.cellHeight; y++)
      this.sheet.pixels.set(
        cell.pixels.subarray(
          y * this.cellWidth * 4,
          (y + 1) * this.cellWidth * 4,
        ),
        ((top + y) * this.sheet.width + left) * 4,
      );
    this.count++;
  }

  /**
   * The sheet as filled so far; unfilled cells stay black.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the result holds and how unfilled cells look.
   * @evidence contracts/development/implementation.md#principled-implementation Returns the sheet raster itself, which every frame was reduced into.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A single return.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An empty sheet throws rather than producing a blank image.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work No copy is made.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned raster; the sheet keeps no other buffer.
   */
  public finish(): IAutoMovieSceneRaster {
    if (this.count === 0) throw new Error("The sheet has no frames");
    return this.sheet;
  }
}
