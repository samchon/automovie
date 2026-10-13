import { type BigIntStats, constants } from "node:fs";
import * as fs from "node:fs/promises";

import type { IAutoMovieReferenceFileSystem } from "./structures/IAutoMovieReferenceFileSystem";
import type { IAutoMovieReferenceIdentity } from "./structures/IAutoMovieReferenceIdentity";

const identity = (entry: BigIntStats): IAutoMovieReferenceIdentity => ({
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
 */
export function createAutoMovieReferenceFileSystem(
  native: Pick<typeof fs, "lstat" | "realpath" | "readdir" | "open"> = fs,
): IAutoMovieReferenceFileSystem {
  return {
    platform: process.platform,
    lstat: async (location) => identity(await native.lstat(location, { bigint: true })),
    realpath: native.realpath,
    list: native.readdir,
    open: async (location) => {
      const handle = await native.open(location, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
      return {
        stat: async () => identity(await handle.stat({ bigint: true })),
        read: async (maximum) => {
          const bytes = Buffer.alloc(maximum + 1);
          let length = 0;
          while (length < bytes.length) {
            const read = await handle.read(bytes, length, bytes.length - length, length);
            if (read.bytesRead === 0) break;
            length += read.bytesRead;
          }
          return Buffer.from(bytes.subarray(0, length));
        },
        close: () => handle.close(),
      };
    },
  };
}
