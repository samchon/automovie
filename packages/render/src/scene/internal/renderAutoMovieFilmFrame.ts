import { AutoMovieEngineFilm } from "@automovie/engine";
import type { AutoMovieGuidePass } from "@automovie/interface";
import type * as THREE from "three";

import type { IRenderAutoMovieFilmFrameCompositors } from "./IRenderAutoMovieFilmFrameCompositors.js";
import { renderCrossDissolveFrames } from "./renderCrossDissolveFrames.js";
import { renderFadeToBlackFrame } from "./renderFadeToBlackFrame.js";
import { AutoMovieFilmResponseStage } from "../AutoMovieFilmResponseStage.js";

/*
 * Render already sampled film layers through one beauty/guide boundary.
 *
 * Layer sample fields are opaque to this owner. An optional preparation
 * callback samples the selected source before its draw, including each source
 * of a dissolve. The render callback owns its reversible pass configuration.
 * Beauty preserves direct, fade and dissolve weights; structural passes consume
 * the Engine's single full-weight dominant layer with incoming winning a tie.
 * Input admission happens before either callback can alter the display. With
 * `transparent`, a beauty fade falls toward a fully transparent pixel instead
 * of opaque black, as `renderFadeToBlackFrame` states; a dissolve mixes
 * associated colour and alpha either way.
 *
 * The sampled film inputs are explicit. Interactive display-clock updates and
 * inspection CLI timestamp filenames remain host observations rather than
 * deterministic delivered-frame identity.
 *
 * The caller owns the fade and dissolve compositors a beauty frame mixes in.
 */
export const renderAutoMovieFilmFrame: <Layer extends { weight: number }>(
  renderer: THREE.WebGLRenderer,
  compositors: IRenderAutoMovieFilmFrameCompositors,
  layers: readonly Layer[],
  pass: AutoMovieGuidePass,
  renderLayer: (
    layer: Omit<Layer, "weight"> & { weight: number },
    pass: AutoMovieGuidePass,
  ) => void,
  prepareLayer?: (layer: Omit<Layer, "weight"> & { weight: number }) => void,
  transparent?: boolean,
) => void = <Layer extends { weight: number }>(
  renderer: THREE.WebGLRenderer,
  compositors: IRenderAutoMovieFilmFrameCompositors,
  layers: readonly Layer[],
  pass: AutoMovieGuidePass,
  renderLayer: (
    layer: Omit<Layer, "weight"> & { weight: number },
    pass: AutoMovieGuidePass,
  ) => void,
  prepareLayer?: (layer: Omit<Layer, "weight"> & { weight: number }) => void,
  transparent: boolean = false,
): void => {
  const composition: ReturnType<
    typeof AutoMovieFilmResponseStage.resolveBeautyComposition<Layer>
  > = AutoMovieFilmResponseStage.resolveBeautyComposition(layers);
  const draw = (layer: Omit<Layer, "weight"> & { weight: number }): void => {
    prepareLayer?.(layer);
    renderLayer(layer, pass);
  };
  if (pass !== "beauty") {
    const selected: ReturnType<typeof AutoMovieEngineFilm.productionRenderLayersForPass<Layer>> =
      AutoMovieEngineFilm.productionRenderLayersForPass({ layers }, pass);
    draw(selected[0]!);
  } else if (composition.kind === "direct") draw(composition.layer);
  else if (composition.kind === "fade")
    renderFadeToBlackFrame(
      renderer,
      compositors.fade,
      (): void => draw(composition.layer),
      composition.weight,
      transparent,
    );
  else
    renderCrossDissolveFrames(
      renderer,
      compositors.dissolve,
      (): void => draw(composition.outgoing),
      (): void => draw(composition.incoming),
      composition.alpha,
    );
};
