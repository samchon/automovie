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
