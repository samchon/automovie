import type { IAutoMovieArtifactStore } from "@automovie/engine";
import { createHash, randomUUID } from "node:crypto";
import type { Stats } from "node:fs";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  unlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import type { IAutoMovieDirectoryArtifactStore } from "./IAutoMovieDirectoryArtifactStore";

/**
 * Open (creating if needed) an engine artifact store in `directory`.
 *
 * Layout: `store.json` records the layout format; each entry is
 * `entries/<hex>.bin` (the bytes) plus `entries/<hex>.json` (the recorded
 * `sha256:` digest), where `<hex>` is the key without its `sha256:` prefix.
 * Both files are written to a unique temporary name and renamed into place,
 * bytes first, so an interrupted write leaves either no entry or a whole one; a
 * mixed old/new pair fails the engine's content verification and is
 * recomputed. When `store.json` is absent or names another format, `entries/`
 * is deleted before use: that is the explicit invalidation for a layout change.
 * Key-level invalidation needs nothing here, because a changed version or
 * input composes a different key.
 *
 * Keep the directory under an ignored path such as `.cache/`; it is
 * disposable, and deleting it only costs recomputation. One process at a time
 * may write a directory.
 *
 * @param directory Directory owned by the store from now on.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Atomic same-directory rename gives readers an old or a new file, never a part; recording the digest beside the bytes lets the engine verify content on every read, and a format stamp invalidates a changed layout wholesale. Read times are refreshed with utimes so age and size collection evict least recently used entries.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One factory owns file layout; key semantics, planning and verification stay in the engine, and consumers see only the port.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keys outside the engine's `sha256:` form are refused rather than sanitized into file names, and missing files read as absent instead of empty.
 * @evidence contracts/development/implementation.md#efficient-algorithms Read and write cost two file operations each, linear in artifact bytes; keys() is one directory listing; collect() lists and stats E entries and sorts candidates, O(E log E).
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The store shares nothing itself; reuse is decided by the engine from keys and verified digests.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each call opens and closes its own files and retains no bytes; disk use grows by one entry per distinct written key until collect() deletes entries by keep set, age or byte bound.
 * @evidence contracts/development/common.md#meaningful-documentation States layout, atomicity, invalidation, location and single-writer requirement.
 */
export async function createAutoMovieDirectoryArtifactStore(
  directory: string,
): Promise<IAutoMovieDirectoryArtifactStore> {
  const entries: string = path.join(directory, "entries");
  const stamp: string = path.join(directory, "store.json");
  let format: string | undefined;
  try {
    format = (JSON.parse(await readFile(stamp, "utf8")) as { format?: string })
      .format;
  } catch {
    format = undefined;
  }
  if (format !== FORMAT) {
    await rm(entries, { recursive: true, force: true });
    await mkdir(directory, { recursive: true });
    await writeFile(stamp, JSON.stringify({ format: FORMAT }));
  }
  await mkdir(entries, { recursive: true });

  const file: (key: string, extension: string) => string = (
    key: string,
    extension: string,
  ): string => {
    if (!KEY.test(key)) throw new Error(`Invalid artifact key: ${key}`);
    return path.join(entries, `${key.slice(7)}.${extension}`);
  };
  const place: (
    target: string,
    bytes: Uint8Array | string,
  ) => Promise<void> = async (
    target: string,
    bytes: Uint8Array | string,
  ): Promise<void> => {
    const temporary: string = `${target}.${randomUUID()}.tmp`;
    await writeFile(temporary, bytes);
    await rename(temporary, target);
  };

  return {
    directory,
    read: async (
      key: string,
    ): Promise<IAutoMovieArtifactStore.IEntry | undefined> => {
      try {
        const record: { digest: string } = JSON.parse(
          await readFile(file(key, "json"), "utf8"),
        ) as { digest: string };
        const bytes: Buffer = await readFile(file(key, "bin"));
        const now: Date = new Date();
        await utimes(file(key, "json"), now, now);
        return { bytes, digest: record.digest };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT")
          return undefined;
        throw error;
      }
    },
    write: async (
      key: string,
      entry: IAutoMovieArtifactStore.IEntry,
    ): Promise<void> => {
      await place(file(key, "bin"), entry.bytes);
      await place(file(key, "json"), JSON.stringify({ digest: entry.digest }));
    },
    remove: async (key: string): Promise<void> => {
      await rm(file(key, "json"), { force: true });
      await rm(file(key, "bin"), { force: true });
    },
    digest: async (bytes: Uint8Array): Promise<string> =>
      `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
    keys: async (): Promise<Set<string>> => {
      const names: Set<string> = new Set(await readdir(entries));
      const keys: Set<string> = new Set();
      for (const name of names)
        if (HEX_RECORD.test(name) && names.has(`${name.slice(0, 64)}.bin`))
          keys.add(`sha256:${name.slice(0, 64)}`);
      return keys;
    },
    collect: async (options: {
      keep?: ReadonlySet<string>;
      maxAgeMs?: number;
      maxBytes?: number;
    }): Promise<{ removed: number; bytes: number }> => {
      const unlimited: boolean =
        options.maxAgeMs === undefined && options.maxBytes === undefined;
      const now: number = Date.now();
      const listed: ICollected[] = [];
      for (const name of await readdir(entries)) {
        const target: string = path.join(entries, name);

        // A temporary name belongs to an interrupted write, never an entry.
        if (name.endsWith(".tmp")) {
          await unlink(target).catch((): void => undefined);
          continue;
        }
        if (!HEX_RECORD.test(name)) continue;
        const key: string = `sha256:${name.slice(0, 64)}`;
        const record: Stats = await stat(target);
        const bytes: number = await stat(file(key, "bin"))
          .then((data: Stats): number => data.size)
          .catch((): number => 0);
        listed.push({
          key,
          bytes,
          used: record.mtimeMs,
          kept: options.keep?.has(key) === true,
        });
      }

      // Oldest first, so both limits evict the least recently used entries.
      listed.sort((a: ICollected, b: ICollected): number => a.used - b.used);
      let total: number = listed.reduce(
        (sum: number, entry: ICollected): number => sum + entry.bytes,
        0,
      );
      let removed: number = 0;
      for (const entry of listed) {
        if (entry.kept) continue;
        const expired: boolean =
          unlimited ||
          (options.maxAgeMs !== undefined &&
            now - entry.used > options.maxAgeMs) ||
          (options.maxBytes !== undefined && total > options.maxBytes);
        if (!expired) continue;
        await rm(file(entry.key, "json"), { force: true });
        await rm(file(entry.key, "bin"), { force: true });
        total -= entry.bytes;
        ++removed;
      }
      return { removed, bytes: total };
    },
  };
}

/** Directory layout version; bump it whenever the files above change shape. */
const FORMAT: string = "automovie.artifact-store.v1";

/** The engine's composed key form. */
const KEY: RegExp = /^sha256:[0-9a-f]{64}$/;

/** An entry's digest record file name. */
const HEX_RECORD: RegExp = /^[0-9a-f]{64}\.json$/;

/** One listed entry during collection. */
interface ICollected {
  /** Composed key. */
  key: string;

  /** Size of the stored bytes. */
  bytes: number;

  /** Last write or read, epoch milliseconds. */
  used: number;

  /** Referenced by the caller, never deleted. */
  kept: boolean;
}
