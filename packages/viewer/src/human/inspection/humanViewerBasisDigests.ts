/**
 * The 12-hex-digit file digests a basis token names after its prefix, `<prefix>@<d1>[.<d2>]`. The caller classifies the token's prefix; this suffix parser refuses a different digest count or lowercase-hex form.
 *
 * @evidence contracts/common.md#principled-implementation Suffix parsing enforces the requested digest count and twelve lowercase hex digits after the caller-classified prefix.
 * @evidence contracts/common.md#clear-and-simple-design A single suffix split and digit check adapt the fixed basis token grammar without filesystem access.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only suffix shape is admitted here; caller prefix classification and actual file-byte verification remain separate authorities.
 * @evidence contracts/common.md#meaningful-documentation The comment defines suffix grammar, exact count and caller-owned prefix classification instead of promising complete token or asset validation.
 * @evidence contracts/performance.md#efficient-algorithms Splitting and validating tokens is linear in token length and requested digest count.
 * @evidence contracts/performance.md#reuse-equivalent-work Each token is parsed independently; this helper retains no expensive derived result or memo.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned digest strings survive the invocation, with no file, buffer or network resource retained.
 *
 * @author Samchon
 */
export function humanViewerBasisDigests(
  token: string,
  prefix: string,
  count: number,
): string[] {
  const digests: string[] = token.slice(prefix.length + 1).split(".");
  if (
    digests.length !== count ||
    digests.some((digest: string): boolean => !/^[0-9a-f]{12}$/.test(digest))
  )
    throw new Error(
      `A ${prefix} basis token names ${count} 12-digit file digest(s): ${token}`,
    );
  return digests;
}
