import type {
  IAutoMovieCaptureFolder,
  IAutoMovieCaptureRecord,
} from "@automovie/interface";

/** An in-memory capture folder that records what a run claims and writes. */
interface ICaptureFolderDouble extends IAutoMovieCaptureFolder {
  /** Every name claimed, in order. */
  readonly claimed: string[];

  /** The files this round wrote or was given, by name. */
  readonly files: Map<string, Uint8Array>;
}

/**
 * A capture folder of round `now` opened against the complete record `earlier`
 * of round `before`, whose files it serves for earlier reads.
 *
 * `close` is not part of a comparison and refuses.
 */
export function createCaptureFolderDouble(props: {
  /** The earlier round's record, or null for a folder opened against none. */
  earlier: Extract<IAutoMovieCaptureRecord, { state: "complete" }> | null;

  /** The earlier round's files by name. */
  earlierFiles: ReadonlyMap<string, Uint8Array>;

  /** This round's files given up front, by name. */
  files: ReadonlyMap<string, Uint8Array>;
}): ICaptureFolderDouble {
  const files: Map<string, Uint8Array> = new Map(props.files);
  const claimed: string[] = [];
  return {
    directory: "memory",
    round: "now",
    compare: props.earlier === null ? null : "before",
    earlier: props.earlier,
    reference: null,
    claimed,
    files,
    claim: async (names: readonly string[]): Promise<void> => {
      claimed.push(...names);
    },
    write: async (name: string, data: Uint8Array | string): Promise<void> => {
      files.set(
        name,
        typeof data === "string" ? new TextEncoder().encode(data) : data,
      );
    },
    remove: async (name: string): Promise<void> => {
      files.delete(name);
    },
    read: async (name: string, earlier?: boolean): Promise<Uint8Array> => {
      const bytes: Uint8Array | undefined = (
        earlier === true ? props.earlierFiles : files
      ).get(name);
      if (bytes === undefined) throw new Error(`no file ${name}`);
      return bytes;
    },
    close: async (): Promise<never> => {
      throw new Error("a comparison does not close the folder");
    },
  };
}
