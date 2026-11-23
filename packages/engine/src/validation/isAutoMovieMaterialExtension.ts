/**
 * Split an extension name on underscores and recognize
 * material/materials/texture/textures segments case-insensitively.
 */
export const isAutoMovieMaterialExtension: (name: string) => boolean = (
  name: string,
): boolean =>
  name
    .split("_")
    .some((segment: string): boolean =>
      MATERIAL_SEGMENTS.has(segment.toLowerCase()),
    );

const MATERIAL_SEGMENTS: ReadonlySet<string> = new Set([
  "material",
  "materials",
  "texture",
  "textures",
]);
