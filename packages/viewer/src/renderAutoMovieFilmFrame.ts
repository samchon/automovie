import { productionRenderLayersForPass } from "@automovie/engine";
import type { AutoMovieGuidePass } from "@automovie/interface";
import type * as THREE from "three";

import { renderCrossDissolveFrames } from "./renderCrossDissolveFrames.js";
import { renderFadeToBlackFrame } from "./renderFadeToBlackFrame.js";
import { resolveAutoMovieFilmBeautyComposition } from "./resolveAutoMovieFilmBeautyComposition.js";

/**
 * Render already sampled film layers through one beauty/guide boundary.
 *
 * Layer sample fields are opaque to this owner. The callback resolves that source's exact state and owns its reversible pass configuration. Beauty preserves direct, fade and dissolve weights; structural passes consume the Engine's single full-weight dominant layer with incoming winning a tie. Input admission happens before any callback can alter the display.
 *
 * The sampled film inputs are explicit. Interactive display-clock updates and inspection CLI timestamp filenames remain host observations rather than deterministic delivered-frame identity.
 *
 * @evidence contracts/common.md#principled-implementation Admits sampled one/two-layer beauty composition before callbacks, dispatches direct/fade/dissolve beauty and uses the Engine full-weight dominant layer with incoming tie winner for structural passes.
 * @evidence contracts/common.md#clear-and-simple-design Layer sampling/state resolution stays with caller callbacks while canonical pass selection and beauty compositor owners retain their separate responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid weight/cardinality/complement sum refuse rather than clamp or blend structural classifications; host clock/filename observations do not become deterministic delivered-frame identity.
 * @evidence contracts/common.md#meaningful-documentation Documents opaque sampled fields, reversible source callback ownership, beauty weights, structural tie rule and pre-effect admission.
 * @evidence contracts/performance.md#efficient-algorithms One/two admitted layers give fixed dispatch work; structural selection clones the selected layer payload and compositor draws/readbacks retain their actual pixel/native costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical selection is reused by guide consumers and renderer-scoped beauty owners reuse their allocated copies; sampled source callbacks still execute for each actual requested frame.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter acquires no scene or renderer; callbacks own reversible state and compositor owners retain/release their native display copies, including terminal failure uncertainty.
 */
export const renderAutoMovieFilmFrame: <Layer extends { weight: number }>(
  renderer: THREE.WebGLRenderer,
  layers: readonly Layer[],
  pass: AutoMovieGuidePass,
  renderLayer: (
    layer: Omit<Layer, "weight"> & { weight: number },
    pass: AutoMovieGuidePass,
  ) => void,
) => void = <Layer extends { weight: number }>(
  renderer: THREE.WebGLRenderer,
  layers: readonly Layer[],
  pass: AutoMovieGuidePass,
  renderLayer: (
    layer: Omit<Layer, "weight"> & { weight: number },
    pass: AutoMovieGuidePass,
  ) => void,
): void => {
  const composition: ReturnType<
    typeof resolveAutoMovieFilmBeautyComposition<Layer>
  > = resolveAutoMovieFilmBeautyComposition(layers);
  if (pass !== "beauty") {
    const selected: ReturnType<typeof productionRenderLayersForPass<Layer>> =
      productionRenderLayersForPass({ layers }, pass);
    renderLayer(selected[0]!, pass);
  } else if (composition.kind === "direct")
    renderLayer(composition.layer, pass);
  else if (composition.kind === "fade")
    renderFadeToBlackFrame(
      renderer,
      (): void => renderLayer(composition.layer, pass),
      composition.weight,
    );
  else
    renderCrossDissolveFrames(
      renderer,
      (): void => renderLayer(composition.outgoing, pass),
      (): void => renderLayer(composition.incoming, pass),
      composition.alpha,
    );
};
