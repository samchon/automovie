import type { IAutoMovieCaptureStorage } from "@automovie/render";

/**
 * An in-memory file system that a capture writes through, recording every call, so a test reads which files a capture wrote, in what order, and that nothing left its root.
 *
 * It follows the `node:fs/promises` behaviour the capture relies on: `readdir` and `readFile` reject a missing path with a message naming it, `writeFile` rejects a file whose folder does not exist, `mkdir` with `recursive` creates every missing parent, and `rm` with `force` ignores a missing file. Text is stored as UTF-8 bytes.
 */
export function createCaptureMemory(
  seed: Readonly<Record<string, Uint8Array | string>> = {},
): createCaptureMemory.IMemory {
  const files: Map<string, Uint8Array> = new Map();
  const folders: Set<string> = new Set([""]);
  const log: string[] = [];
  const makeFolders: (path: string) => void = (path: string): void => {
    for (let at: string = path; at !== "" && !folders.has(at); at = parent(at))
      folders.add(at);
  };
  for (const [path, data] of Object.entries(seed)) {
    makeFolders(parent(path));
    files.set(path, bytes(data));
  }

  const storage: IAutoMovieCaptureStorage = {
    readdir: async (path: string): Promise<string[]> => {
      log.push(`readdir ${path}`);
      if (!folders.has(path))
        throw new Error(`ENOENT: no such directory ${path}`);
      const names: Set<string> = new Set();
      for (const entry of [...files.keys(), ...folders])
        if (entry !== path && parent(entry) === path)
          names.add(entry.slice(path.length + 1));
      return [...names].sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      );
    },
    mkdir: async (path: string): Promise<unknown> => {
      log.push(`mkdir ${path}`);
      makeFolders(path);
      return undefined;
    },
    readFile: async (path: string): Promise<Uint8Array> => {
      log.push(`readFile ${path}`);
      const data: Uint8Array | undefined = files.get(path);
      if (data === undefined) throw new Error(`ENOENT: no such file ${path}`);
      return new Uint8Array(data);
    },
    writeFile: async (
      path: string,
      data: Uint8Array | string,
    ): Promise<void> => {
      log.push(`writeFile ${path}`);
      if (!folders.has(parent(path)))
        throw new Error(`ENOENT: no folder for ${path}`);
      files.set(path, bytes(data));
    },
    rm: async (path: string): Promise<void> => {
      log.push(`rm ${path}`);
      files.delete(path);
    },
  };
  return {
    storage,
    files,
    log,
    text: (path: string): string => new TextDecoder().decode(files.get(path)),
  };
}
/** Types of the in-memory capture storage. */
export namespace createCaptureMemory {
  /** The storage, its files by path, and the calls made. */
  export interface IMemory {
    /** The storage a capture writes through. */
    storage: IAutoMovieCaptureStorage;

    /** Every file by its full path. */
    files: Map<string, Uint8Array>;

    /** Every call, `<method> <path>`, in order. */
    log: string[];

    /** A file's content as UTF-8 text. */
    text(path: string): string;
  }
}

/** The folder of a path: everything before its last `/`. */
function parent(path: string): string {
  return path.slice(0, Math.max(0, path.lastIndexOf("/")));
}

/** A file's bytes, text encoded as UTF-8 and bytes copied. */
function bytes(data: Uint8Array | string): Uint8Array {
  return typeof data === "string"
    ? new TextEncoder().encode(data)
    : new Uint8Array(data);
}
