import { canonicalizeJson } from "./internal/canonicalizeJson";

/** The Engine canonical JSON identity operation. */
export namespace AutoMovieEngineCanonicalJson {
  /**
   * Encode data as compact automovie.canonical-json.v2 text.
   *
   * Object records use enumerable own string keys sorted by UTF-16 code
   * units, and arrays keep their index order. Undefined, function and symbol
   * entries are omitted from records and become null in arrays. Array holes
   * also become null. Numbers follow JSON spelling, including null for
   * nonfinite values.
   *
   * Accepted containers are arrays and plain records with data properties.
   * Unsupported roots, bigint, cycles, accessor slots and lone surrogates
   * throw AutoMovieEngineCanonicalJsonError. Repeated references outside the
   * active ancestry are encoded wherever they occur.
   */
  export function canonicalize(value: unknown): string {
    return canonicalizeJson(value);
  }
}
