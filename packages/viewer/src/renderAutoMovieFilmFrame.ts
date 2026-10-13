import {productionRenderLayersForPass} from "@automovie/engine";
import type {AutoMovieGuidePass} from "@automovie/interface";
import type * as THREE from "three";

import {renderCrossDissolveFrames} from "./renderCrossDissolveFrames.js";
import {renderFadeToBlackFrame} from "./renderFadeToBlackFrame.js";
import {resolveAutoMovieFilmBeautyComposition} from "./resolveAutoMovieFilmBeautyComposition.js";

/**
 * Render already sampled film layers through one beauty/guide boundary.
 *
 * Layer sample fields are opaque to this owner. The callback resolves that
 * source's exact state and owns its reversible pass configuration. Beauty
 * preserves direct, fade and dissolve weights; structural passes consume the
 * Engine's single full-weight dominant layer with incoming winning a tie.
 * Input admission happens before any callback can alter the display.
 *
 * The sampled film inputs are explicit. Interactive display-clock updates and inspection CLI timestamp filenames remain host observations rather than deterministic delivered-frame identity.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Routes only beauty through display-byte composition and leaves guides as one unblended source.
 * @evidence requirements/rendering/frame-schedules-and-sampling.md#rendering-state-sampling Passes the supplied exact layer samples to their renderer without introducing another clock.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Uses Engine-owned dominant-layer selection for structural products.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Composes independently resolved beauty display sources with no second view transform.
 *
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-locale-time-determinism Consumes explicit sampled layers and compiled composition weights without reading locale, wall-clock time, timezone or randomness while rendering that frame.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Consumes explicit sampled layers and compiled composition weights without reading locale, wall-clock time, timezone or randomness while rendering that frame.
 */
export const renderAutoMovieFilmFrame=<Layer extends {weight:number}>(
  renderer:THREE.WebGLRenderer,
  layers:readonly Layer[],
  pass:AutoMovieGuidePass,
  renderLayer:(layer:Omit<Layer,"weight"> & {weight:number},pass:AutoMovieGuidePass)=>void,
):void=>{
  const composition=resolveAutoMovieFilmBeautyComposition(layers);
  if(pass!=="beauty"){
    const selected=productionRenderLayersForPass({layers},pass);
    renderLayer(selected[0]!,pass);
  }else if(composition.kind==="direct") renderLayer(composition.layer,pass);
  else if(composition.kind==="fade")renderFadeToBlackFrame(renderer,()=>renderLayer(composition.layer,pass),composition.weight);
  else renderCrossDissolveFrames(renderer,()=>renderLayer(composition.outgoing,pass),()=>renderLayer(composition.incoming,pass),composition.alpha);
};
