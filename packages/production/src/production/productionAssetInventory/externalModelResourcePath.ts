import path from "node:path";
import { isCanonicalAssetPath } from "./isCanonicalAssetPath";

/**
 * Resolve one plain sidecar URI against its model's POSIX directory and lexical asset namespace.
 *
 * @evidence contracts/common.md#principled-implementation Rejects schemes, network/query/fragment spellings and malformed percent encoding, then rejects decoded absolute/backslash/query/fragment forms before normalized relative joining and canonical-path admission.
 * @evidence contracts/common.md#clear-and-simple-design Model and motion resource callbacks share one URI-to-ledger-path rule rather than independently resolving sidecars.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This is lexical path resolution, not realpath/symlink containment or all Windows filename admission; physical content ownership remains the supplied inventory's responsibility.
 * @evidence contracts/common.md#meaningful-documentation Names accepted relative URI forms, decoding failures and unchanged source URI in refusal text.
 * @evidence contracts/performance.md#efficient-algorithms URI checks, percent decoding, dirname/join/normalization and segment checks scan path text with input-sized temporary strings.
 * @evidence contracts/performance.md#reuse-equivalent-work No filesystem resolution or URI cache is consulted; each source/URI pair resolves under its actual textual directory.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the resolved string escapes; no filesystem/network handle or retained resource bytes are acquired.
 *
 * @author Samchon
 */
export function externalModelResourcePath(modelPath: string, uri: string): string {
  if (
    uri.includes("?") ||
    uri.includes("#") ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(uri) ||
    uri.startsWith("//")
  )
    throw new Error(
      `Sidecar URI "${uri}" must be a plain project-relative asset path.`,
    );
  let decoded: string;
  try {
    decoded = decodeURIComponent(uri);
  } catch {
    throw new Error(`Sidecar URI "${uri}" is not valid percent-encoding.`);
  }
  if (
    decoded.startsWith("/") ||
    decoded.includes("\\") ||
    decoded.includes("?") ||
    decoded.includes("#") ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(decoded)
  )
    throw new Error(
      `Sidecar URI "${uri}" must decode to one plain relative asset path.`,
    );
  const resolved: string = path.posix.join(path.posix.dirname(modelPath), decoded);
  if (isCanonicalAssetPath(resolved) === false)
    throw new Error(
      `Sidecar URI "${uri}" escapes or aliases the project asset namespace.`,
    );
  return resolved;
}
