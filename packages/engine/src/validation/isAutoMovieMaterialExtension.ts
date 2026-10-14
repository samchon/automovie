/**
 * Split an extension name on underscores and recognize material/materials/texture/textures segments case-insensitively.
 *
 * @evidence contracts/common.md#principled-implementation Split an extension name on underscores and recognize material/materials/texture/textures segments case-insensitively.
 * @evidence contracts/common.md#clear-and-simple-design Classification separates material/texture concerns from geometry, light and container extensions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This categorizes names, including unsupported encodings; it is not a supported-extension membership test.
 * @evidence contracts/common.md#meaningful-documentation The distinction between belonging to this warning gate and being implemented is explicit.
 * @evidence contracts/performance.md#efficient-algorithms S name characters are split/scanned in O(S), with proportional temporary segment storage.
 * @evidence contracts/performance.md#reuse-equivalent-work A fixed four-word segment set is shared, while each current name is classified anew.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the fixed vocabulary remains resident; no asset or transcoder is acquired.
 */
export const isAutoMovieMaterialExtension: (name: string) => boolean = (name: string): boolean =>
  name
    .split("_")
    .some((segment: string): boolean => MATERIAL_SEGMENTS.has(segment.toLowerCase()));

const MATERIAL_SEGMENTS: ReadonlySet<string> = new Set([
  "material",
  "materials",
  "texture",
  "textures",
]);
