import {
  AutoMovieRasterSheet,
  type IAutoMovieRasterImage,
} from "@automovie/render";

import type { CaptureDirectory } from "./CaptureDirectory";
import { indexCaptureSheet } from "./indexCaptureSheet";
import { sizeCaptureSheetCell } from "./sizeCaptureSheetCell";

/**
 * The contact sheets of one capture run, filled one still at a time and handed back as each is finished.
 *
 * Each still is reduced into a cell whose longer side is 320 pixels. A sheet is finished when it holds the layout's cell count, and the run's last sheet when the run closes, cut to the cells it holds. A finished sheet carries its name, `sheet-<from>-<to>.png`, and the index of its cells. Each sheet takes its cell size from the first still put on it, or from the layout's raster for the first sheet of a layout that states one.
 *
 * The book holds pictures and names in memory and writes no file; the folder owner writes what it hands back.
 *
 * ```ts
 * const book = new CaptureSheetBook({ perSheet: 50, columns: 10, views: 1, raster: undefined });
 * const full = book.add(frame, { file: "t002.400.png", seconds: 2.4, view: undefined, caption: "2.40s" });
 * const last = book.finish();
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when a sheet is finished, what a finished sheet carries, where the cell size comes from and that nothing is written, and shows the three calls.
 * @evidence contracts/development/design.md#principled-representation When a sheet is full, what it is named and which names are taken are decisions over stills in memory, so they sit apart from the folder that writes the result and can be called without one.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A constructor that admits the layout, `add` and `finish`; reduction and captions are the viewer's sheet, and files are the folder owner's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A second sheet that would take the name of an earlier one throws instead of replacing it, and the sheet's counts and size are admitted by the viewer's sheet instead of a copy of its limits.
 */
export class CaptureSheetBook {
  /** How the sheets are laid out. */
  private readonly layout: CaptureSheetBook.ILayout;

  /** Names of the sheets finished so far. */
  private readonly names: Set<string>;

  /** The sheet being filled, or undefined until its first still arrives. */
  private sheet: AutoMovieRasterSheet | undefined;

  /** The stills on the sheet being filled. */
  private group: CaptureDirectory.ICell[];

  /** Cell size of the sheet being filled, in pixels. */
  private cell: { width: number; height: number };

  /**
   * Admit a sheet layout, and start the first sheet when the layout states the stills' raster.
   *
   * It throws for a cell count, column count or view count that is not a positive integer, for a sheet with fewer cells than one second has views, since two such sheets would cover the same seconds and take one name, and, when the layout states the stills' raster, for a sheet that exceeds the viewer sheet's size limit at the cell size that raster gives. A layout without a stated raster learns its cell size from the first still, so its too large sheet is refused by `add`.
   */
  public constructor(layout: CaptureSheetBook.ILayout) {
    this.layout = layout;
    this.names = new Set();
    this.sheet = undefined;
    this.group = [];
    this.cell = { width: 1, height: 1 };

    // The viewer sheet's own constructor admits the cell count, the columns and the size.
    if (layout.raster !== undefined)
      this.start(layout.raster.width, layout.raster.height);
    else new AutoMovieRasterSheet(layout.perSheet, layout.columns, 1, 1);
    if (!Number.isInteger(layout.views) || layout.views < 1)
      throw new Error(
        `A sheet's view count ${layout.views} is not a positive integer`,
      );
    if (layout.perSheet < layout.views)
      throw new Error(
        `A sheet of ${layout.perSheet} cells is smaller than the ${layout.views} views of one second, so two sheets would cover the same seconds; make --per-sheet at least the number of views`,
      );
  }

  /**
   * Put a still on the sheet being filled, and hand that sheet back when the still fills it.
   *
   * It throws when the sheet's size at this still's raster exceeds the viewer sheet's limit, and when the filled sheet would take the name of an earlier sheet of this book.
   *
   * @returns The finished sheet when this still was its last cell, otherwise undefined.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the call adds, when it returns a sheet and both refusals.
   * @evidence contracts/development/implementation.md#principled-implementation A sheet is finished by the count of its cells, so every sheet but the last holds the same number of stills and a reader pages through a run in equal steps.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Start a sheet when none is being filled, reduce the still into it, finish it when it is full.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A sheet started by a still takes its cell size from that still, so a file of any raster keeps its proportions.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the still's pixels.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reduction and captioning are the viewer's sheet, and a full sheet is finished by `finish`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The still is not retained; only its reduced cell stays, inside the sheet being filled.
   */
  public add(
    image: IAutoMovieRasterImage,
    cell: CaptureDirectory.ICell,
  ): CaptureSheetBook.ISheet | undefined {
    const sheet: AutoMovieRasterSheet =
      this.sheet ?? this.start(image.width, image.height);
    sheet.add(image, cell.caption);
    this.group.push(cell);
    return this.group.length === this.layout.perSheet
      ? this.finish()
      : undefined;
  }

  /**
   * Hand back the sheet being filled, cut to the cells it holds, and leave the book without one.
   *
   * It throws when the sheet would take the name of an earlier sheet of this book, which means one second handed over more stills than the layout's view count.
   *
   * @returns The sheet, or undefined when no still was added since the last finished sheet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is handed back, the state the book is left in, the refusal with its meaning and the empty case.
   * @evidence contracts/development/implementation.md#principled-implementation A sheet is named after the seconds it spans, so two sheets of one name would show the same seconds and the second would replace the first on disk; the name is refused here, before anything is handed over to be written.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Name and index the cells, refuse a taken name, hand the picture over, reset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A book without a started sheet returns undefined instead of an empty picture.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the cells of the sheet, plus the viewer sheet's cut of a partly filled picture.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The name and the index are `indexCaptureSheet`'s.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The finished picture is the caller's; the book keeps one name per finished sheet and no pixels.
   */
  public finish(): CaptureSheetBook.ISheet | undefined {
    if (this.sheet === undefined || this.group.length === 0) return undefined;
    const named: ReturnType<typeof indexCaptureSheet> = indexCaptureSheet({
      cells: this.group,
      columns: this.layout.columns,
      cell: this.cell,
    });
    if (this.names.has(named.file))
      throw new Error(
        `Two sheets cover the same seconds as ${named.file}; one second handed over more stills than the layout's ${this.layout.views} views`,
      );
    const finished: CaptureSheetBook.ISheet = {
      file: named.file,
      image: this.sheet.finish(),
      index: named.index,
    };
    this.names.add(named.file);
    this.sheet = undefined;
    this.group = [];
    return finished;
  }

  /** Start the sheet being filled for stills of the given raster; it throws what the viewer sheet's constructor refuses. */
  private start(width: number, height: number): AutoMovieRasterSheet {
    this.cell = sizeCaptureSheetCell(width, height);
    this.sheet = new AutoMovieRasterSheet(
      this.layout.perSheet,
      this.layout.columns,
      this.cell.width,
      this.cell.height,
    );
    return this.sheet;
  }
}
export namespace CaptureSheetBook {
  /**
   * How a run's contact sheets are laid out.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it counts or measures and what its absence means.
   * @evidence contracts/development/design.md#principled-representation The cells of a sheet, the cells of a row and the stills of one second are the three counts that decide when a sheet is full and whether two sheets can share a name; the raster decides the cell size.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, declared beside the book that admits them; the folder's layout refers to this record instead of repeating it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A raster that is not known yet is `undefined`, never a zero size that would have to be told apart from a value.
   */
  export interface ILayout {
    /** Cells per sheet. */
    perSheet: number;

    /** Cells per row. */
    columns: number;

    /** Views each second is drawn through, which is the number of stills one second hands over; a sheet holds at least that many cells. */
    views: number;

    /** Raster of the stills in pixels when it is known before the first still, so a sheet too large for it is refused when the book is made; undefined when only the first still tells. */
    raster: { width: number; height: number } | undefined;
  }

  /**
   * One finished contact sheet, ready to be written.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds and where it is written.
   * @evidence contracts/development/design.md#principled-representation A sheet on disk is a picture and the index that says which still each cell shows, both under one name, so the three travel together.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the picture and the index; encoding and the folder belong to the writer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The index is the record `indexCaptureSheet` returns, not a second description of the same cells.
   */
  export interface ISheet {
    /** File name of the sheet's picture; its index is written as `<file>.json`. */
    file: string;

    /** The sheet's picture, cut to the cells it holds. */
    image: IAutoMovieRasterImage;

    /** Which still each cell shows. */
    index: ReturnType<typeof indexCaptureSheet>["index"];
  }
}
