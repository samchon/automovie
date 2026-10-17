import { IHumanViewerSession } from "./IHumanViewerSession";

/**
 * SHA-256 of the four documents a render depends on, as lowercase hex.
 *
 * The identity, pose, expression and appearance are serialized as JSON with object keys sorted at every depth, so two sessions holding equal skin documents hash equally whatever order their keys were written in, while meaningful array order is kept. Traits are editing history. Separate curve selection and named measurements are recorded in capture construction metadata and are not part of this skin-document digest. The digest is Web Crypto's, available in a secure context such as `127.0.0.1`.
 *
 * @param session Session whose render documents are hashed
 * @returns 64 hexadecimal characters
 *
 * @evidence contracts/common.md#principled-implementation Canonical JSON with recursively sorted object keys and preserved array order, digested by the standard SHA-256 of Web Crypto; equal documents give equal text, so equal digests.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the canonical form and the digest; callers record the result beside captures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hashes the four declared skin documents; traits and the separately recorded construction selection do not authorize a skin render equivalence claim. Numbers keep JSON's shortest round-trip text.
 * @evidence contracts/common.md#meaningful-documentation States the hashed documents, canonicalization, excluded traits, output format and the secure-context requirement.
 * @evidence contracts/performance.md#efficient-algorithms One traversal of the documents plus one digest, linear in their size; key sorting is per object and small.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call hashes its argument; capture calls it once per capture set.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds only the serialized text until the digest resolves.
 */
export async function hashHumanViewerSession(
  session: IHumanViewerSession,
): Promise<string> {
  const text: string = JSON.stringify(
    canonical({
      identity: session.identity,
      pose: session.pose,
      expression: session.expression,
      appearance: session.appearance,
    }),
  );
  const digest: ArrayBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((byte: number): string => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Copy a JSON value with object keys sorted at every depth. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
        .map((key: string): [string, unknown] => [
          key,
          canonical((value as Record<string, unknown>)[key]),
        ]),
    );
  return value;
}
