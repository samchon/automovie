/** The alpha fields of an exported material the cut depends on. */
export interface IPortraitWebAlphaMaterial {
  alphaMode?: "opaque" | "mask" | "blend" | null;
  alphaCutoff?: number | null;
  opacity?: number | null;
}

/**
 * Alpha test of an exported material, following the product viewer's
 * `buildMaterial`: `mask` cuts at the material's own `alphaCutoff` (0.5 when
 * absent), `blend` and `opaque` do not cut, and an unset mode with partial
 * opacity is blended.
 *
 * A record exported before alpha fields were carried (no `alphaMode` key at
 * all, as `export-articulation-census.ts` still writes) keeps the historical
 * 0.45 cut so an old census renders as it did. Pure.
 */
export function portraitWebAlphaTest(
  material: IPortraitWebAlphaMaterial,
): number {
  if (!Object.hasOwn(material, "alphaMode")) return 0.45;
  const mode =
    material.alphaMode ?? ((material.opacity ?? 1) < 1 ? "blend" : "opaque");
  return mode === "mask" ? (material.alphaCutoff ?? 0.5) : 0;
}
