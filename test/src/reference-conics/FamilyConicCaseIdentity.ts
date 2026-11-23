import { createHash } from "node:crypto";

/** Exact metadata identities shared by the production preflight and its capture consumer. */
export namespace FamilyConicCaseIdentity {
  /** Canonical JSON preserves array order and finite values, with ordinal object-key order. */
  function canonical(value: unknown): string {
    if (value === null) return "null";
    if (typeof value === "number" && !Number.isFinite(value))
      throw new Error("Case identity contains a nonfinite number");
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (typeof value === "object") {
      const entries: [string, unknown][] = Object.entries(value);
      entries.sort((a: [string, unknown], b: [string, unknown]): number =>
        a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
      );
      return (
        "{" +
        entries
          .map(
            ([key, item]: [string, unknown]): string =>
              JSON.stringify(key) + ":" + canonical(item),
          )
          .join(",") +
        "}"
      );
    }
    const encoded: string | undefined = JSON.stringify(value);
    if (encoded === undefined)
      throw new Error("Case identity is not JSON data");
    return encoded;
  }

  /**
   * SHA-256 of exact bytes, without parsing, rounding or a geometry read.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Node SHA-256 consumes the provided exact byte/string sequence and returns its hexadecimal digest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One digest operation owns the byte recipe for both producers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No numerical tolerance, source alias or inferred identity replaces byte content.
   * @evidence contracts/development/common.md#meaningful-documentation Strings use Node's UTF-8 input convention and the digest is exact-byte evidence.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear byte work retains the native digest state only.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No prepared resource or repeated calculation is coordinated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local digest is released on return; no cache or file handle exists.
   */
  export function byteHash(value: Buffer | string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  /**
   * SHA-256 of finite JSON data with ordinal keys, unchanged array order and no rounding.
   *
   * @evidence contracts/development/implementation.md#principled-implementation One recursive canonical JSON recipe fixes object insertion-order differences while preserving array order and finite numerical values.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Canonical serialization precedes the shared byte digest.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonfinite and non-JSON values fail rather than becoming null or an absent field; no geometry is measured.
   * @evidence contracts/development/common.md#meaningful-documentation Names ordinal object order, ordered arrays and finite JSON as this metadata domain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Serialization work is linear in data size apart from per-object key sorting; retained text is proportional to the input.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work NativeRound and capture import this single recipe rather than maintaining different field digests.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the digest string survives the call; no cache or mutable input is retained.
   */
  export function dataHash(value: unknown): string {
    return byteHash(canonical(value));
  }
}
