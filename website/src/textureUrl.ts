/**
 * Resolve native texture paths beneath the building base after stripping leading slashes. Require the textures prefix and refuse literal parent segments; the first-party producer must supply canonical path segments because percent-encoded traversal is not decoded by this guard.
 *
 * @evidence contracts/common.md#principled-implementation Prefix and literal-segment checks express the native texture directory convention before standard URL resolution; this is not a security containment check for arbitrary encoded URLs.
 * @evidence contracts/common.md#clear-and-simple-design URL adaptation belongs with scene loading so producer-relative texture names work under the website's relative mount path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supported leading-root paths are normalized uniformly; rejected paths do not trigger a fallback image or domain-root request.
 * @evidence contracts/common.md#meaningful-documentation The comment states building-relative behavior, refused literal segments and the canonical producer-path premise.
 * @evidence contracts/performance.md#efficient-algorithms Replacement, segment inspection and URL parsing cost O(A + B) in asset and base lengths, with linear temporary string and segment storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Resolution is pure per asset/base pair without retained caching; the scene loader owns any reuse of loaded textures.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No fetch or texture is acquired here; the caller owns the returned URL string.
 */
export const textureUrl: (asset: string, base: string) => string = (
  asset: string,
  base: string,
): string => {
  const relative: string = asset.replace(/^\/+/, "");
  if (!relative.startsWith("textures/") || relative.split("/").includes(".."))
    throw new Error(`Invalid production texture: ${asset}`);
  return new URL(relative, base).href;
};
