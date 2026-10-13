import type { AutoMovieContentDigest } from "@automovie/interface";

import { digestAutoMovieBytes } from "./contentIdentity";

/** Exact byte identity captured for one publication payload member. */
export interface IProductionPayloadSnapshotEntry {
  /** Canonical publication-relative path. */
  path: string;
  /** Digest of the exact captured bytes. */
  digest: AutoMovieContentDigest;
  /** Exact captured byte length. */
  bytes: number;
}

/** Immutable ordered byte snapshot used by a publication transaction. */
export interface IProductionPayloadSnapshot {
  /** Complete candidate entries in caller-declared order. */
  entries: IProductionPayloadSnapshotEntry[];
}

/** Capture exact bytes through an injected reader before publication begins. */
export const captureProductionPayloadSnapshot = (props: {
  paths: readonly string[];
  read: (path: string) => Uint8Array | null;
}): IProductionPayloadSnapshot => {
  const seen = new Set<string>();
  return {
    entries: props.paths.map((path) => {
      const portable = path.replaceAll("\\", "/").toLowerCase();
      if (seen.has(portable))
        throw new Error(`Publication payload path "${path}" is duplicated.`);
      seen.add(portable);
      const value = props.read(path);
      if (value === null)
        throw new Error(`Publication payload "${path}" is absent.`);
      const bytes = Buffer.from(value);
      return {
        path,
        digest: digestAutoMovieBytes(bytes),
        bytes: bytes.length,
      };
    }),
  };
};

/**
 * Revalidate the exact snapshot without reducing absence or replacement to path existence.
 */
export const isProductionPayloadSnapshotCurrent = (props: {
  snapshot: IProductionPayloadSnapshot;
  read: (path: string) => Uint8Array | null;
}): boolean =>
  props.snapshot.entries.every((entry) => {
    try {
      const value = props.read(entry.path);
      return (
        value !== null &&
        value.length === entry.bytes &&
        digestAutoMovieBytes(value) === entry.digest
      );
    } catch {
      return false;
    }
  });
