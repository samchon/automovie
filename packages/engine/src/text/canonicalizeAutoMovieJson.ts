import { AutoMovieCanonicalJsonError } from "./AutoMovieCanonicalJsonError";
import { compareCodeUnits } from "./compareCodeUnits";

/**
 * Encode a supplied value under automovie.canonical-json.v2 for shared identity consumers.
 *
 * @evidence contracts/common.md#principled-implementation Finite JSON numbers and Unicode scalar strings use JSON escaping, object keys sort by UTF-16 units, unsupported array slots become null and unsupported object values are omitted; an ancestry set rejects cycles while permitting repeated nonrecursive references.
 * @evidence contracts/common.md#clear-and-simple-design One browser-compatible engine owner serves production and viewer identity, with closed domain refusals separated from hashing and byte encoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Own data descriptors avoid invoking ordinary getters, but Proxy reflection traps can execute. Arrays are admitted before prototype inspection, while non-array objects require this realm's Object.prototype or null; no depth or output-size budget is enforced.
 * @evidence contracts/common.md#meaningful-documentation Documents holes, omitted members, finite/Unicode refusal, accepted container prototypes and typed domain failures; allocation, recursion and Proxy failures can remain ordinary host errors.
 * @evidence contracts/performance.md#efficient-algorithms Traversal covers every encoded occurrence and string unit, plus sum(K log K) key sorting per object; repeated shared subtrees are re-encoded, intermediate text grows with output and recursion depth is unbounded.
 * @evidence contracts/performance.md#reuse-equivalent-work The comparator and Unicode admission are shared within encoding; ancestry is path-local rather than a memoization cache, so cycles fail and repeated references retain ordinary JSON tree expansion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned text; the call-local ancestry set removes entered containers in finally on success or failure, and no partial text or host handle is published.
 */
export const canonicalizeAutoMovieJson: (value: unknown) => string = (
  value: unknown,
): string => {
  const active: Set<object> = new Set<object>();
  const encode: (current: unknown, arrayItem: boolean) => string | undefined = (
    current: unknown,
    arrayItem: boolean,
  ): string | undefined => {
    if (
      current === undefined ||
      typeof current === "function" ||
      typeof current === "symbol"
    )
      return arrayItem ? "null" : undefined;
    if (current === null || typeof current === "boolean")
      return JSON.stringify(current);
    if (typeof current === "string") {
      assertScalarString(current, "value");
      return JSON.stringify(current);
    }
    if (typeof current === "number") {
      if (Number.isFinite(current) === false)
        throw new AutoMovieCanonicalJsonError(
          "unsupported-value",
          "numbers must be finite",
        );
      return JSON.stringify(current);
    }
    if (typeof current === "bigint")
      throw new AutoMovieCanonicalJsonError(
        "unsupported-value",
        "bigint has no JSON representation",
      );
    if (Array.isArray(current)) {
      enterCanonicalContainer(active, current);
      try {
        const items: string[] = [];
        for (let index: number = 0; index < current.length; ++index) {
          if (!Object.prototype.hasOwnProperty.call(current, index)) {
            items.push("null");
            continue;
          }
          const descriptor: PropertyDescriptor =
            Object.getOwnPropertyDescriptor(current, index)!;
          if ("value" in descriptor === false)
            throw new AutoMovieCanonicalJsonError(
              "accessor-property",
              "array slots must be data properties",
            );
          items.push(encode(descriptor.value, true)!);
        }
        return `[${items.join(",")}]`;
      } finally {
        active.delete(current);
      }
    }
    // Every JavaScript value the branches above did not return for is an
    // object, so no further type test can fail here.
    const container: object = current as object;
    const prototype: unknown = Object.getPrototypeOf(container);
    if (prototype !== Object.prototype && prototype !== null)
      throw new AutoMovieCanonicalJsonError(
        "non-plain-container",
        "only plain objects and arrays are admitted",
      );
    enterCanonicalContainer(active, container);
    const record: Record<string, unknown> = container as Record<
      string,
      unknown
    >;
    try {
      const entries: string[] = Object.keys(record)
        .sort(compareCodeUnits)
        .flatMap((key: string): string[] => {
          assertScalarString(key, "member name");
          const descriptor: PropertyDescriptor =
            Object.getOwnPropertyDescriptor(record, key)!;
          if ("value" in descriptor === false)
            throw new AutoMovieCanonicalJsonError(
              "accessor-property",
              "object members must be data properties",
            );
          const encoded: string | undefined = encode(descriptor.value, false);
          return encoded === undefined
            ? []
            : [`${JSON.stringify(key)}:${encoded}`];
        });
      return `{${entries.join(",")}}`;
    } finally {
      active.delete(container);
    }
  };
  const encoded: string | undefined = encode(value, false);
  if (encoded === undefined)
    throw new AutoMovieCanonicalJsonError(
      "unsupported-value",
      "the root must have a JSON representation",
    );
  return encoded;
};

/** Refuse cycles while permitting repeated, non-recursive references. */
const enterCanonicalContainer: (active: Set<object>, value: object) => void = (
  active: Set<object>,
  value: object,
): void => {
  if (active.has(value))
    throw new AutoMovieCanonicalJsonError(
      "cyclic-value",
      "a container refers to itself through its active ancestry",
    );
  active.add(value);
};

/** JSON escape syntax can encode lone surrogates, but this protocol cannot. */
const assertScalarString: (value: string, role: string) => void = (
  value: string,
  role: string,
): void => {
  for (let index: number = 0; index < value.length; ++index) {
    const unit: number = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      if (index + 1 >= value.length)
        throw new AutoMovieCanonicalJsonError(
          "invalid-unicode",
          `${role} ends with a lone high surrogate`,
        );
      const trail: number = value.charCodeAt(index + 1);
      if (trail < 0xdc00 || trail > 0xdfff)
        throw new AutoMovieCanonicalJsonError(
          "invalid-unicode",
          `a lone surrogate occurs in ${role}`,
        );
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff)
      throw new AutoMovieCanonicalJsonError(
        "invalid-unicode",
        `a lone surrogate occurs in ${role}`,
      );
  }
};
