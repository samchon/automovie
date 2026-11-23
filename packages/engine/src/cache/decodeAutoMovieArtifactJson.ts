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
      if (
        Object.keys(item).length !== 1 ||
        !(typeof tag === "string" && tag in NUMBERS)
      )
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
