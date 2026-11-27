/*
 * Split an extension name on underscores and recognize
 * material/materials/texture/textures segments case-insensitively.
 */
export function isAutoMovieMaterialExtension(name: string): boolean {
  return name
    .split("_")
    .some((segment: string): boolean =>
      MATERIAL_SEGMENTS.has(segment.toLowerCase()),
    );
}

const MATERIAL_SEGMENTS: ReadonlySet<string> = new Set([
  "material",
  "materials",
  "texture",
  "textures",
]);
