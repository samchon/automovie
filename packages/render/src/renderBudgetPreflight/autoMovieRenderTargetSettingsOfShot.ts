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
 * @evidence contracts/common.md#principled-implementation Scene environment values override delivery tone mapping and default exposure; disabled shadows always map to shadowType none, matching the render-target invariant.
 * @evidence contracts/common.md#clear-and-simple-design This boundary projects compiled scene policy into target settings while the engine target sealer owns runtime admission of dimensions and setting values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent environment uses delivery tone mapping and exposure one, which are the viewer defaults; disabled shadow filters are not recorded as actual shadow-map work.
 * @evidence contracts/common.md#meaningful-documentation The comment names environment precedence and shadow invariants, and input members specify drawing-buffer pixels, device pixel ratio and delivery tone mapping.
 * @evidence contracts/performance.md#efficient-algorithms The projection reads one environment and allocates one settings record, performing constant work irrespective of shot geometry or frame count.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled environment policy is read directly without rebuilding scene state or resealing assets; each invocation reflects its supplied dimensions and pixel ratio.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The settings record contains only scalar values, so no compiled geometry, GPU allocation or host session is retained.
 */
export const autoMovieRenderTargetSettingsOfShot: (props: {
    compiled: IAutoMovieCompiledShotSource;
    width: number;
    height: number;
    pixelRatio: number;
    delivery: IAutoMovieRenderTargetSettings["toneMapping"];
}) => IAutoMovieRenderTargetSettings = (props: {
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
  const environment: IAutoMovieCompiledShotSource["scene"]["environment"] | null = props.compiled.scene.environment ?? null;
  const shadows: NonNullable<IAutoMovieCompiledShotSource["scene"]["environment"]>["shadows"] | null =
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
