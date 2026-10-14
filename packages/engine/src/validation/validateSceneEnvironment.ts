import {
  IAutoMovieLight,
  IAutoMovieSceneEnvironment,
  IAutoMovieValidation,
} from "@automovie/interface";

import { resolveAutoMovieShadowProfile } from "../render/resolveAutoMovieShadowProfile";
import { ViolationCollector } from "./ViolationCollector";
import { isRecord } from "./isRecord";
import { validateColor } from "./validateColor";

/** Renderer tone mappings admitted by the scene environment contract. */
const TONE_MAPPINGS: ReadonlySet<string> = new Set(["none", "acesFilmic"]);
/** Supported shadow filters before contextual light compatibility is judged. */
const SHADOW_TYPES: ReadonlySet<string> = new Set(["pcf", "pcfSoft", "vsm"]);

/**
 * Admit environment image/background, intensity, exposure and shadow policy.
 *
 * Image ids are nonblank or null, and a declared image requires a null flat background. Color delegates to validateColor's linear RGBA and matching sRGB label contract. Intensity is finite and nonnegative, exposure finite and positive, and rotation finite degrees. Tone mapping is none or acesFilmic; shadows require a boolean enabled flag and pcf, pcfSoft or vsm filter.
 *
 * Supplying admitted light traits also checks the supported shadow profile, retaining its original scene-light paths on refusal. With no light context, this function admits policy shape only. It collects all independent faults without changing input or requiring a renderer.
 *
 * @evidence contracts/common.md#principled-implementation Reads the environment as unknown until a record guard admits it, then checks the domains its numerical lighting consumers require. Image/background exclusivity prevents two authored background authorities; shared validateColor and resolveAutoMovieShadowProfile own color and contextual filter laws, so this gate does not invent rendering fallbacks.
 * @evidence contracts/common.md#clear-and-simple-design Owns environment scalar and policy admission at staging and production scene seams; delegates complete colors and light-dependent shadow compatibility, with an optional lights argument expressing whether that context is available.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No image, scene or light id changes admission; values are refused rather than normalized, image conflicts remain visible and contextual point-VSM faults retain the shadow owner's original light path. Omitting light traits explicitly leaves compatibility to a contextual caller.
 * @evidence contracts/common.md#meaningful-documentation Lists nullable image/background meaning, each numeric domain, closed policy values, optional light context and its limit, all-fault collection, lack of renderer dependencies and unchanged input ownership.
 * @evidence contracts/performance.md#efficient-algorithms Constant field work and one bounded color check, plus O(L) contextual shadow profiling for L supplied lights; that shared resolver examines casting-light compatibility and builds its caster profile, which is transient here. No per-frame environment revalidation is performed by this function.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Validates one current environment snapshot and optional light context; the module shares constant policy sets, while no mutable environment result or renderer effects are cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns one collector and a transient shadow profile until return; contextual profile storage is bounded by supplied light count, and only the returned violations transfer to the caller. Module policy sets have fixed size and no resources or tasks are acquired.
 */
export function validateSceneEnvironment(props: {
  /** Current authored environment, inspected without mutation. */
  environment: IAutoMovieSceneEnvironment;

  /** Admitted scene light traits; contextual refusals retain their scene paths. */
  lights?: readonly Pick<IAutoMovieLight, "id" | "type" | "castShadow">[];
}): IAutoMovieValidation {
  const out: ViolationCollector = new ViolationCollector();
  const value: unknown = props.environment;
  if (!isRecord(value)) {
    out.push(
      "type",
      "$input",
      "scene environment must be a JSON object",
      value,
    );
    return out.toValidation();
  }
  if (
    value.image !== null &&
    (typeof value.image !== "string" || value.image.trim().length === 0)
  )
    out.push(
      "type",
      "$input.image",
      "environment image must be a non-empty asset id or null",
      value.image,
    );
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
  if (
    typeof value.rotationDeg !== "number" ||
    !Number.isFinite(value.rotationDeg)
  )
    out.push(
      "range",
      "$input.rotationDeg",
      "environment rotation must be finite degrees",
      value.rotationDeg,
    );
  finiteRange(value.exposure, 0, true, "$input.exposure", "exposure", out);
  if (
    typeof value.toneMapping !== "string" ||
    !TONE_MAPPINGS.has(value.toneMapping)
  )
    out.push(
      "type",
      "$input.toneMapping",
      'toneMapping must be "none" or "acesFilmic"',
      value.toneMapping,
    );
  if (!isRecord(value.shadows))
    out.push(
      "type",
      "$input.shadows",
      "shadow policy must be a JSON object",
      value.shadows,
    );
  else {
    if (typeof value.shadows.enabled !== "boolean")
      out.push(
        "type",
        "$input.shadows.enabled",
        "shadow enabled must be boolean",
        value.shadows.enabled,
      );
    if (
      typeof value.shadows.type !== "string" ||
      !SHADOW_TYPES.has(value.shadows.type)
    )
      out.push(
        "type",
        "$input.shadows.type",
        'shadow type must be "pcf", "pcfSoft", or "vsm"',
        value.shadows.type,
      );
    if (
      props.lights !== undefined &&
      typeof value.shadows.enabled === "boolean" &&
      typeof value.shadows.type === "string" &&
      SHADOW_TYPES.has(value.shadows.type)
    ) {
      const profile: ReturnType<typeof resolveAutoMovieShadowProfile> =
        resolveAutoMovieShadowProfile({
          lights: props.lights,
          shadows: props.environment.shadows,
        });
      if (!profile.success) out.items.push(...profile.violations);
    }
  }
  return out.toValidation();
}

/** Check a finite scalar's inclusive or exclusive minimum without rewriting it. */
function finiteRange(
  value: unknown,
  min: number,
  exclusive: boolean,
  path: string,
  label: string,
  out: ViolationCollector,
  max: number = Infinity,
): void {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    (exclusive ? value <= min : value < min) ||
    value > max
  )
    out.push(
      "range",
      path,
      `${label} must be finite and within ${exclusive ? "(" : "["}${min}, ${max === Infinity ? "Infinity" : max}]`,
      value,
    );
}
