import type { IAutoMovieArtifactKey } from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";

/**
 * Hash one stage's complete key record into a `sha256:` cache key.
 *
 * The canonical text is a JSON array of the key-format tag, the stage, its
 * version and the toolchain and input records as entry lists sorted by name, so
 * member order never changes the key and no two different records share a text
 * (JSON escapes every separator). The format tag is part of the hash: changing
 * how keys are composed changes every key, which invalidates every existing
 * entry without touching a file. The digest is the engine's FIPS 180-4 SHA-256,
 * identical in a browser and in Node.
 *
 * @param key Stage, version, toolchain and inputs; read, not retained.
 * @returns `sha256:` followed by 64 lowercase hex digits.
 */
export function composeAutoMovieArtifactKey(
  key: IAutoMovieArtifactKey,
): string {
  return autoMovieRenderDigest(
    JSON.stringify([
      FORMAT,
      key.stage,
      key.version,
      sortedEntries(key.toolchain),
      sortedEntries(key.inputs),
    ]),
  );
}

/** Key-encoding version; bump it whenever the canonical text above changes. */
const FORMAT: string = "automovie.artifact-key.v1";

/** Entries ordered by code unit, so member order never reaches the hash. */
const sortedEntries: (
  record: Readonly<Record<string, string>>,
) => [string, string][] = (
  record: Readonly<Record<string, string>>,
): [string, string][] =>
  Object.entries(record).sort(
    (left: [string, string], right: [string, string]): number =>
      left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0,
  );
