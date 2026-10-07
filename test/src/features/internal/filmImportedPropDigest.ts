/** Preserve the original synthetic sealed digest, distinct per authored byte identity. */
export const filmImportedPropDigest = (fill: string): `sha256:${string}` =>
  `sha256:${fill.repeat(64).slice(0, 64)}`;
