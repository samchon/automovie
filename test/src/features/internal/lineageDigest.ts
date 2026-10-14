/** Repeat the authored hexadecimal seed into a fixture digest; no bytes are hashed and arbitrary seeds are not validated. */
export const lineageDigest: (seed: string) => string = (seed: string): string =>
  `sha256:${seed.repeat(64).slice(0, 64)}`;
