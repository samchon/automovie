import type { AutoMovieContentDigest } from "@automovie/interface";

/** Repeat the authored hexadecimal seed into a fixture digest; no bytes are hashed and arbitrary seeds are not validated. */
export const lineageDigest: (seed: string) => AutoMovieContentDigest = (seed: string): AutoMovieContentDigest =>
  `sha256:${seed.repeat(64).slice(0, 64)}`;
