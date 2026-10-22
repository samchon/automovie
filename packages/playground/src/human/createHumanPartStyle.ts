import type {
  IAutoMovieMaterial,
  IAutoMovieModelPart,
} from "@automovie/interface";
import * as THREE from "three";

import type { IHumanViewerPage } from "./IHumanViewerPage";
import type { ModelPartStyling } from "./ModelPartStyling";

/**
 * Build the Human page's part styling closure for one pass and curve selection.
 *
 * Parts whose id starts with `human.construction.` are lofting curves:
 * `<chain>/axis` central axes and `<chain>/<k>` sections. Every other part is
 * surface. The rules, applied through {@link ModelPartStyling}:
 *
 * - Curves are unlit, so the generator's colours (red axes, blue sections)
 *   are not washed out by lighting. Axes are thickened by 1/600 of the body
 *   height and drawn without a depth test, because they run inside the body
 *   and must stay visible through the skin in `overlay`.
 * - `overlay` pushes the surface back with a polygon offset of one, so
 *   sections lying on the skin win the depth test instead of z-fighting.
 * - Selected curves turn green, a third colour, and thicken by another 1/800
 *   of the height; in `construction` they draw over all other curves. The skin
 *   intervals they shape are tinted halfway to that green in `surface` and
 *   `overlay`.
 * - `surface` hides curves and `construction` hides the surface.
 *
 * @param pass Pass to display.
 * @param selection Resolved curve selection, possibly empty.
 * @param height Body height in metres, the scale of the thickening.
 * @returns The closure for `ModelPartStyling.apply`.
 *
 * @evidence contracts/common.md#principled-implementation Classifies parts only by the generator's id grammar and maps pass and selection to the documented overrides; thickening scales with body height so it reads alike for every person and camera of the same framing.
 * @evidence contracts/common.md#clear-and-simple-design All Human display rules live in this closure; the generic ModelPartStyling and the viewer package know no Human ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No chain is special-cased and the model's own colours are kept for unselected curves.
 * @evidence contracts/common.md#meaningful-documentation States every rule, colour role and the reason for the axis see-through display and the skin polygon offset.
 * @evidence contracts/performance.md#efficient-algorithms Builds two Sets once, then each call is O(1) per part.
 * @evidence contracts/performance.md#reuse-equivalent-work Returned style objects with equal values share one derived material inside ModelPartStyling.apply.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains the two id Sets of one selection and nothing else.
 */
export function createHumanPartStyle(
  pass: IHumanViewerPage.Pass,
  selection: IHumanViewerPage.ISelection,
  height: number,
): (
  part: IAutoMovieModelPart,
  material: IAutoMovieMaterial | undefined,
) => ModelPartStyling.IStyle | undefined {
  const selected: Set<string> = new Set(selection.selected);
  const shaped: Set<string> = new Set(selection.shaped);
  const green: { r: number; g: number; b: number } =
    createHumanPartStyle.highlight;

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
      if (!selected.has(curve)) return style;
      return {
        ...style,
        color: green,
        inflate: style.inflate! + height / 800,
        depthTest: !axis && pass !== "construction",
        renderOrder: 20,
      };
    }

    if (pass === "construction") return { visible: false };
    const style: ModelPartStyling.IStyle = {};
    if (pass === "overlay") style.polygonOffset = 1;
    if (
      material !== undefined &&
      part.id.startsWith("human.skin.") &&
      shaped.has(part.id.slice("human.skin.".length))
    ) {
      const base: { r: number; g: number; b: number } = material.baseColor;
      style.color = {
        r: (base.r + green.r) / 2,
        g: (base.g + green.g) / 2,
        b: (base.b + green.b) / 2,
      };
    }
    return Object.keys(style).length === 0 ? undefined : style;
  };
}

/**
 * Constants of the Human part styling.
 *
 * @evidence contracts/common.md#principled-implementation The highlight is stored in linear RGB, the convention of IAutoMovieMaterial colours and of style overrides.
 * @evidence contracts/common.md#clear-and-simple-design One colour constant shared by the closure and the page legend.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Not a generator colour; the generator's axis and section colours are read from the model.
 * @evidence contracts/common.md#meaningful-documentation States the colour space and role.
 * @evidence contracts/performance.md#efficient-algorithms Computed once at module load.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared by every closure and legend.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three numbers for the module's life.
 */
export namespace createHumanPartStyle {
  /** Selection green in linear RGB, distinct from the red axes and blue sections. */
  export const highlight: { r: number; g: number; b: number } = ((): {
    r: number;
    g: number;
    b: number;
  } => {
    const colour: THREE.Color = new THREE.Color(0x12b04a);
    return { r: colour.r, g: colour.g, b: colour.b };
  })();
}
