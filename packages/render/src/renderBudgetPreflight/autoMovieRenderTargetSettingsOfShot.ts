import {
  IAutoMovieCompiledShotSource,
  IAutoMovieRenderTargetSettings,
} from "@automovie/interface";

/**
 * Project intended renderer settings from one compiled shot and caller-supplied target dimensions.
 *
 * A scene environment supplies the beauty pass's curve, exposure and shadow policy. Without one this helper projects delivery tone mapping, exposure one and disabled shadows, assuming a host initialized to those defaults. applyRendererEnvironment instead preserves existing host exposure/shadows on that branch, so this projection is not a live settings observation.
 *
 * `shadowType` is `none` exactly when the supplied policy disables shadows, preserving the render-target invariant without claiming a live shadow allocation.
 *
 * @evidence contracts/common.md#principled-implementation Scene environment values supply tone mapping, exposure and shadow policy; disabled shadows map to shadowType none. Without an environment this helper chooses exposure one and disabled shadows, which match live settings only under the caller's neutral-host premise, since applyRendererEnvironment preserves existing exposure/shadows on that branch.
 * @evidence contracts/common.md#clear-and-simple-design This boundary projects compiled scene policy into target settings while the engine target sealer owns runtime admission of dimensions and setting values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shot is special-cased; absent-environment defaults are explicit projected assumptions, not observed host state. A previously configured host can differ, and this helper does not compensate for or detect that mismatch.
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
  const environment:
    | IAutoMovieCompiledShotSource["scene"]["environment"]
    | null = props.compiled.scene.environment ?? null;
  const shadows:
    | NonNullable<
        IAutoMovieCompiledShotSource["scene"]["environment"]
      >["shadows"]
    | null =
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
