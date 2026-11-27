import type {
  IAutoMovieCompiledShotSource,
  IAutoMovieRenderTargetSettings,
  IAutoMovieRenderTargetSettingsOfShotProps,
} from "@automovie/interface";

/*
 * Project intended renderer settings from one compiled shot and caller-supplied
 * target dimensions.
 *
 * A scene environment supplies the beauty pass's curve, exposure and shadow
 * policy. Without one this helper projects delivery tone mapping, exposure one
 * and disabled shadows, assuming a host initialized to those defaults.
 * applyRendererEnvironment instead preserves existing host exposure/shadows on
 * that branch, so this projection is not a live settings observation.
 *
 * `shadowType` is `none` exactly when the supplied policy disables shadows,
 * preserving the render-target invariant without claiming a live shadow
 * allocation.
 */
export const renderTargetSettingsOfShot: (
  props: IAutoMovieRenderTargetSettingsOfShotProps,
) => IAutoMovieRenderTargetSettings = (
  props: IAutoMovieRenderTargetSettingsOfShotProps,
): IAutoMovieRenderTargetSettings => {
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
