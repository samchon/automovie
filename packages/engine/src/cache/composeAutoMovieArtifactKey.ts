import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import type { IAutoMovieArtifactKey } from "./IAutoMovieArtifactKey";

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
 *
 * @evidence contracts/development/implementation.md#principled-implementation Canonical JSON over code-unit-sorted entries is a deterministic injective encoding of the record, and SHA-256 makes accidental collisions negligible; the key-format tag in the hash gives explicit invalidation when the encoding changes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure function owns the key text; storage, planning and resolution only compare its result, and the hash is the engine's existing portable digest.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No member is dropped or normalized beyond ordering; the caller decides what belongs in the record.
 * @evidence contracts/development/implementation.md#efficient-algorithms Sorting T toolchain and I input entries costs O((T + I) log(T + I)) comparisons and hashing is linear in the canonical text.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure hash coordinates no work across requests.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned string outlives the call.
 * @evidence contracts/development/common.md#meaningful-documentation States the canonical text, order independence, format invalidation and the output form.
 */
export function composeAutoMovieArtifactKey(key: IAutoMovieArtifactKey): string {
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
