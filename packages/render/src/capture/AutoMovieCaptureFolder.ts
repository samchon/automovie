import { AutoMovieEngineCaptureRecord } from "@automovie/engine";
import type {
  IAutoMovieCaptureFolder,
  IAutoMovieCaptureFolderOpenProps,
  IAutoMovieCaptureRecord,
  IAutoMovieCaptureStorage,
} from "@automovie/interface";

import { AutoMovieRenderCaptureRecord } from "./AutoMovieRenderCaptureRecord.js";

/** The record's file name. */
const RECORD: string = "record.json";

/** The folder of kept rounds beneath the root. */
const ROUNDS: string = "rounds";

/** Data required to hold an already opened capture folder. */
interface IOpenedFolder {
  /** Storage already admitted for this capture. */
  readonly storage: IAutoMovieCaptureStorage;
  /** Directory where this capture will write. */
  readonly directory: string;
  /** Optional path component for the retained round. */
  readonly round: string | null;
  /** Name of the comparison round, when requested. */
  readonly compare: string | null;
  /** Directory of the comparison round, when requested. */
  readonly reference: string | null;
  /** Admitted comparison data, when requested. */
  readonly earlier: IAutoMovieCaptureRecord.IComparison | null;
}

/**
 * The folder one capture writes, and the rules of which files it owns and in
 * what order it touches them.
 *
 * A capture without a round writes into its root and replaces the previous
 * unnamed capture; a capture with a round writes into `<root>/rounds/<round>`,
 * which later captures of other rounds leave alone. A folder may hold only the
 * files its last record lists, its record, and at the root the `rounds` folder;
 * any other entry is a file the capture did not write, and the folder is
 * refused rather than touched.
 *
 * The steps run in this order, each before the next:
 *
 * 1. Read the compared round's record, refusing a round that is missing or
 *    unfinished.
 * 2. Create the folder, list it, read its previous record, and refuse an entry
 *    that record does not own.
 * 3. Delete the previous capture's files, leaving its record.
 * 4. On `claim`, write a `running` record listing every file about to be written,
 *    replacing the previous record.
 * 5. Write the claimed files; a name not claimed is refused.
 * 6. On `close`, write the `complete` record listing the files written.
 *
 * A folder interrupted after any step still has a record that owns every file
 * in it, so the next capture replaces them instead of refusing the folder.
 * Paths are the root and names joined by `/`, and no name leaves the folder.
 *
 * ```ts
 * const folder = await AutoMovieCaptureFolder.open({
 *   storage,
 *   root,
 *   round: null,
 *   compare: null,
 * });
 * await folder.claim(["t000.000-film-beauty.png"]);
 * await folder.write("t000.000-film-beauty.png", bytes);
 * await folder.close(record);
 * ```
 */
export class AutoMovieCaptureFolder implements IAutoMovieCaptureFolder {
  /** Where files are read and written. */
  private readonly storage: IAutoMovieCaptureStorage;

  /** Path of the folder, the root or a round beneath it, without a trailing `/`. */
  public readonly directory: string;

  /** Round the folder keeps, or null for the root. */
  public readonly round: string | null;

  /** Round compared against, or null. */
  public readonly compare: string | null;

  /** The compared round's admitted observations, or null without a comparison. */
  public readonly earlier: IAutoMovieCaptureRecord.IComparison | null;

  /** Path of the compared round's folder, or null without a comparison. */
  public readonly reference: string | null;

  /** Names claimed so far, in the order claimed. */
  private readonly claimed: Set<string>;

  /** Names written so far, in the order written. */
  private readonly written: Set<string>;

  /** Hold an opened folder; `open` prepares it. */
  private constructor(props: IOpenedFolder) {
    this.storage = props.storage;
    this.directory = props.directory;
    this.round = props.round;
    this.compare = props.compare;
    this.reference = props.reference;
    this.earlier = props.earlier;
    this.claimed = new Set();
    this.written = new Set();
  }

  /**
   * Open the folder of a capture: confirm the compared round, refuse a folder
   * holding files the previous capture did not write, and delete the previous
   * capture's files.
   *
   * It rejects, before deleting anything: a compared round whose record is
   * missing, unreadable or unfinished; a previous record that is unreadable;
   * and a folder entry no record owns, naming every such entry.
   */
  public static async open(
    props: IAutoMovieCaptureFolderOpenProps,
  ): Promise<AutoMovieCaptureFolder> {
    const { storage } = props;
    const root: string = props.root.replace(/\/+$/u, "");
    if (root === "") throw new Error("A capture root cannot be empty");
    const directory: string =
      props.round === null ? root : `${root}/${ROUNDS}/${props.round}`;

    const reference: string | null =
      props.compare === null ? null : `${root}/${ROUNDS}/${props.compare}`;
    if (directory === reference)
      throw new Error(
        `Capture round "${props.round}" cannot be compared against itself`,
      );

    // 1. The compared round, before anything changes.
    let earlier: IAutoMovieCaptureRecord.IComparison | null = null;
    if (reference !== null) {
      earlier = AutoMovieRenderCaptureRecord.comparison(
        await readRecord(storage, `${reference}/${RECORD}`).catch(
          (): null => null,
        ),
      );
      if (earlier === null)
        throw new Error(
          `No finished round "${props.compare}" at ${reference}: its ${RECORD} is missing, unreadable or still running`,
        );
    }

    // 2. The folder holds only what its previous record owns.
    await storage.mkdir(directory, { recursive: true });
    if (
      storage.realpath !== undefined &&
      (props.round !== null || reference !== null)
    ) {
      const actual: string = await storage.realpath(directory);
      if (reference !== null && actual === (await storage.realpath(reference)))
        throw new Error(
          `Capture output and compared round "${props.compare}" share the same folder: ${actual}`,
        );
      const name: string = actual.split(/[\\/]/u).at(-1)!;
      if (props.round !== null && name !== props.round)
        throw new Error(
          `Capture round "${props.round}" refers to existing round "${name}" at ${actual}`,
        );
    }
    const entries: string[] = await storage.readdir(directory);
    let previous: readonly string[] = [];
    if (entries.includes(RECORD)) {
      const recordPath: string = `${directory}/${RECORD}`;
      const files: readonly string[] | null =
        AutoMovieRenderCaptureRecord.ownedFiles(
          await readRecord(storage, recordPath),
        );
      if (files === null)
        throw new Error(`${recordPath} is not a capture record`);
      previous = files;
    }
    const owned: Set<string> = new Set([RECORD, ...previous]);
    if (props.round === null) owned.add(ROUNDS);
    const foreign: string[] = entries.filter(
      (entry: string): boolean => !owned.has(entry),
    );
    if (foreign.length !== 0)
      throw new Error(
        `Capture folder ${directory} holds files no capture wrote, so it is left alone: ${foreign.join(", ")}`,
      );

    // 3. Delete the previous capture's files; its record stays until the next claim replaces it.
    for (const file of previous)
      if (file !== RECORD && !(props.round === null && file === ROUNDS))
        await storage.rm(`${directory}/${file}`, { force: true });
    return new AutoMovieCaptureFolder({
      storage,
      directory,
      round: props.round,
      compare: props.compare,
      reference,
      earlier,
    });
  }

  /**
   * Own the given file names before writing them, by writing a `running` record
   * that lists every name claimed so far.
   *
   * It rejects a name that is not one plain file name, or the record's own
   * name.
   */
  public async claim(names: readonly string[]): Promise<void> {
    for (const name of names) {
      if (!AutoMovieEngineCaptureRecord.isFileName(name) || name === RECORD)
        throw new Error(`A capture cannot write "${name}" in its folder`);
      this.claimed.add(name);
    }
    const record: IAutoMovieCaptureRecord = {
      state: "running",
      files: [...this.claimed],
    };
    await this.storage.writeFile(
      `${this.directory}/${RECORD}`,
      JSON.stringify(record, null, 2),
    );
  }

  /**
   * Write a claimed file of the folder.
   *
   * It rejects a name that was not claimed.
   */
  public async write(name: string, data: Uint8Array | string): Promise<void> {
    if (!this.claimed.has(name))
      throw new Error(`A capture wrote ${name} without claiming it`);
    await this.storage.writeFile(`${this.directory}/${name}`, data);
    this.written.add(name);
  }

  /**
   * Delete a claimed file of this folder, such as a still another program wrote
   * and the capture has read and rewritten under its cell's name; a file that
   * does not exist is not an error.
   */
  public async remove(name: string): Promise<void> {
    if (!this.claimed.has(name))
      throw new Error(`A capture removed ${name} without claiming it`);
    await this.storage.rm(`${this.directory}/${name}`, { force: true });
    this.written.delete(name);
  }

  /**
   * Read a file of this folder, or with `earlier` of the compared round's
   * folder.
   */
  public async read(
    name: string,
    earlier: boolean = false,
  ): Promise<Uint8Array> {
    if (!AutoMovieEngineCaptureRecord.isFileName(name))
      throw new Error(`A capture cannot read "${name}"`);
    if (earlier && this.reference === null)
      throw new Error("This capture compares against no round");
    return this.storage.readFile(
      `${earlier ? this.reference : this.directory}/${name}`,
    );
  }

  /**
   * Write the `complete` record, listing every file written and the record
   * itself.
   */
  public async close(
    record: Omit<
      Extract<IAutoMovieCaptureRecord, { state: "complete" }>,
      "files" | "state"
    >,
  ): Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> {
    const complete: Extract<IAutoMovieCaptureRecord, { state: "complete" }> = {
      state: "complete",
      ...record,
      files: [...this.written, RECORD],
    };
    await this.storage.writeFile(
      `${this.directory}/${RECORD}`,
      JSON.stringify(complete, null, 2),
    );
    return complete;
  }
}

/** Read and parse a record, rejecting text that is not one. */
async function readRecord(
  storage: IAutoMovieCaptureStorage,
  path: string,
): Promise<unknown> {
  const text: string = new TextDecoder().decode(await storage.readFile(path));
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${path} is not a capture record`, { cause: error });
  }
}
