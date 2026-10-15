import type { IAutoMovieColor, IAutoMovieMaterial } from "@automovie/interface";


/**
 * Base colour of the material a population instance's `palette-material-index` trait selects, or
 * undefined without the trait. Throws for an out-of-range index or a colour channel outside (0, 1].
 */
export function instancePaletteReference(
  materials: readonly IAutoMovieMaterial[],
  traits: Readonly<Record<string, number>>,
  address: string,
): IAutoMovieColor | undefined {
  const index = traits["palette-material-index"];
  if (index === undefined) return undefined;
  if (!Number.isInteger(index) || index < 0 || index >= materials.length)
    throw new Error(`${address}: invalid palette material index ${index}`);
  const color = materials[index].baseColor;
  for (const channel of [color.r, color.g, color.b])
    if (!Number.isFinite(channel) || channel <= 0 || channel > 1)
      throw new Error(`${address}: palette reference RGB must be in (0, 1]`);
  return color;
}
