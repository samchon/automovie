/**
 * Encode a plain data value as artifact bytes that `decodeAutoMovieArtifactJson`
 * restores exactly.
 *
 * JSON alone loses `-0`, `NaN` and the infinities and silently flattens typed
 * arrays, maps and class instances, any of which would make a cached result
 * differ from a computed one. This encoder writes the four special numbers as
 * `{"$number": "-0" | "NaN" | "Infinity" | "-Infinity"}` and refuses every
 * value that is not `null`, a boolean, a string, a finite number, an array or a
 * plain object (prototype `Object.prototype` or `null`), and any plain object
 * owning a `$number` member, so whatever it accepts decodes to a deeply equal
 * value. Object member order is kept; `undefined` members are omitted as JSON
 * omits them, and an `undefined` array element refuses. Shared references are
 * written once per occurrence, so identity between branches is not preserved.
 *
 * @param value Plain data to encode.
 * @returns UTF-8 JSON bytes.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A JSON replacer tags exactly the numbers RFC 8259 cannot represent, and a structural check before serialization refuses values JSON would silently change, so encode then decode is the identity on every accepted value.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One generic codec beside the artifact resolver serves every stage whose output is plain data; stages own their types.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unsupported values throw with their path instead of being coerced.
 * @evidence contracts/development/implementation.md#efficient-algorithms One traversal to validate and one to serialize, linear in the value's size.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure codec coordinates no work.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the JSON text and the returned bytes only for the call.
 * @evidence contracts/development/common.md#meaningful-documentation States the tagged numbers, the accepted value domain, ordering, undefined handling and lost reference identity.
 */
export function encodeAutoMovieArtifactJson(value: unknown): Uint8Array {
  check(value, "$");
  return new TextEncoder().encode(
      JSON.stringify(value, (_key: string, item: unknown): unknown =>
        typeof item === "number" && (!Number.isFinite(item) || Object.is(item, -0))
          ? { $number: Object.is(item, -0) ? "-0" : String(item) }
          : item,
      ),
  );
}

/** Refuse anything the tagged JSON form would not restore exactly. */
const check: (value: unknown, at: string) => void = (
  value: unknown,
  at: string,
): void => {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string" ||
    typeof value === "number"
  )
    return;
  if (Array.isArray(value)) {
    for (let index: number = 0; index < value.length; ++index) {
      if (value[index] === undefined)
        throw new Error(`Artifact JSON cannot hold undefined at ${at}[${index}]`);
      check(value[index], `${at}[${index}]`);
    }
    return;
  }
  const prototype: unknown =
    typeof value === "object" ? Object.getPrototypeOf(value) : undefined;
  if (prototype !== Object.prototype && prototype !== null)
    throw new Error(`Artifact JSON holds only plain data; ${at} is not`);
  if (Object.prototype.hasOwnProperty.call(value, "$number"))
    throw new Error(`Artifact JSON reserves the $number member at ${at}`);
  for (const [key, item] of Object.entries(value as object))
    if (item !== undefined) check(item, `${at}.${key}`);
};
