import type { IAutoMovieRasterImage } from "./IAutoMovieRasterImage.js";
import { stampAutoMovieRasterLabel } from "./stampAutoMovieRasterLabel.js";

/**
 * A contact sheet of pictures, filled one picture at a time: each picture is
 * reduced into its cell in row-major order and captioned after reduction, so
 * the caption stays legible however small the cell is. Reduction averages
 * every source pixel a cell pixel covers (`area`, the default), or copies the
 * source pixel at the cell pixel's centre (`nearest`), which keeps exact
 * colours for a review that reads pixel values.
 *
 * A cell takes any picture, a drawn frame, a difference image or a decoded
 * still alike. Pictures are reduced as they arrive, so a sheet never holds
 * more than its own pixels; the finished sheet is an ordinary picture for
 * `encodeAutoMovieRasterPng`, cut to the cells that were filled.
 *
 * ```ts
 * const sheet = new AutoMovieRasterSheet(20, 5, 180, 320);
 * for (const [seconds, frame] of frames) sheet.add(frame, `${seconds}s`);
 * await writeFile("sheet.png", await encodeAutoMovieRasterPng(sheet.finish()));
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the fill order, both reductions and what each keeps, when captions are drawn, the memory bound, the extent of the result and how it is encoded.
 * @evidence contracts/development/design.md#principled-representation The sheet is itself an IAutoMovieRasterImage, so encoding and captioning reuse the frame path unchanged.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A constructor, `add` and `finish`; layout is fixed by the constructor.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing names a film or capture command; captions are caller text.
 */
export class AutoMovieRasterSheet {
  /** The sheet pixels, opaque RGBA. */
  private readonly sheet: IAutoMovieRasterImage;

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

  /** How a picture is reduced into its cell. */
  private readonly reduction: "area" | "nearest";

  /**
   * Allocate an empty sheet.
   *
   * @param capacity Number of cells, a positive integer.
   * @param columns Cells per row, a positive integer.
   * @param cellWidth Cell width in pixels, a positive integer.
   * @param cellHeight Cell height in pixels, a positive integer.
   * @param reduction `area` to average the pixels a cell pixel covers, `nearest` to copy the one at its centre.
   */
  public constructor(
    capacity: number,
    columns: number,
    cellWidth: number,
    cellHeight: number,
    reduction: "area" | "nearest" = "area",
  ) {
    this.capacity = capacity;
    this.columns = columns;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.reduction = reduction;
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
    };
    for (let offset: number = 3; offset < this.sheet.pixels.length; offset += 4)
      this.sheet.pixels[offset] = 255;
    this.count = 0;
  }

  /**
   * Reduce one frame into the next cell and caption it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the frame fills the next cell and receives the caption.
   * @evidence contracts/development/implementation.md#principled-implementation Under `area` each cell pixel averages the source pixels its footprint covers, so thin lines and small figures survive reduction instead of being skipped by point sampling; under `nearest` it copies the source pixel under its centre, `floor((x + 0.5) × source / cell)`, so every colour on the sheet is one the picture holds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the cell's pixels, then one caption.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A full sheet throws instead of overwriting a cell.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the source frame's pixel count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caption reuses the frame label stamp on a cell view of the sheet.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The frame is not retained.
   */
  public add(frame: IAutoMovieRasterImage, caption: string): void {
    if (this.count >= this.capacity) throw new Error("The sheet is full");
    const left: number = (this.count % this.columns) * this.cellWidth;
    const top: number = Math.floor(this.count / this.columns) * this.cellHeight;
    const cell: IAutoMovieRasterImage = {
      width: this.cellWidth,
      height: this.cellHeight,
      pixels: new Uint8ClampedArray(this.cellWidth * this.cellHeight * 4),
    };
    for (let y: number = 0; y < this.cellHeight; y++) {
      const y0: number = Math.floor((y * frame.height) / this.cellHeight);
      const y1: number = Math.max(
        y0 + 1,
        Math.floor(((y + 1) * frame.height) / this.cellHeight),
      );
      for (let x: number = 0; x < this.cellWidth; x++) {
        const target: number = (y * this.cellWidth + x) * 4;
        cell.pixels[target + 3] = 255;

        // Nearest: the source pixel under the cell pixel's centre.
        if (this.reduction === "nearest") {
          const source: number =
            (Math.floor(((y + 0.5) * frame.height) / this.cellHeight) *
              frame.width +
              Math.floor(((x + 0.5) * frame.width) / this.cellWidth)) *
            4;
          cell.pixels[target] = frame.pixels[source]!;
          cell.pixels[target + 1] = frame.pixels[source + 1]!;
          cell.pixels[target + 2] = frame.pixels[source + 2]!;
          continue;
        }

        // Area: the mean of the source pixels the cell pixel covers.
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
        cell.pixels[target] = r / n;
        cell.pixels[target + 1] = g / n;
        cell.pixels[target + 2] = b / n;
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
   * The sheet as filled so far, cut to the rows and columns that hold a
   * picture.
   *
   * A sheet filled short of its capacity gives a picture no larger than its
   * filled cells: as wide as the cells of its first row and as tall as its
   * started rows, with the unfilled cells of a last row left black. That
   * picture is the caller's own, so a later `add` does not change it. It throws
   * when no picture was added.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the extent of the result, how unfilled cells look, who owns the picture and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The extent follows the filled cell count, so a short last sheet carries no empty rows or columns for a reader to scroll or a model to spend attention on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A full sheet is returned; otherwise the filled extent is copied row by row.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An empty sheet throws rather than producing a blank image, and a partly filled sheet is copied instead of handing out a buffer a later `add` would rewrite.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time for a full sheet; linear in the filled extent otherwise.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A full sheet can take no further picture, so its own raster is returned without a copy.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned raster; the sheet keeps no buffer besides its own.
   */
  public finish(): IAutoMovieRasterImage {
    if (this.count === 0) throw new Error("The sheet has no frames");
    if (this.count === this.capacity) return this.sheet;
    const width: number = Math.min(this.columns, this.count) * this.cellWidth;
    const height: number =
      Math.ceil(this.count / this.columns) * this.cellHeight;
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(width * height * 4);
    for (let y: number = 0; y < height; y++)
      pixels.set(
        this.sheet.pixels.subarray(
          y * this.sheet.width * 4,
          (y * this.sheet.width + width) * 4,
        ),
        y * width * 4,
      );
    return { width, height, pixels };
  }
}
