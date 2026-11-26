import { AutoMovieEngineCanonicalJsonError } from "../AutoMovieEngineCanonicalJsonError";
import { AutoMovieEngineText } from "../AutoMovieEngineText";

/**
 * Encode a supplied value under automovie.canonical-json.v2 for shared identity
 * consumers.
 */
export function canonicalizeAutoMovieJson(value: unknown): string {
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
      return JSON.stringify(current);
    }
    if (typeof current === "bigint")
      throw new AutoMovieEngineCanonicalJsonError(
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
            throw new AutoMovieEngineCanonicalJsonError(
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
      throw new AutoMovieEngineCanonicalJsonError(
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
        .sort(AutoMovieEngineText.compareCodeUnits)
        .flatMap((key: string): string[] => {
          assertScalarString(key, "member name");
          const descriptor: PropertyDescriptor =
            Object.getOwnPropertyDescriptor(record, key)!;
          if ("value" in descriptor === false)
            throw new AutoMovieEngineCanonicalJsonError(
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
    throw new AutoMovieEngineCanonicalJsonError(
      "unsupported-value",
      "the root must have a JSON representation",
    );
  return encoded;
}

/** Refuse cycles while permitting repeated, non-recursive references. */
const enterCanonicalContainer: (active: Set<object>, value: object) => void = (
  active: Set<object>,
  value: object,
): void => {
  if (active.has(value))
    throw new AutoMovieEngineCanonicalJsonError(
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
        throw new AutoMovieEngineCanonicalJsonError(
          "invalid-unicode",
          `${role} ends with a lone high surrogate`,
        );
      const trail: number = value.charCodeAt(index + 1);
      if (trail < 0xdc00 || trail > 0xdfff)
        throw new AutoMovieEngineCanonicalJsonError(
          "invalid-unicode",
          `a lone surrogate occurs in ${role}`,
        );
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff)
      throw new AutoMovieEngineCanonicalJsonError(
        "invalid-unicode",
        `a lone surrogate occurs in ${role}`,
      );
  }
};
