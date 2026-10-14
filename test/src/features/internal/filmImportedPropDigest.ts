/** Synthetic digest-shaped text from the supplied fill, without hashing or an identity guarantee. */
export function filmImportedPropDigest(fill: string): `sha256:${string}` {
  return `sha256:${fill.repeat(64).slice(0, 64)}`;
}
