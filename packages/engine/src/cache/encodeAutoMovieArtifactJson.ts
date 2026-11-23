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
