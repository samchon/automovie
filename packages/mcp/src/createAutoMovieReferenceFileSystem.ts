import { type BigIntStats, constants } from "node:fs";
import * as fs from "node:fs/promises";

import type { IAutoMovieReferenceFileSystem } from "./structures/IAutoMovieReferenceFileSystem";
import type { IAutoMovieReferenceIdentity } from "./structures/IAutoMovieReferenceIdentity";

const identity: (entry: BigIntStats) => IAutoMovieReferenceIdentity = (entry: BigIntStats): IAutoMovieReferenceIdentity => ({
  kind: entry.isSymbolicLink() ? "link" : entry.isDirectory() ? "directory" : entry.isFile() ? "file" : "other",
  device: entry.dev,
  inode: entry.ino,
  links: entry.nlink,
  size: entry.size,
  modified: entry.mtimeNs,
  changed: entry.ctimeNs,
});

/**
 * Compose the actual Node-compatible physical host. Reads hold a descriptor,
 * consume at most the admitted extent plus one byte and preserve short-read/EOF
 * semantics. The policy that admits those observations lives with the reader.
 *
 *
 * @evidence contracts/common.md#principled-implementation Public Node read-only pathname and descriptor APIs supply bigint identity facts; each bounded read loops until EOF or the admitted extent plus one overflow byte.
 * @evidence contracts/common.md#clear-and-simple-design This host port reports physical observations while the separate reader decides alias and concurrent-write admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native method is replaced; O_NOFOLLOW is used where available and the reader's identity rechecks remain necessary on hosts without it.
 * @evidence contracts/common.md#meaningful-documentation The comment states descriptor ownership, overflow detection and short-read behavior; callers must close each successfully opened handle.
 * @evidence contracts/performance.md#efficient-algorithms Reading N bytes takes O(N) copying plus short-read calls; a maximum-plus-one buffer and final returned copy coexist during the read.
 * @evidence contracts/performance.md#reuse-equivalent-work One descriptor serves its stat, read and close operations; no pathname or byte result is cached across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The reader owns descriptor release in finally blocks; this adapter owns temporary read buffers until the returned byte copy transfers to the caller.
 */
export function createAutoMovieReferenceFileSystem(
  native: Pick<typeof fs, "lstat" | "realpath" | "readdir" | "open"> = fs,
): IAutoMovieReferenceFileSystem {
  return {
    platform: process.platform,
    lstat: async (location: string) : Promise<IAutoMovieReferenceIdentity> => identity(await native.lstat(location, { bigint: true })),
    realpath: native.realpath,
    list: native.readdir,
    open: async (location: string) : ReturnType<IAutoMovieReferenceFileSystem["open"]> => {
      const handle: Awaited<ReturnType<typeof native.open>> = await native.open(location, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
      return {
        stat: async () : Promise<IAutoMovieReferenceIdentity> => identity(await handle.stat({ bigint: true })),
        read: async (maximum: number) : Promise<Uint8Array> => {
          const bytes: Buffer = Buffer.alloc(maximum + 1);
          let length: number = 0;
          while (length < bytes.length) {
            const read: Awaited<ReturnType<typeof handle.read>> = await handle.read(bytes, length, bytes.length - length, length);
            if (read.bytesRead === 0) break;
            length += read.bytesRead;
          }
          return Buffer.from(bytes.subarray(0, length));
        },
        close: () : Promise<void> => handle.close(),
      };
    },
  };
}
