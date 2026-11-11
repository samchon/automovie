import {
  type IAutoMovieRasterImage,
  encodeAutoMovieRasterPng,
} from "@automovie/render";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CaptureSheetBook } from "./CaptureSheetBook";
import { admitCaptureLayout } from "./admitCaptureLayout";
import { compareCaptureRound } from "./compareCaptureRound";
import { isCaptureOwnedFile } from "./isCaptureOwnedFile";

/**
 * The folder one capture run writes: its stills, its contact sheets with their cell indexes, its `manifest.json`, and its comparison against an earlier round.
 *
 * A run without a round writes into the base folder and replaces the previous run there, so a segment always lands at one path. A run with `round` writes into `<base>/rounds/<round>/`, which later runs of other rounds leave alone, so the state before a correction stays to compare against. A run with `compare` is compared against `<base>/rounds/<compare>/` when it closes.
 *
 * Sheets fill as stills arrive: each still is reduced into a cell whose longer side is 320 pixels, and a full sheet is written as `sheet-<from>-<to>.png` with a JSON index of its cells.
 *
 * This class reads and writes the files and orders the steps. Which layouts are admitted is `admitCaptureLayout`, which files a run replaces is `isCaptureOwnedFile`, when a sheet is full and what it is named is `CaptureSheetBook`, and what a comparison reports is `compareCaptureStill` and `summarizeCaptureComparison` beneath `compareCaptureRound`, each with a logic unit test. The order of the steps, the compared round confirmed before the first deletion and the manifest written after the last sheet, has no unit test and is exercised by capture runs.
 *
 * ```ts
 * const output = await CaptureDirectory.open({ base, round: "before", compare: undefined, tolerance: 0, sheet: { perSheet: 50, columns: 10, views: 1, raster: { width: 1280, height: 720 } } });
 * await output.add(frame, { file: "t002.400.png", seconds: 2.4, view: undefined, caption: "2.40s" });
 * const report = await output.close({ film: "starter" });
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the folder holds, where a run with and without a round writes and why, how sheets fill, which modules decide, what this class adds and what of it no unit test covers, and shows open, add and close.
 * @evidence contracts/development/design.md#principled-representation The film capture and the encoded-file capture write the same kinds of file, so one owner places, cleans, indexes and compares them and a reader finds every capture laid out alike.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Open, two ways to hand over a still and close; drawing, decoding and what the manifest says belong to the caller.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only files this command names are replaced, and the layout is admitted and the compared round confirmed before anything is deleted.
 */
export class CaptureDirectory {
  /** Folder this run writes into. */
  public readonly directory: string;

  /** Folder of the compared round, or undefined without a comparison. */
  private readonly reference: string | undefined;

  /** Largest channel difference, in bytes, that the comparison counts as unchanged. */
  private readonly tolerance: number;

  /** The run's contact sheets, or undefined for a run that writes none. */
  private readonly book: CaptureSheetBook | undefined;

  /** Every still handed over, in order. */
  private readonly frames: CaptureDirectory.ICell[];

  /** File names of the sheets written. */
  private readonly sheets: string[];

  /** Hold an admitted layout; `open` prepares the folder. */
  private constructor(
    layout: CaptureDirectory.ILayout,
    admission: ReturnType<typeof admitCaptureLayout>,
  ) {
    this.directory = admission.directory;
    this.reference = admission.reference;
    this.tolerance = layout.tolerance;
    this.book = admission.sheets;
    this.frames = [];
    this.sheets = [];
  }

  /**
   * Create the run's folder and delete the files an earlier run of this command left in it.
   *
   * It throws, before deleting anything, what `admitCaptureLayout` refuses, and for a `compare` round that does not exist.
   *
   * A layout without a raster learns its cell size from the first still, so its too large sheet is refused while the run writes, after the deletion. So is a caller that hands over more stills of one second than the layout's view count, when two of its sheets take one name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is created and deleted, where the refusals that precede the deletion are listed, and the two that cannot precede it, with the premise that makes each late.
   * @evidence contracts/development/implementation.md#principled-implementation The layout is admitted and the compared round confirmed before the first deletion, so a refused run leaves the previous run readable.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the layout, confirm the compared round, create the folder, clear this command's files.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Files are deleted by the names this command writes, never the folder as a whole, so rounds and unrelated files beneath it stay.
   * @evidence contracts/development/implementation.md#efficient-algorithms One listing of the folder.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A folder is opened once per run.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No handle stays open; the returned object holds only names and the sheet book, whose one sheet being filled is its only picture.
   */
  public static async open(
    layout: CaptureDirectory.ILayout,
  ): Promise<CaptureDirectory> {
    const output: CaptureDirectory = new CaptureDirectory(
      layout,
      admitCaptureLayout(layout),
    );
    if (
      output.reference !== undefined &&
      !(await stat(output.reference)
        .then((entry: { isDirectory(): boolean }): boolean =>
          entry.isDirectory(),
        )
        .catch((): boolean => false))
    )
      throw new Error(`No round "${layout.compare}" at ${output.reference}`);

    await mkdir(output.directory, { recursive: true });
    for (const entry of await readdir(output.directory))
      if (isCaptureOwnedFile(entry))
        await rm(path.join(output.directory, entry));
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure List the still, hand it to the sheet book, and write the sheet the book hands back when the still filled one.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A run without sheets lists the still and makes no picture of it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the still's pixels, plus the pixels of a sheet when one is written.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work When a sheet is full, its name and its index are the sheet book's.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The still is not retained; a finished sheet is written and dropped.
   */
  public async record(
    image: IAutoMovieRasterImage,
    cell: CaptureDirectory.ICell,
  ): Promise<void> {
    this.frames.push(cell);
    const full: CaptureSheetBook.ISheet | undefined = this.book?.add(
      image,
      cell,
    );
    if (full !== undefined) await this.write(full);
  }

  /**
   * Write the last sheet and `manifest.json`, run the comparison when one was asked, and report what the run wrote.
   *
   * The manifest is the given record followed by `frames` and `sheets`, the file names in the folder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three steps and what the manifest adds to the caller's record.
   * @evidence contracts/development/implementation.md#principled-implementation The manifest is written after the last sheet, so every file it names exists, and the comparison runs last over the stills it lists.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Write the last sheet, write the manifest, compare, report.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The comparison is the round owner's; nothing here judges whether a change is acceptable.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of stills, plus the comparison's own cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The comparison reads the stills this run wrote instead of drawing them again.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing stays open after the call.
   */
  public async close(manifest: object): Promise<CaptureDirectory.IReport> {
    const last: CaptureSheetBook.ISheet | undefined = this.book?.finish();
    if (last !== undefined) await this.write(last);
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
        this.reference === undefined
          ? null
          : await compareCaptureRound({
              directory: this.directory,
              reference: this.reference,
              frames,
              tolerance: this.tolerance,
            }),
    };
  }

  /** Write a finished sheet's picture under its name and its index as `<name>.json`, and list the sheet. */
  private async write(sheet: CaptureSheetBook.ISheet): Promise<void> {
    await writeFile(
      path.join(this.directory, sheet.file),
      encodeAutoMovieRasterPng(sheet.image),
    );
    await writeFile(
      path.join(this.directory, `${sheet.file}.json`),
      JSON.stringify(sheet.index, null, 2),
      "utf8",
    );
    this.sheets.push(sheet.file);
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
    sheet: CaptureSheetBook.ILayout | null;
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
