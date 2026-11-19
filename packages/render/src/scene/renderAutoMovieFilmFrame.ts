import { productionRenderLayersForPass } from "@automovie/engine";
import type { AutoMovieGuidePass } from "@automovie/interface";
import type * as THREE from "three";

import { renderCrossDissolveFrames } from "./renderCrossDissolveFrames.js";
import { renderFadeToBlackFrame } from "./renderFadeToBlackFrame.js";
import { resolveAutoMovieFilmBeautyComposition } from "./resolveAutoMovieFilmBeautyComposition.js";

/**
 * Render already sampled film layers through one beauty/guide boundary.
 *
 * Layer sample fields are opaque to this owner. An optional preparation callback samples the selected source before its draw, including each source of a dissolve. The render callback owns its reversible pass configuration. Beauty preserves direct, fade and dissolve weights; structural passes consume the Engine's single full-weight dominant layer with incoming winning a tie. Input admission happens before either callback can alter the display.
 *
 * The sampled film inputs are explicit. Interactive display-clock updates and inspection CLI timestamp filenames remain host observations rather than deterministic delivered-frame identity.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Admits sampled one/two-layer beauty composition before callbacks, dispatches direct/fade/dissolve beauty and uses the Engine full-weight dominant layer with incoming tie winner for structural passes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The optional preparation callback applies each selected source's state immediately before the separate render callback. Canonical pass selection and beauty composition stay with their existing owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid weight/cardinality/complement sum refuse rather than clamp or blend structural classifications; host clock/filename observations do not become deterministic delivered-frame identity.
 * @evidence contracts/development/common.md#meaningful-documentation Documents opaque sampled fields, per-source preparation order, reversible pass ownership, beauty weights, structural tie rule and pre-effect admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms One/two admitted layers give fixed dispatch work; structural selection clones the selected layer payload and compositor draws/readbacks retain their actual pixel/native costs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Canonical selection is reused by guide consumers and renderer-scoped beauty owners reuse their allocated copies; sampled source callbacks still execute for each actual requested frame.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The adapter acquires no scene or renderer; callbacks own reversible state and compositor owners retain/release their native display copies, including terminal failure uncertainty.
 */
export const renderAutoMovieFilmFrame: <Layer extends { weight: number }>(
  renderer: THREE.WebGLRenderer,
  layers: readonly Layer[],
  pass: AutoMovieGuidePass,
  renderLayer: (
    layer: Omit<Layer, "weight"> & { weight: number },
    pass: AutoMovieGuidePass,
  ) => void,
  prepareLayer?: (layer: Omit<Layer, "weight"> & { weight: number }) => void,
) => void = <Layer extends { weight: number }>(
  renderer: THREE.WebGLRenderer,
  layers: readonly Layer[],
  pass: AutoMovieGuidePass,
  renderLayer: (
    layer: Omit<Layer, "weight"> & { weight: number },
    pass: AutoMovieGuidePass,
  ) => void,
  prepareLayer?: (layer: Omit<Layer, "weight"> & { weight: number }) => void,
): void => {
  const composition: ReturnType<
    typeof resolveAutoMovieFilmBeautyComposition<Layer>
  > = resolveAutoMovieFilmBeautyComposition(layers);
  const draw = (layer: Omit<Layer, "weight"> & { weight: number }): void => {
    prepareLayer?.(layer);
    renderLayer(layer, pass);
  };
  if (pass !== "beauty") {
    const selected: ReturnType<typeof productionRenderLayersForPass<Layer>> =
      productionRenderLayersForPass({ layers }, pass);
    draw(selected[0]!);
  } else if (composition.kind === "direct") draw(composition.layer);
  else if (composition.kind === "fade")
    renderFadeToBlackFrame(
      renderer,
      (): void => draw(composition.layer),
      composition.weight,
    );
  else
    renderCrossDissolveFrames(
      renderer,
      (): void => draw(composition.outgoing),
      (): void => draw(composition.incoming),
      composition.alpha,
    );
};
