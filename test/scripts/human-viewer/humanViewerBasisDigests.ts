/**
 * The 12-hex-digit file digests a basis token names after its prefix,
 * `<prefix>@<d1>[.<d2>]`. A token with another count or form refuses by name.
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
