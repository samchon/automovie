import {
  type AutoMovieExternalModelIngestProfile,
  type IAutoMovieExternalModelInspection,
  inspectAutoMovieExternalModelBytes,
} from "@automovie/ingest";
import type { AutoMovieContentDigest } from "@automovie/interface";
import { digestAutoMovieBytes } from "@automovie/production";
import path from "node:path";

const SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/u;

/**
 * One POSIX-relative, normalized, root-bound project path: no drive or root
 * prefix, no backslash, no `.` or `..` segment, no empty segment, and equal to
 * its own normalization so two spellings cannot name one file.
 */
const isCanonicalProjectPath = (value: string): boolean =>
  path.posix.isAbsolute(value) === false &&
  /^[A-Za-z]:/u.test(value) === false &&
  value.includes("\\") === false &&
  value !== "." &&
  path.posix.normalize(value) === value &&
  value.split("/").every((segment) => segment.length > 0 && segment !== "..");

/**
 *
 * One sidecar the inspection opened, identified by exact resident bytes.
 *
 * One record exists per canonical path, however many declared URIs reached it;
 * the bytes themselves are not part of the record.
 *
 * @evidence contracts/common.md#principled-implementation Identifies a sidecar by its canonical project path plus the SHA-256 digest and length of its resident bytes, while `declaredUris` keeps every URI spelling that reached it.
 * @evidence contracts/common.md#clear-and-simple-design Four printable fields; the resident buffer used during inspection is stripped before the record is returned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Records every declared spelling instead of picking one, and no field exists for a particular consumer.
 * @evidence contracts/common.md#meaningful-documentation States the one-record-per-path rule, the byte unit, the digest algorithm, the URI order, and that bytes are not retained.
 * @evidenceExclude contracts/performance.md#cost-and-resources A printed record; the read and digest it reports were computed once by the inspection. The record reports the inspection's sharing through `declaredUris` and computes nothing itself. Holds a count, a digest string, a path and one string per distinct declared URI, never the bytes.
 * @author Samchon
 */
export interface IAutoMovieExternalProjectResource {
  /** Resident byte length of the sidecar. */
  bytes: number;

  /** Every distinct URI the document declared that resolved to this path, in first-use order. */
  declaredUris: string[];

  /** `sha256:` digest of the resident sidecar bytes. */
  digest: AutoMovieContentDigest;

  /** Canonical `/`-separated project-relative sidecar path. */
  path: string;
}

/**
 *
 * Deterministic inspection envelope that `automovie inspect-external` prints as
 * JSON: the primary source identity, the sidecar closure it opened, and the
 * inspector's structural facts.
 *
 * @evidence contracts/common.md#principled-implementation Pairs content identities (SHA-256 and length) of the exact source and sidecar bytes with the inspector's facts; resource order is the order the inspector first reached each sidecar, which is fixed for identical bytes.
 * @evidence contracts/common.md#clear-and-simple-design Three fields: source identity, sidecar closure, and the inspector result passed through unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Copies the inspector result as returned and adds no semantic mapping or adoption decision.
 * @evidence contracts/common.md#meaningful-documentation States which command prints it, the resource order, and each identity's unit and digest.
 * @evidenceExclude contracts/performance.md#cost-and-resources A result record; its cost belongs to `inspectAutoMovieExternalProjectBytes`. One envelope per inspected source, printed once by the command. Holds metadata and the inspector facts; no byte buffer survives into it.
 * @author Samchon
 */
export interface IAutoMovieExternalProjectInspection {
  /** Structural facts returned by the ingest inspector under the fixed profile. */
  inspection: IAutoMovieExternalModelInspection;

  /** Sidecars opened during inspection, in the order the parser first reached them. */
  resources: IAutoMovieExternalProjectResource[];

  /** Primary source identity. */
  source: {
    /** Resident byte length of the primary source. */
    bytes: number;

    /** `sha256:` digest of the primary source bytes. */
    digest: AutoMovieContentDigest;

    /** Canonical `/`-separated project-relative source path. */
    path: string;
  };
}

/**
 *
 * Resolve one glTF sidecar URI to its canonical project-relative path.
 *
 * The declared URI is data, never a location the tool may open on its own
 * terms: a scheme, network path, query, fragment, backslash, or malformed
 * escape is refused before decoding is trusted, and the decoded relative path
 * must land inside the project namespace as one canonical spelling.
 *
 * The URI resolves against the source's directory, so `../` that stays inside
 * the project is accepted and one that leaves it throws. Canonical means
 * code-unit exact: a case variant and a `name:stream` suffix after the first
 * segment are not refused, so on Windows two accepted spellings can reach one
 * file, and a stream suffix reads an alternate data stream. Every refusal throws an `Error` naming the URI.
 *
 * @evidence contracts/common.md#principled-implementation Treats the URI as a relative reference: refuses query, fragment, scheme and network-path forms before decoding, decodes with `decodeURIComponent` (a malformed escape refuses), re-tests the decoded text, joins it to the source's POSIX directory, and requires the result to be a canonical project path.
 * @evidence contracts/common.md#clear-and-simple-design A pure function kept apart from inspection so the path policy is checkable alone; it re-validates `source` because it is exported and callable without the inspector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses a disallowed spelling instead of rewriting it, and names no asset; decoding before joining turns `%2F` into a separator, which this function accepts as a subdirectory.
 * @evidence contracts/common.md#meaningful-documentation States the resolution base, the `../` rule, the code-unit meaning of canonical with its Windows case and stream gaps, and the throw.
 * @evidence contracts/performance.md#cost-and-resources Linear in URI length: a few regular-expression tests, one decode, one join and one normalize. `inspectAutoMovieExternalProjectBytes` calls it once per resolve request and keys its read cache on the result; the resolution is cheap string work with nothing worth caching. Returns one normalized path string and keeps no state between calls, so nothing outlives the call.
 */
export const resolveAutoMovieExternalProjectResourcePath = (props: {
  /** Canonical project-relative model or motion path. */
  source: string;
  /** URI exactly as declared by the inspected glTF document. */
  uri: string;
}): string => {
  if (isCanonicalProjectPath(props.source) === false)
    throw new Error(
      `External inspection source ${JSON.stringify(props.source)} is not one canonical project-relative path.`,
    );
  if (
    props.uri.includes("?") ||
    props.uri.includes("#") ||
    SCHEME.test(props.uri) ||
    props.uri.startsWith("//")
  )
    throw new Error(
      `Sidecar URI ${JSON.stringify(props.uri)} must be a plain project-relative asset path.`,
    );
  let decoded: string;
  try {
    decoded = decodeURIComponent(props.uri);
  } catch {
    throw new Error(
      `Sidecar URI ${JSON.stringify(props.uri)} is not valid percent-encoding.`,
    );
  }
  if (
    decoded.startsWith("/") ||
    decoded.includes("\\") ||
    decoded.includes("?") ||
    decoded.includes("#") ||
    SCHEME.test(decoded)
  )
    throw new Error(
      `Sidecar URI ${JSON.stringify(props.uri)} must decode to one plain relative asset path.`,
    );
  const resolved = path.posix.join(path.posix.dirname(props.source), decoded);
  if (isCanonicalProjectPath(resolved) === false)
    throw new Error(
      `Sidecar URI ${JSON.stringify(props.uri)} escapes or aliases the project asset namespace.`,
    );
  return resolved;
};

/**
 *
 * Inspect one project-owned asset and retain the exact byte closure it used.
 *
 * Every sidecar is read once through the injected project reader, keyed by its
 * canonical path so two declared spellings of one file share one identity, and
 * the envelope records the primary and sidecar digests beside the inspector's
 * facts. The function performs no semantic mapping and no adoption decision.
 *
 * A non-canonical `source`, a refused sidecar URI, or an inspector failure
 * throws. A `null` from `readResource` is handed to the inspector, which owns
 * that refusal, and is not remembered.
 *
 * @evidence contracts/common.md#principled-implementation Delegates structure to `inspectAutoMovieExternalModelBytes` with a resolver that canonicalizes each URI, reads each canonical path once and digests its resident bytes with SHA-256, so the envelope's identities describe the exact bytes the inspector parsed.
 * @evidence contracts/common.md#clear-and-simple-design Reading is injected through `readResource`, so containment and native paths stay with `run`; parsing stays with the ingest inspector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplies no placeholder bytes for an absent sidecar, and the inspector's facts pass through unaltered.
 * @evidence contracts/common.md#meaningful-documentation States the read-once rule, the digests recorded, what throws, and how an absent sidecar is handled.
 * @evidence contracts/performance.md#cost-and-resources Cost is the inspector's parse plus one read and one SHA-256 per distinct sidecar and one for the source, linear in total bytes; `declaredUris.includes` is linear in the URIs already recorded for that path. A map keyed by canonical path lets two URIs naming one file share one read, digest and buffer; equivalence is canonical-path equality within one call, which assumes the file does not change during it, and an absent result is not cached, so a repeated absent path is read again. Retains every sidecar buffer in the local map until the call returns, growing with the distinct sidecars' total bytes with no cap; the returned records drop the buffers.
 */
export const inspectAutoMovieExternalProjectBytes = (props: {
  /** Canonical project-relative source path. */
  source: string;
  /** Exact primary source bytes. */
  bytes: Uint8Array;
  /** Explicit fixed ingest profile. */
  profile: AutoMovieExternalModelIngestProfile;
  /** Read one canonical project-relative sidecar, or return null when absent. */
  readResource: (relative: string) => Uint8Array | null;
}): IAutoMovieExternalProjectInspection => {
  if (isCanonicalProjectPath(props.source) === false)
    throw new Error(
      `External inspection source ${JSON.stringify(props.source)} is not one canonical project-relative path.`,
    );
  const resources = new Map<
    string,
    IAutoMovieExternalProjectResource & { resident: Uint8Array }
  >();
  const inspection = inspectAutoMovieExternalModelBytes({
    path: props.source,
    bytes: props.bytes,
    profile: props.profile,
    resolveResource: (uri) => {
      const relative = resolveAutoMovieExternalProjectResourcePath({
        source: props.source,
        uri,
      });
      const prior = resources.get(relative);
      if (prior !== undefined) {
        if (prior.declaredUris.includes(uri) === false)
          prior.declaredUris.push(uri);
        return prior.resident;
      }
      const resident = props.readResource(relative);
      if (resident === null) return null;
      resources.set(relative, {
        bytes: resident.byteLength,
        declaredUris: [uri],
        digest: digestAutoMovieBytes(resident),
        path: relative,
        resident,
      });
      return resident;
    },
  });
  return {
    source: {
      path: props.source,
      bytes: props.bytes.byteLength,
      digest: digestAutoMovieBytes(props.bytes),
    },
    resources: [...resources.values()].map(
      ({ resident: _resident, ...resource }) => resource,
    ),
    inspection,
  };
};
