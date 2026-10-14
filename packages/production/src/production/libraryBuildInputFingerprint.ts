import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";
import { fingerprintAutoMovieFields } from "./fingerprintAutoMovieFields";

import {
  AUTOMOVIE_BUILD_FINGERPRINT_PROTOCOL,
  canonicalAutoMovieJsonBytes,
} from "./contentIdentity";
import {
  AUTOMOVIE_LIBRARY_AUTHORING_SNAPSHOT_PROTOCOL,
  IAutoMovieLibraryAuthoringSnapshot,
} from "./libraryAuthoringSnapshot";
import { portableAutoMovieLibraryAuthoringSnapshot } from "./portableAutoMovieLibraryAuthoringSnapshot";
import {
  AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL,
  AUTOMOVIE_PRODUCTION_BUILD_VERSION,
} from "./productionBuildProtocol";

/**
 * The builder input identity of one library attempt.
 *
 * Four things enter it, each under its own domain-separated field. The compile
 * protocol and builder version come first. The production namespace follows,
 * because every library build context and the published index carry it, so
 * the same source compiled under another namespace is a different result. The
 * portable projection of the authoring snapshot comes next, so the same work
 * opened from another checkout is the same result. The content inventory and
 * verified derivation closure come last, and they are where an imported helper
 * outside the selected owner population, an adopted asset, and derived bytes
 * enter.
 *
 * The resident snapshot digest is deliberately absent. The publication guard
 * compares that digest on its own, so moving a project neither stales its
 * results nor weakens the refusal of a foreign or replaced root.
 *
 * This identity replaced one that hashed the resident digest and omitted the
 * namespace. No generated artifact changed shape, so the builder protocol did
 * not move. A manifest, index, or receipt recorded under the earlier identity
 * cannot equal this one, and it reopens as stale until the library is compiled
 * again.
 *
 * @evidence contracts/common.md#principled-implementation Domain-separated fields bind builder protocol/version, production namespace, portable authoring snapshot and the ordered supplied content/derivation closure; resident root/location identity is compared separately at publication.
 * @evidence contracts/common.md#clear-and-simple-design Reuses fingerprintAutoMovieFields and canonical JSON owners, adding only library-specific field composition; compileAutoMovieLibrary and fresh source-status acquisition call this same identity operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Namespace is an explicit result input and physical checkout paths are omitted only through the defined portable projection; this digest does not independently verify caller-supplied closure completeness or source execution effects.
 * @evidence contracts/common.md#meaningful-documentation States every identity domain, field ordering and resident-versus-portable ownership; declaration/content changes move identity without requiring a generated-shape protocol bump.
 * @evidence contracts/performance.md#efficient-algorithms Projects and canonically encodes authoring metadata, then hashes F field headers and their total payload/header bytes through the fingerprint owner after canonicalization costs. Temporary storage includes encoded snapshot bytes and F field references plus the fingerprint owner's current label/prefix buffers; supplied payload arrays are consumed synchronously without copies.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the already-acquired snapshot and supplied derivation fields instead of rereading files; both build and status consume the same composition, with no retained digest cache assuming mutable field equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned digest is caller-owned and local projection/encoded buffers become unreachable after hashing; existing source/content buffers remain caller-owned and no file or task is acquired.
 * @author Samchon
 */
export function libraryBuildInputFingerprint(props: {
  /** Production namespace the library is compiled and published under. */
  production: string;
  /** Authoring closure acquired for the attempt. */
  snapshot: IAutoMovieLibraryAuthoringSnapshot;
  /** Content inventory and derivation closure fields in their read order. */
  derivedFields: readonly IAutoMovieFingerprintField[];
}): string {
  return fingerprintAutoMovieFields([
    {
      role: "protocol",
      kind: "library-compile-input",
      payload: Buffer.from(
        `${AUTOMOVIE_BUILD_FINGERPRINT_PROTOCOL}\0${AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL}\0${AUTOMOVIE_PRODUCTION_BUILD_VERSION}`,
        "utf8",
      ),
    },
    {
      role: "production",
      kind: "namespace",
      payload: Buffer.from(props.production, "utf8"),
    },
    {
      role: "library:authoring",
      kind: AUTOMOVIE_LIBRARY_AUTHORING_SNAPSHOT_PROTOCOL,
      payload: canonicalAutoMovieJsonBytes(
        portableAutoMovieLibraryAuthoringSnapshot(props.snapshot),
      ),
    },
    ...props.derivedFields,
  ]);
}
