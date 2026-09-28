import type { IAutoMovieColor, IAutoMovieMaterial } from "@automovie/interface";

/** Resolves only the declared common tint reference of the selected native model.
 * Owner: docs/materials/001-binding-and-scale.md#surface-bindings. */
export function instancePaletteReference(
  materials: readonly IAutoMovieMaterial[],
  traits: Readonly<Record<string, number>>,
  address: string,
): IAutoMovieColor | undefined {
  const index = traits["palette-material-index"];
  if (index === undefined) return undefined;
  if (!Number.isInteger(index) || index < 0 || index >= materials.length)
    throw Error(`${address}: invalid palette material index ${index}`);
  const color = materials[index].baseColor;
  for (const channel of [color.r, color.g, color.b])
    if (!Number.isFinite(channel) || channel <= 0 || channel > 1)
      throw Error(`${address}: palette reference RGB must be in (0, 1]`);
  return color;
}
