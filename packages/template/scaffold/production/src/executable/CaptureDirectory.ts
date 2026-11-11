import {
  AutoMovieRasterSheet,
  type IAutoMovieRasterImage,
  encodeAutoMovieRasterPng,
} from "@automovie/viewer";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { compareCaptureRound } from "./compareCaptureRound";
import { formatCaptureSeconds } from "./formatCaptureSeconds";

/**
 * The folder one capture run writes: its stills, its contact sheets with their cell indexes, its `manifest.json`, and its comparison against an earlier round.
 *
 * A run without a round writes into the base folder and replaces the previous run there, so a segment always lands at one path. A run with `round` writes into `<base>/rounds/<round>/`, which later runs of other rounds leave alone, so the state before a correction stays to compare against. A run with `compare` is compared against `<base>/rounds/<compare>/` when it closes.
 *
 * Sheets fill as stills arrive: each still is reduced into a cell whose longer side is 320 pixels, and a full sheet is written as `sheet-<from>-<to>.png` with a JSON index of its cells.
 *
 * ```ts
 * const output = await CaptureDirectory.open({ base, round: "before", compare: undefined, tolerance: 0, sheet: { perSheet: 50, columns: 10, views: 1, raster: { width: 1280, height: 720 } } });
 * await output.add(frame, { file: "t002.400.png", seconds: 2.4, view: undefined, caption: "2.40s" });
 * const report = await output.close({ film: "starter" });
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the folder holds, where a run with and without a round writes and why, how sheets fill, and shows open, add and close.
 * @evidence contracts/development/design.md#principled-representation The film capture and the encoded-file capture write the same kinds of file, so one owner places, cleans, indexes and compares them and a reader finds every capture laid out alike.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Open, two ways to hand over a still and close; drawing, decoding and what the manifest says belong to the caller.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only files this command names are replaced, the round names, the tolerance and the sheet's counts and size are admitted before anything is deleted, and two sheets that would take one name throw instead of overwriting.
 */
export class CaptureDirectory {
  /** Folder this run writes into. */
  public readonly directory: string;

  /** Where and how this run writes. */
  private readonly layout: CaptureDirectory.ILayout;

  /** Every still handed over, in order. */
  private readonly frames: CaptureDirectory.ICell[];

  /** File names of the sheets written. */
  private readonly sheets: string[];

  /** The sheet being filled. */
  private sheet: AutoMovieRasterSheet | undefined;

  /** The stills on the sheet being filled. */
  private group: CaptureDirectory.ICell[];

  /** Cell size of the sheet being filled, in pixels. */
  private cell: { width: number; height: number };

  /** Hold a layout; `open` prepares the folder. */
  private constructor(layout: CaptureDirectory.ILayout) {
    this.layout = layout;
    this.directory =
      layout.round === undefined
        ? layout.base
        : path.join(layout.base, "rounds", layout.round);
    this.frames = [];
    this.sheets = [];
    this.sheet = undefined;
    this.group = [];
    this.cell = { width: 0, height: 0 };
  }

  /**
   * Create the run's folder and delete the files an earlier run of this command left in it.
   *
   * It throws, before deleting anything, for a round name that is not letters, digits, dots, underscores and hyphens, for a run compared against its own round, for a `compare` round that does not exist, for a tolerance that is negative or not finite, for a sheet whose cell count, column count or view count is not a positive integer, for a sheet with fewer cells than one second has views, since two such sheets would cover the same seconds and take one name, and, when the layout states the stills' raster, for a sheet that exceeds the sheet's own size limit at the cell size that raster gives.
   *
   * A layout without a raster learns its cell size from the first still, so its too large sheet is refused while the run writes, after the deletion. So is a caller that hands over more stills of one second than the layout's view count, when two of its sheets take one name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is created and deleted, every refusal that precedes the deletion and the two that cannot, with the premise that makes each late.
   * @evidence contracts/development/implementation.md#principled-implementation Every refusal the layout alone decides is made before the first deletion, the sheet's counts and size by the sheet's own constructor, so a refused layout leaves the previous run readable.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the names, the tolerance and the sheet, confirm the compared round, create the folder, clear this command's files.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Files are deleted by the names this command writes, never the folder as a whole, so rounds and unrelated files beneath it stay.
   * @evidence contracts/development/implementation.md#efficient-algorithms One listing of the folder.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A folder is opened once per run.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No handle stays open; the returned object holds only names and the sheet being filled, which a layout with a raster allocates here instead of at the first still.
   */
  public static async open(
    layout: CaptureDirectory.ILayout,
  ): Promise<CaptureDirectory> {
    for (const name of [layout.round, layout.compare])
      if (name !== undefined && !/^[a-z0-9][a-z0-9._-]*$/iu.test(name))
        throw new Error(
          `Round name "${name}" must be letters, digits, dots, underscores and hyphens`,
        );
    if (!Number.isFinite(layout.tolerance) || layout.tolerance < 0)
      throw new Error("--tolerance must be a non-negative number");
    const output: CaptureDirectory = new CaptureDirectory(layout);
    if (layout.sheet !== null) {
      // The sheet's own constructor admits the cell count, the columns and the size. A known raster starts the first sheet here; an unknown one is probed with a one-pixel cell of a few bytes.
      if (layout.sheet.raster !== undefined)
        output.start(layout.sheet.raster.width, layout.sheet.raster.height);
      else
        new AutoMovieRasterSheet(
          layout.sheet.perSheet,
          layout.sheet.columns,
          1,
          1,
        );
      if (!Number.isInteger(layout.sheet.views) || layout.sheet.views < 1)
        throw new Error(
          `A sheet's view count ${layout.sheet.views} is not a positive integer`,
        );
      if (layout.sheet.perSheet < layout.sheet.views)
        throw new Error(
          `A sheet of ${layout.sheet.perSheet} cells is smaller than the ${layout.sheet.views} views of one second, so two sheets would cover the same seconds; make --per-sheet at least the number of views`,
        );
    }
    if (layout.compare !== undefined) {
      if (layout.compare === layout.round)
        throw new Error(
          `Round "${layout.compare}" cannot be compared against itself`,
        );
      const reference: string = path.join(
        layout.base,
        "rounds",
        layout.compare,
      );
      if (
        !(await stat(reference)
          .then((entry: { isDirectory(): boolean }): boolean =>
            entry.isDirectory(),
          )
          .catch((): boolean => false))
      )
        throw new Error(`No round "${layout.compare}" at ${reference}`);
    }

    await mkdir(output.directory, { recursive: true });
    for (const entry of await readdir(output.directory))
      if (OWNED.test(entry)) await rm(path.join(output.directory, entry));
    return output;
  }

  /**
   * Encode a drawn still, write it under `cell.file` and put it on the sheet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three things that happen to the still.
   * @evidence contracts/development/implementation.md#principled-implementation The still is written lossless by the viewer's encoder, so a later round compares exact pixels.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One write, then the shared record step.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A write failure throws; the still is not listed as written.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the still's pixels.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Sheet filling is `record`, shared with stills written by another program.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The still is not retained.
   */
  public async add(
    image: IAutoMovieRasterImage,
    cell: CaptureDirectory.ICell,
  ): Promise<void> {
    await writeFile(
      path.join(this.directory, cell.file),
      encodeAutoMovieRasterPng(image),
    );
    await this.record(image, cell);
  }

  /**
   * List a still that is already in the folder under `cell.file` and put it on the sheet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the premise, that the file exists, and what the call adds.
   * @evidence contracts/development/implementation.md#principled-implementation A still that another program wrote keeps its own bytes; only its decoded picture is needed for the sheet.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure List the still, then reduce it into the next cell and write the sheet when it is full.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The sheet's cell size comes from the still itself, so a file of any raster keeps its proportions.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the still's pixels.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reduction and captioning are the viewer's sheet.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the reduced cell stays, inside the sheet being filled.
   */
  public async record(
    image: IAutoMovieRasterImage,
    cell: CaptureDirectory.ICell,
  ): Promise<void> {
    this.frames.push(cell);
    if (this.layout.sheet === null) return;

    const sheet: AutoMovieRasterSheet =
      this.sheet ?? this.start(image.width, image.height);
    sheet.add(image, cell.caption);
    this.group.push(cell);
    if (this.group.length === this.layout.sheet.perSheet) await this.flush();
  }

  /** Start the sheet being filled for stills of the given raster, with cells scaled so the longer side is 320 pixels; it throws what the sheet's constructor refuses. */
  private start(width: number, height: number): AutoMovieRasterSheet {
    const scale: number = 320 / Math.max(width, height);
    this.cell = {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    };
    this.sheet = new AutoMovieRasterSheet(
      this.layout.sheet!.perSheet,
      this.layout.sheet!.columns,
      this.cell.width,
      this.cell.height,
    );
    return this.sheet;
  }

  /**
   * Write the last sheet and `manifest.json`, run the comparison when one was asked, and report what the run wrote.
   *
   * The manifest is the given record followed by `frames` and `sheets`, the file names in the folder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three steps and what the manifest adds to the caller's record.
   * @evidence contracts/development/implementation.md#principled-implementation The manifest is written after the last sheet, so every file it names exists, and the comparison runs last over the stills it lists.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Flush, write, compare, report.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The comparison is the round owner's; nothing here judges whether a change is acceptable.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of stills, plus the comparison's own cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The comparison reads the stills this run wrote instead of drawing them again.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing stays open after the call.
   */
  public async close(manifest: object): Promise<CaptureDirectory.IReport> {
    await this.flush();
    const frames: string[] = this.frames.map(
      (cell: CaptureDirectory.ICell): string => cell.file,
    );
    await writeFile(
      path.join(this.directory, "manifest.json"),
      JSON.stringify({ ...manifest, frames, sheets: this.sheets }, null, 2),
      "utf8",
    );
    return {
      directory: this.directory,
      frames,
      sheets: this.sheets.map((sheet: string): string =>
        path.join(this.directory, sheet),
      ),
      comparison:
        this.layout.compare === undefined
          ? null
          : await compareCaptureRound({
              directory: this.directory,
              reference: path.join(
                this.layout.base,
                "rounds",
                this.layout.compare,
              ),
              frames,
              tolerance: this.layout.tolerance,
            }),
    };
  }

  /** Write the sheet being filled, with the index of its cells, and start the next. */
  private async flush(): Promise<void> {
    if (
      this.sheet === undefined ||
      this.layout.sheet === null ||
      this.group.length === 0
    )
      return;
    const name: string = `sheet-${formatCaptureSeconds(this.group[0]!.seconds)}-${formatCaptureSeconds(this.group.at(-1)!.seconds)}.png`;
    if (this.sheets.includes(name))
      throw new Error(
        `Two sheets cover the same seconds as ${name}; one second handed over more stills than the layout's ${this.layout.sheet.views} views`,
      );
    const columns: number = this.layout.sheet.columns;
    await writeFile(
      path.join(this.directory, name),
      encodeAutoMovieRasterPng(this.sheet.finish()),
    );
    await writeFile(
      path.join(this.directory, `${name}.json`),
      JSON.stringify(
        {
          columns,
          cellWidth: this.cell.width,
          cellHeight: this.cell.height,
          cells: this.group.map(
            (cell: CaptureDirectory.ICell, index: number): object => ({
              row: Math.floor(index / columns),
              column: index % columns,
              seconds: cell.seconds,
              ...(cell.view === undefined ? {} : { view: cell.view }),
              file: cell.file,
            }),
          ),
        },
        null,
        2,
      ),
      "utf8",
    );
    this.sheets.push(name);
    this.sheet = undefined;
    this.group = [];
  }
}
export namespace CaptureDirectory {
  /**
   * Where a run writes and how it lays out its sheets.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it names, its unit where it has one and what its empty value means.
   * @evidence contracts/development/design.md#principled-representation Location, round, comparison and sheet layout are the four things that differ between runs, each one member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface No member describes a film or a file; the same record serves both capture modes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent rounds are `undefined` and absent sheets are `null`, never an empty string or a zero that would have to be told apart from a value.
   */
  export interface ILayout {
    /** Folder of the capture, which holds the stills of a run without a round and the `rounds` folder. */
    base: string;

    /** Round this run is kept as, or undefined to write into `base`. */
    round: string | undefined;

    /** Earlier round this run is compared against, or undefined for no comparison. */
    compare: string | undefined;

    /** Largest channel difference, in bytes, that the comparison counts as unchanged. */
    tolerance: number;

    /** How sheets are laid out, or null to write no sheet. */
    sheet: {
      /** Cells per sheet. */
      perSheet: number;

      /** Cells per row. */
      columns: number;

      /** Views each second is drawn through, which is the number of stills one second hands over; a sheet holds at least that many cells. */
      views: number;

      /** Raster of the stills in pixels when it is known before the first still, so a sheet too large for it is refused at open; undefined when only the first still tells. */
      raster: { width: number; height: number } | undefined;
    } | null;
  }

  /**
   * One still of a run, as the sheet index and the manifest list it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it names and where it is shown.
   * @evidence contracts/development/design.md#principled-representation A still is identified by its second and its view, the two things a reader looks a frame up by.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all text and numbers; the picture itself is passed beside the record and not kept.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The view is `undefined` for a run of one view instead of a repeated default name.
   */
  export interface ICell {
    /** File name of the still inside the run's folder. */
    file: string;

    /** Film or file second the still shows. */
    seconds: number;

    /** Id of the view the still was drawn through, or undefined when the run has one view. */
    view: string | undefined;

    /** Text stamped on the still's sheet cell. */
    caption: string;
  }

  /**
   * What a closed run wrote.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it lists and whether it is a name or a path.
   * @evidence contracts/development/design.md#principled-representation The report is what the command prints, so it carries paths a reader can open.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The folder, its stills, its sheets and the comparison's own summary.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A run without a comparison reports null, not a comparison with zero stills.
   */
  export interface IReport {
    /** Folder the run wrote into. */
    directory: string;

    /** File names of the stills, in order. */
    frames: string[];

    /** Paths of the sheets, in order. */
    sheets: string[];

    /** The comparison's summary, or null when none was asked. */
    comparison: Awaited<ReturnType<typeof compareCaptureRound>> | null;
  }
}

/** Names of the files a capture run writes, which the next run in the same folder replaces. */
const OWNED: RegExp =
  /^(t\d+\.\d+(-[\w-]+)?\.png|[fs]\d{5}\.png|sheet-.*\.png(\.json)?|diff-.*\.png|manifest\.json|comparison\.json)$/u;
