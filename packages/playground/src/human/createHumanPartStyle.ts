import type {
  IAutoMovieMaterial,
  IAutoMovieModelPart,
} from "@automovie/interface";
import * as THREE from "three";

import type { IHumanViewerPage } from "./IHumanViewerPage";
import type { ModelPartStyling } from "./ModelPartStyling";
import type { normalizeHumanView } from "./normalizeHumanView";

/**
 * Build the Human page's part styling closure for one pass and curve selection.
 *
 * Parts whose id starts with `human.construction.` are lofting curves:
 * `<chain>/axis` central axes, `<chain>/<k>` sections and `<chain>/g<j>`
 * guides. Every other part is surface. The rules, applied through {@link ModelPartStyling}:
 *
 * - Curves are unlit, so the generator's colours (red axes, blue sections,
 *   green guides)
 *   are not washed out by lighting. Axes are thickened by 1/600 of the body
 *   height and drawn without a depth test, because they run inside the body
 *   and must stay visible through the skin in `overlay`.
 * - `overlay` pushes the surface back with a polygon offset of one, so
 *   sections lying on the skin win the depth test instead of z-fighting.
 * - Each selected curve takes its colour from `humanCurveColour` by
 *   selection order and thickens by another 1/800 of the height; in
 *   `construction` the selection draws over all other curves. Each skin
 *   interval a selection shapes is tinted halfway to its first curve's
 *   colour in `surface` and `overlay`.
 * - `surface` hides curves and `construction` hides the surface.
 * - `isolate` additionally hides every unselected curve and every skin part
 *   the selection does not shape, so one curve and its two intervals can be
 *   inspected alone; isolated skin keeps its own colour.
 * - `garment` false hides every `human.garment.` part (underwear), so the
 *   bare body can be inspected; the garments are separate shells over the
 *   skin, so hiding them shows the skin unchanged.
 * - `hair` false hides scalp hair, brows and lashes through their shared `human.hair.` prefix. `material=clay` uses a neutral plain material without maps or shader effects on the skin and on the `human.cavity.` pocket skin, retaining their geometry and smooth normals. Eye and nail materials remain their own appearance.
 *
 * @param pass Pass to display.
 * @param selection Resolved curve selection, possibly empty.
 * @param height Body height in metres, the scale of the thickening.
 * @param isolate Show only the selected curves and the skin intervals they shape.
 * @param display Garment and hair visibility and the skin material inspection mode; framing and geometry stay unchanged.
 * @returns The closure for `ModelPartStyling.apply`.
 *
 * @evidence contracts/common.md#principled-implementation Classifies parts only by the generator's id grammar and maps pass and selection to the documented overrides; thickening scales with body height so it reads alike for every person and camera of the same framing.
 * @evidence contracts/common.md#clear-and-simple-design All Human display rules live in this closure; the generic ModelPartStyling and the viewer package know no Human ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No chain is special-cased and the model's own colours are kept for unselected curves.
 * @evidence contracts/common.md#meaningful-documentation States every rule, colour role and the reason for the axis see-through display and the skin polygon offset.
 * @evidence contracts/performance.md#efficient-algorithms Builds two id-to-colour Maps once, then each call performs O(1) lookups per part.
 * @evidence contracts/performance.md#reuse-equivalent-work Returned style objects with equal values share one derived material inside ModelPartStyling.apply.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains two id-to-colour Maps and the current display inputs; owns no scene resources or cross-model cache.
 */
export function createHumanPartStyle(
  pass: IHumanViewerPage.Pass,
  selection: IHumanViewerPage.ISelection,
  height: number,
  isolate: boolean,
  display: Pick<normalizeHumanView.IView, "garment" | "hair" | "material">,
): (
  part: IAutoMovieModelPart,
  material: IAutoMovieMaterial | undefined,
) => ModelPartStyling.IStyle | undefined {
  const selected: Map<string, { r: number; g: number; b: number }> = new Map(
    selection.selected.map(
      (
        id: string,
        index: number,
      ): [string, { r: number; g: number; b: number }] => [
        id,
        linear(selection.colours[index]!),
      ],
    ),
  );
  const shaped: Map<string, { r: number; g: number; b: number }> = new Map(
    selection.shaped.map(
      (
        id: string,
        index: number,
      ): [string, { r: number; g: number; b: number }] => [
        id,
        linear(selection.shapedColours[index]!),
      ],
    ),
  );

  return (
    part: IAutoMovieModelPart,
    material: IAutoMovieMaterial | undefined,
  ): ModelPartStyling.IStyle | undefined => {
    if (part.id.startsWith("human.construction.")) {
      if (pass === "surface") return { visible: false };
      const curve: string = part.id.slice("human.construction.".length);
      const axis: boolean = curve.endsWith("/axis");
      const style: ModelPartStyling.IStyle = {
        unlit: true,
        inflate: axis ? height / 600 : 0,
        depthTest: !axis,
        renderOrder: axis ? 10 : 5,
      };
      if (!selected.has(curve)) return isolate ? { visible: false } : style;
      return {
        ...style,
        color: selected.get(curve)!,
        inflate: style.inflate! + height / 800,
        depthTest: !axis && pass !== "construction",
        renderOrder: 20,
      };
    }

    if (pass === "construction") return { visible: false };
    if (!display.garment && part.id.startsWith("human.garment."))
      return { visible: false };
    if (!display.hair && part.id.startsWith("human.hair."))
      return { visible: false };

    // Isolation keeps only the skin the selected curves shape.
    if (
      isolate &&
      !(
        part.id.startsWith("human.skin.") &&
        shaped.has(part.id.slice("human.skin.".length))
      )
    )
      return { visible: false };
    const style: ModelPartStyling.IStyle = {};
    if (
      display.material === "clay" &&
      (part.id.startsWith("human.skin.") || part.id.startsWith("human.cavity."))
    ) {
      style.plain = true;
      style.color = { r: 0.5, g: 0.5, b: 0.5 };
    }
    if (pass === "overlay") style.polygonOffset = 1;
    if (
      !isolate &&
      material !== undefined &&
      part.id.startsWith("human.skin.") &&
      shaped.has(part.id.slice("human.skin.".length))
    ) {
      const base: { r: number; g: number; b: number } =
        style.color ?? material.baseColor;
      const tint: { r: number; g: number; b: number } = shaped.get(
        part.id.slice("human.skin.".length),
      )!;
      style.color = {
        r: (base.r + tint.r) / 2,
        g: (base.g + tint.g) / 2,
        b: (base.b + tint.b) / 2,
      };
    }
    return Object.keys(style).length === 0 ? undefined : style;
  };
}

/** Linear RGB of a CSS colour, the convention of material and style colours. */
function linear(css: string): { r: number; g: number; b: number } {
  const colour: THREE.Color = new THREE.Color(css);
  return { r: colour.r, g: colour.g, b: colour.b };
}
