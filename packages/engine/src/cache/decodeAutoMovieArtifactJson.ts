/**
 * Decode artifact bytes written by `encodeAutoMovieArtifactJson`, restoring the
 * tagged `-0`, `NaN` and infinities.
 *
 * The caller states the type it stored; the bytes carry no schema, so a stage
 * that changes its output shape must bump its key version, which makes old
 * entries unreachable.
 *
 * @param bytes UTF-8 JSON from the encoder.
 * @returns The decoded value, owned by the caller.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A JSON reviver replaces exactly the `{"$number": tag}` objects the encoder writes, and the encoder refuses plain objects owning that member, so no data object is mistaken for a tag.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The inverse of the generic encoder, kept beside it; stage types stay with their owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Malformed text or an unknown tag throws instead of producing a partial value.
 * @evidence contracts/development/implementation.md#efficient-algorithms One UTF-8 decode and one parse, linear in byte length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure codec coordinates no work.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the decoded text only for the call.
 * @evidence contracts/development/common.md#meaningful-documentation States the restored numbers, the type premise and the versioning consequence.
 */
export function decodeAutoMovieArtifactJson<T>(bytes: Uint8Array): T {
  return JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    (_key: string, item: unknown): unknown => {
      if (
        item === null ||
        typeof item !== "object" ||
        Array.isArray(item) ||
        !Object.prototype.hasOwnProperty.call(item, "$number")
      )
        return item;
      const tag: unknown = (item as { $number: unknown }).$number;
      if (Object.keys(item).length !== 1 || !(typeof tag === "string" && tag in NUMBERS))
        throw new Error(`Unknown artifact JSON number tag ${String(tag)}`);
      return NUMBERS[tag]!;
    },
  ) as T;
}

/** The numbers JSON cannot spell, by their tag. */
const NUMBERS: Readonly<Record<string, number>> = {
  "-0": -0,
  NaN: Number.NaN,
  Infinity: Number.POSITIVE_INFINITY,
  "-Infinity": Number.NEGATIVE_INFINITY,
};
