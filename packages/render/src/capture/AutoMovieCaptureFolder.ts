import type {
  IAutoMovieCaptureFolder,
  IAutoMovieCaptureFolderOpenProps,
  IAutoMovieCaptureRecord,
  IAutoMovieCaptureStorage,
} from "@automovie/interface";

/** The record's file name. */
const RECORD: string = "record.json";

/** The folder of kept rounds beneath the root. */
const ROUNDS: string = "rounds";

/** A file name the folder writes: one name, no separator and no relative step. */
const FILE_NAME: RegExp = /^(?!\.{1,2}$)[^/\\]+$/u;

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

  /** The compared round's complete record, or null without a comparison. */
  public readonly earlier: Extract<
    IAutoMovieCaptureRecord,
    { state: "complete" }
  > | null;

  /** Path of the compared round's folder, or null without a comparison. */
  public readonly reference: string | null;

  /** Names claimed so far, in the order claimed. */
  private readonly claimed: Set<string>;

  /** Names written so far, in the order written. */
  private readonly written: Set<string>;

  /** Hold an opened folder; `open` prepares it. */
  private constructor(props: {
    storage: IAutoMovieCaptureStorage;
    directory: string;
    round: string | null;
    compare: string | null;
    reference: string | null;
    earlier: Extract<IAutoMovieCaptureRecord, { state: "complete" }> | null;
  }) {
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

    // 1. The compared round, before anything changes.
    const reference: string | null =
      props.compare === null ? null : `${root}/${ROUNDS}/${props.compare}`;
    let earlier: Extract<
      IAutoMovieCaptureRecord,
      { state: "complete" }
    > | null = null;
    if (reference !== null) {
      const record: IAutoMovieCaptureRecord | null = await readRecord(
        storage,
        `${reference}/${RECORD}`,
      ).catch((): null => null);
      if (record === null || record.state !== "complete")
        throw new Error(
          `No finished round "${props.compare}" at ${reference}: its ${RECORD} is missing, unreadable or still running`,
        );
      earlier = record;
    }

    // 2. The folder holds only what its previous record owns.
    await storage.mkdir(directory, { recursive: true });
    const entries: string[] = await storage.readdir(directory);
    const previous: IAutoMovieCaptureRecord | null = entries.includes(RECORD)
      ? await readRecord(storage, `${directory}/${RECORD}`)
      : null;
    const owned: Set<string> = new Set([RECORD, ...(previous?.files ?? [])]);
    if (props.round === null) owned.add(ROUNDS);
    const foreign: string[] = entries.filter(
      (entry: string): boolean => !owned.has(entry),
    );
    if (foreign.length !== 0)
      throw new Error(
        `Capture folder ${directory} holds files no capture wrote, so it is left alone: ${foreign.join(", ")}`,
      );

    // 3. Delete the previous capture's files; its record stays until the next claim replaces it.
    for (const file of previous?.files ?? [])
      if (file !== RECORD && FILE_NAME.test(file))
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
      if (!FILE_NAME.test(name) || name === RECORD)
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
    if (!FILE_NAME.test(name))
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
): Promise<IAutoMovieCaptureRecord> {
  const text: string = new TextDecoder().decode(await storage.readFile(path));
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${path} is not a capture record`, { cause: error });
  }
}
