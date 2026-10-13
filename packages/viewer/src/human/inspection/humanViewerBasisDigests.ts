/**
 * The 12-hex-digit file digests a basis token names after its prefix,
 * `<prefix>@<d1>[.<d2>]`. The caller classifies the token's prefix; this
 * suffix parser refuses a different digest count or lowercase-hex form.
 *
 * @evidence contracts/common.md#principled-implementation Splits the suffix at the caller's classified prefix boundary and admits exactly the required count of twelve lowercase hexadecimal characters.
 * @evidence contracts/common.md#clear-and-simple-design One parser supplies the one-file and paired publication token readers while prefix dispatch remains with their caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest syntax is the existing publication protocol, not a subject identifier or an expected asset hash.
 * @evidence contracts/common.md#meaningful-documentation States the caller's prefix-classification precondition, suffix grammar and named refusal for a malformed digest list.
 *
 * @author Samchon
 */
export function humanViewerBasisDigests(
  token: string,
  prefix: string,
  count: number,
): string[] {
  const digests = token.slice(prefix.length + 1).split(".");
  if (
    digests.length !== count ||
    digests.some((digest) => !/^[0-9a-f]{12}$/.test(digest))
  )
    throw new Error(
      `A ${prefix} basis token names ${count} 12-digit file digest(s): ${token}`,
    );
  return digests;
}
