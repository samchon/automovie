import { canonicalizeJson } from "./internal/canonicalizeJson";

/** The Engine canonical JSON identity operation. */
export namespace AutoMovieEngineCanonicalJson {
  /** Encode a supplied value under automovie.canonical-json.v2 for shared identity consumers. */
  export function canonicalize(value: unknown): string {
    return canonicalizeJson(value);
  }
}
