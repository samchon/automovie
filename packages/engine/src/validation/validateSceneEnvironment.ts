import type {
  IAutoMovieResolveShadowProfile,
  IAutoMovieSceneEnvironment,
  IAutoMovieValidateSceneEnvironment,
  IAutoMovieValidation,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { resolveAutoMovieShadowProfile } from "../render/resolveAutoMovieShadowProfile";
import { AutoMovieEngineViolationCollector } from "./AutoMovieEngineViolationCollector";
import { validateColor } from "./validateColor";

/**
 * Admit environment image/background, intensity, exposure and shadow policy.
 *
 * A declared image requires a null flat background. Color delegates to
 * validateColor's linear RGBA and matching sRGB label contract. Intensity is
 * finite and nonnegative, exposure finite and positive, and rotation finite
 * degrees.
 *
 * Supplying admitted light traits also checks the supported shadow profile,
 * retaining its original scene-light paths on refusal. It collects all
 * independent faults without changing input or requiring a renderer.
 */
export function validateSceneEnvironment(
  props: IAutoMovieValidateSceneEnvironment.IProps,
): IAutoMovieValidation {
  const out: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  const value: IAutoMovieSceneEnvironment = props.environment;
  if (value.image !== null && value.background !== null)
    out.push(
      "type",
      "$input.background",
      "environment background must be null when an image supplies the background",
      value.background,
    );
  if (value.background !== null)
    validateColor(value.background, "$input.background", out);
  finiteRange(value.intensity, 0, false, "$input.intensity", "intensity", out);
  finiteRange(value.exposure, 0, true, "$input.exposure", "exposure", out);
  if (props.lights !== undefined) {
    const profile: IAutoMovieResolveShadowProfile.IResult =
      resolveAutoMovieShadowProfile({
        lights: props.lights,
        shadows: value.shadows,
      });
    if (!profile.success) out.items.push(...profile.violations);
  }
  return out.toValidation();
}

/** Check a finite scalar's inclusive or exclusive minimum without rewriting it. */
function finiteRange(
  value: number,
  min: number,
  exclusive: boolean,
  path: string,
  label: string,
  out: IAutoMovieViolationCollector,
  max: number = Infinity,
): void {
  if ((exclusive ? value <= min : value < min) || value > max)
    out.push(
      "range",
      path,
      `${label} must be finite and within ${exclusive ? "(" : "["}${min}, ${max === Infinity ? "Infinity" : max}]`,
      value,
    );
}
