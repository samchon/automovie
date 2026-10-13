import { IAutoMovieCompiledShotSource, IAutoMovieRenderTargetSettings } from "@automovie/interface";


/**
 * The renderer settings one compiled shot is drawn under.
 *
 * Precedence is the viewer's, restated nowhere: a scene that declares an
 * `environment` owns the curve, the exposure and the shadow policy of its own
 * beauty pass, and a scene that declares none keeps the delivery's tone mapping
 * at the renderer's untouched exposure with no shadow map. Deriving it here
 * rather than guessing is what makes the sealed target the settings a frame was
 * actually drawn with; a target that claimed shadows a scene switched off would
 * price a cost nobody pays and call a fresh report stale.
 *
 * `shadowType` is `none` exactly when shadows are off, which is the render
 * target's own invariant: an environment naming a filter family it never
 * renders states what it WOULD use, and recording that as the drawn setting
 * would be a claim about a map that does not exist.
 *
 * @author Samchon
 */
export const autoMovieRenderTargetSettingsOfShot = (props: {
  /** Fully builder-owned shot artifact. */
  compiled: IAutoMovieCompiledShotSource;
  /** Drawing-buffer width in pixels. */
  width: number;
  /** Drawing-buffer height in pixels. */
  height: number;
  /** Device pixel ratio the capture host pins. */
  pixelRatio: number;
  /** The delivery's own tone mapping, for a scene that declares none. */
  delivery: IAutoMovieRenderTargetSettings["toneMapping"];
}): IAutoMovieRenderTargetSettings => {
  const environment = props.compiled.scene.environment ?? null;
  const shadows =
    environment !== null && environment.shadows.enabled
      ? environment.shadows
      : null;
  return {
    width: props.width,
    height: props.height,
    pixelRatio: props.pixelRatio,
    shadows: shadows !== null,
    shadowType: shadows === null ? "none" : shadows.type,
    toneMapping: environment?.toneMapping ?? props.delivery,
    exposure: environment?.exposure ?? 1,
  };
};
