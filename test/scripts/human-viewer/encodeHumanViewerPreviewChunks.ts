/**
 * Numerical cache JSON in bounded, Unicode-safe pieces. The scene can give
 * these pieces to Blob without retaining a full JSON string or copies of all
 * typed-array elements in its renderer heap. The field projection and JSON
 * value semantics are shared with the legacy string encoder.
 */

/**
 * Encode the numerical preview projection without a whole-array conversion.
 * Pieces end between JSON tokens or Unicode code points, so encoding each
 * piece as UTF-8 preserves surrogate pairs. Typed arrays keep the existing
 * Float32/Uint32 tags; ordinary JSON objects retain their property order.
 *
 * @evidence contracts/common.md#principled-implementation JSON tokens and native primitive escaping preserve the existing value representation; typed-array iteration avoids an additional complete numeric array.
 * @evidence contracts/common.md#clear-and-simple-design One projected serializer serves both Blob persistence and the compatible string encoder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Chunk boundaries affect transport allocation only, without discarding vertices, metadata or numerical precision.
 * @evidence contracts/common.md#meaningful-documentation Defines projection, Unicode boundaries, typed-array tags and ownership.
 */
export function* encodeHumanViewerPreviewChunks(value: {
  operation: string;
  model?: unknown;
  articulation?: unknown;
  contact?: unknown;
  crossings?: unknown;
  extras?: unknown;
  anatomy?: unknown;
}): Generator<string> {
  if (value.operation !== "preview" || value.model === undefined)
    throw new Error("Only numerical previews are cached");
  const projection = {
    operation: "preview",
    model: value.model,
    articulation: value.articulation,
    contact: value.contact,
    crossings: value.crossings,
    extras: value.extras,
    anatomy: value.anatomy,
  };
  const ancestors = new Set<object>();
  const omitted = (entry: unknown): boolean =>
    entry === undefined || typeof entry === "function" || typeof entry === "symbol";
  const prepare = (entry: unknown, key: string): unknown => {
    if (entry !== null && (typeof entry === "object" || typeof entry === "function" || typeof entry === "bigint")) {
      const json = (entry as { toJSON?: (key: string) => unknown }).toJSON;
      if (typeof json === "function") return json.call(entry, key);
    }
    return entry;
  };
  function* string(entry: string): Generator<string> {
    yield '"';
    for (const point of entry) yield JSON.stringify(point).slice(1, -1);
    yield '"';
  }
  function* write(entry: unknown): Generator<string> {
    // Intrinsic slot reads also recognize wrappers from another realm, without
    // consulting a spoofable toStringTag or user-overridden valueOf method.
    if (entry !== null && typeof entry === "object" && !Array.isArray(entry) &&
      !(entry instanceof Float32Array) && !(entry instanceof Uint32Array)) {
      const readers: ((this: unknown) => unknown)[] = [Number.prototype.valueOf,
        String.prototype.valueOf, Boolean.prototype.valueOf, BigInt.prototype.valueOf];
      for (const read of readers) {
        let primitive: unknown;
        try { primitive = read.call(entry); } catch { continue; }
        // JSON's abstract ToNumber refuses BigInt; Number() would accept it.
        entry = typeof primitive === "number" ? +(entry as unknown as number) :
          typeof primitive === "string" ? String(entry) : primitive;
        break;
      }
    }
    if (entry === null || typeof entry === "number" || typeof entry === "boolean") {
      yield JSON.stringify(entry);
      return;
    }
    if (typeof entry === "string") {
      yield* string(entry);
      return;
    }
    if (typeof entry === "bigint") throw new TypeError("Cannot serialize BigInt");
    const object = entry as object;
    if (ancestors.has(object)) throw new TypeError("Converting circular structure to JSON");
    ancestors.add(object);
    try {
      if (entry instanceof Float32Array || entry instanceof Uint32Array) {
        yield entry instanceof Float32Array ? '{"$array":"Float32","values":[' : '{"$array":"Uint32","values":[';
        let first = true;
        for (const item of entry) {
          if (!first) yield ",";
          first = false;
          yield* write(item);
        }
        yield "]}";
      } else if (Array.isArray(entry)) {
        yield "[";
        // Snapshot LengthOfArrayLike once, including Proxy/boxed coercion.
        const numericLength = +entry.length;
        const length = Number.isNaN(numericLength) || numericLength <= 0 ? 0 :
          Math.min(Math.trunc(numericLength), Number.MAX_SAFE_INTEGER);
        for (let at = 0; at < length; ++at) {
          if (at !== 0) yield ",";
          const item = prepare(entry[at], String(at));
          yield* write(omitted(item) ? null : item);
        }
        yield "]";
      } else {
        yield "{";
        let first = true;
        for (const key of Object.keys(object)) {
          const item = prepare((object as Record<string, unknown>)[key], key);
          if (omitted(item)) continue;
          if (!first) yield ",";
          first = false;
          yield* string(key);
          yield ":";
          yield* write(item);
        }
        yield "}";
      }
    } finally {
      ancestors.delete(object);
    }
  }
  let chunk = "";
  for (const token of write(projection)) {
    if (chunk.length + token.length > 4096) {
      yield chunk;
      chunk = "";
    }
    chunk += token;
  }
  if (chunk !== "") yield chunk;
}
