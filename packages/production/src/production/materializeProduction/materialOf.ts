import { IAutoMovieModel, IAutoMovieModelRecipe } from "@automovie/interface";
import { srgbHexToLinearColor } from "@automovie/engine";
import { compareCodeUnits } from "../contentIdentity";

/**
 * Select the first code-unit-ordered palette swatch and decode its sRGB value into the existing neutral material defaults.
 *
 * @evidence contracts/common.md#principled-implementation Admitted recipes contain exactly one palette swatch; the existing sort preserves deterministic selection for unchecked direct calls. Engine srgbHexToLinearColor decodes that name/hex because the archetype build seam accepts one material id.
 * @evidence contracts/common.md#clear-and-simple-design Palette choice and conventional metallic-zero/roughness-0.7/opacity-one defaults stay in this production material owner, while color transfer belongs to the engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The preceding design gate refuses multiple swatches; unchecked direct calls still select only the first. Fixed defaults preserve current policy rather than proving imported appearance, physical reflectance or visual quality.
 * @evidence contracts/common.md#meaningful-documentation Documents first-swatch selection, nonempty/valid-color premise, linear baseColor and all unchanged neutral material defaults.
 * @evidence contracts/performance.md#efficient-algorithms Object.entries copies P swatches and code-unit sorting adds O(P log P) comparisons; one fixed-size hex decode/material allocation follows.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the shared color transfer function, not a cached material answer over mutable palette inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One new scalar material transfers to the model caller; temporary palette entries retire without a texture, file or rendering handle.
 *
 * @author Samchon
 */
export function materialOf(
  recipe: IAutoMovieModelRecipe,
): IAutoMovieModel["materials"][number] {
  const [name, hex]: [string, string] = Object.entries(recipe.palette).sort(([left]: [string, string], [right]: [string, string]) : number =>
    compareCodeUnits(left, right),
  )[0]!;
  return {
    id: name,
    name,
    // Palette hex channels are sRGB-encoded; the shared transfer function
    // produces linear baseColor. Dividing encoded bytes by 255 alone would
    // leave their transfer curve unchanged rather than perform that decoding.
    baseColor: srgbHexToLinearColor(hex),
    metallic: 0,
    roughness: 0.7,
    emissive: null,
    opacity: 1,
    baseColorTexture: null,
  };
}
