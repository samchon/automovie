import type { IAutoMovieCaptureRuntimeIdentity } from "@automovie/interface";
import { AUTOMOVIE_CAPTURE_RUNTIME_IDENTITY_PROTOCOL } from "./AUTOMOVIE_CAPTURE_RUNTIME_IDENTITY_PROTOCOL";
import { canonicalAutoMovieCaptureRuntimeIdentity } from "./canonicalAutoMovieCaptureRuntimeIdentity";

/**
 * Read one exactly canonical capture identity from a stored receipt or manifest.
 *
 * @evidence contracts/common.md#principled-implementation Parses a JSON object, checks the current identity version, delegates schema/closure/provenance admission and requires exact equality with the canonical encoding; noncanonical whitespace, ordering or duplicate members cannot acquire a second encoded identity.
 * @evidence contracts/common.md#clear-and-simple-design Owns stored-text admission while canonicalAutoMovieCaptureRuntimeIdentity owns structured runtime validation; repaint and project readers use this seam to reopen recorded provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No valid-looking digest bypasses complete identity validation, and JSON.parse's last-member behavior cannot admit duplicate-key input because canonical re-encoding differs from the supplied text.
 * @evidence contracts/common.md#meaningful-documentation States object/version admission and exact canonical text; throws on malformed or unsupported records and returns metadata, not a running or independently verified capture host.
 * @evidence contracts/performance.md#efficient-algorithms For B encoded bytes, JSON parsing and exact string comparison are linear, plus the delegated structured validator's package/metadata costs; the parsed tree and canonical string are temporary O(B) populations.
 * @evidence contracts/performance.md#reuse-equivalent-work One delegated validation supplies the canonical string for equality; no second parse or retained text cache assumes current host observations equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The admitted tree transfers to the caller and temporary text/validation references are released; parsing acquires no browser, file handle or task.
 */
export function parseAutoMovieCaptureRuntimeIdentity(
  encoded: string,
): IAutoMovieCaptureRuntimeIdentity {
  let value: unknown;
  try {
    value = JSON.parse(encoded) as unknown;
  } catch (error) {
    throw new Error(
      `Capture runtime identity is not JSON: ${String(error)}. Return canonical structured identity from the capture adapter.`,
    );
  }
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error(
      "Capture runtime identity must decode to one versioned JSON object.",
    );
  const protocolVersion: unknown = (value as Record<string, unknown>).protocolVersion;
  if (protocolVersion !== AUTOMOVIE_CAPTURE_RUNTIME_IDENTITY_PROTOCOL)
    throw new Error(
      `Unsupported AutoMovie capture runtime identity protocol ${JSON.stringify(
        protocolVersion,
      )}; expected ${AUTOMOVIE_CAPTURE_RUNTIME_IDENTITY_PROTOCOL}.`,
    );
  const canonical: string = canonicalAutoMovieCaptureRuntimeIdentity(
    value as IAutoMovieCaptureRuntimeIdentity,
  );
  if (canonical !== encoded)
    throw new Error(
      "Capture runtime identity is not canonical JSON. Encode it with canonicalAutoMovieCaptureRuntimeIdentity.",
    );
  return value as IAutoMovieCaptureRuntimeIdentity;
}
