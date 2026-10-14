import type * as THREE from "three";

import type { IAutoMovieSemanticMaskBinding } from "./IAutoMovieSemanticMaskBinding.js";
import { SCENE_MASK_KEY } from "./SCENE_MASK_KEY.js";

/**
 * Hand a built scene the palette its `mask` pass must paint it with.
 *
 * The scene carries it, rather than every caller passing it down, for the same reason a formation's baked cycle rides on its own mesh: the pass boundary that needs it is several calls below whoever knows it. A compiled shot's runtime hands `applyRenderMode` a pass name and nothing else, so a mask that had to arrive as an argument could only arrive by widening every signature between the page and the pass. A scene given no palette keeps the legacy index ramp, which is what an asset turntable and any host without a compiled design draw.
 *
 * @evidence contracts/common.md#principled-implementation Attaches the caller production design/palette binding to the actual scene userData key consumed by packaged mask selection.
 * @evidence contracts/common.md#clear-and-simple-design The scene handoff carries one existing binding across intermediate draw layers without adding public pass arguments or a global registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No attached fake coverage or material is generated; caller must provide the correct admitted binding, and attachment presence does not prove root or pixel coverage.
 * @evidence contracts/common.md#meaningful-documentation Documents why the scene owns the handoff and why an unattached asset host retains legacy ramp semantics.
 * @evidence contracts/performance.md#efficient-algorithms One property assignment is fixed work and copies no scene, palette or shader data.
 * @evidence contracts/performance.md#reuse-equivalent-work The same actual binding can serve subsequent passes until scene/production replacement; replacement overwrites the reference and identity text alone does not preserve semantic validity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one binding reference is retained on the caller-owned scene; no geometry/material/renderer is acquired and scene/binding owner controls withdrawal or replacement.
 */
export const attachAutoMovieSemanticMask: (
  scene: THREE.Scene,
  binding: IAutoMovieSemanticMaskBinding,
) => void = (
  scene: THREE.Scene,
  binding: IAutoMovieSemanticMaskBinding,
): void => {
  scene.userData[SCENE_MASK_KEY] = binding;
};
