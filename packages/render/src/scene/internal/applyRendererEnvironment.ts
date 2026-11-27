import { AutoMovieEngineRenderShadow } from "@automovie/engine";
import type {
  AutoMovieGuidePass,
  IAutoMovieSceneEnvironment,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieRendererEnvironmentHandle } from "../IAutoMovieRendererEnvironmentHandle.js";

/*
 * Configure exposure, tone mapping and shadow policy for one pass. Structural
 * passes bypass all three so their values remain geometric facts.
 *
 * Precedence, settled once here so no caller has to decide it: a scene that
 * declares an `environment` owns the renderer's curve, exposure and shadow
 * policy for its own beauty pass. `delivery` is the render spec's
 * `toneMapping`, the value a whole sequence carries, and it applies only to a
 * scene that declared no environment. Omitting it leaves the host renderer's
 * own curve, exposure and shadow policy exactly as it found them: a caller that
 * knows no delivery curve states none rather than imposing `none`, which is how
 * a pre-environment production keeps rendering what it always rendered.
 *
 * This precedence governs the compiled-scene pass (`AutoMovieRenderScenePass.render`)
 * and its budget projection, which draw straight to their target. On the draw
 * path a draw scene's `optics` owns exposure and curve instead:
 * `AutoMovieFilmResponseStage` holds the renderer's own curve at none and its
 * exposure at one while the beauty pass draws into its linear target.
 */
export const applyRendererEnvironment: (
  renderer: Pick<
    THREE.WebGLRenderer,
    "shadowMap" | "toneMapping" | "toneMappingExposure"
  >,
  environment: IAutoMovieSceneEnvironment | null | undefined,
  pass: AutoMovieGuidePass,
  delivery?: IAutoMovieSceneEnvironment["toneMapping"],
) => IAutoMovieRendererEnvironmentHandle = (
  renderer: Pick<
    THREE.WebGLRenderer,
    "shadowMap" | "toneMapping" | "toneMappingExposure"
  >,
  environment: IAutoMovieSceneEnvironment | null | undefined,
  pass: AutoMovieGuidePass,
  delivery?: IAutoMovieSceneEnvironment["toneMapping"],
): IAutoMovieRendererEnvironmentHandle => {
  const prior: {
    toneMapping: THREE.ToneMapping;
    exposure: number;
    shadows: boolean;
    shadowType: THREE.ShadowMapType;
  } = {
    toneMapping: renderer.toneMapping,
    exposure: renderer.toneMappingExposure,
    shadows: renderer.shadowMap.enabled,
    shadowType: renderer.shadowMap.type,
  };
  const beauty: boolean = pass === "beauty";
  // Resolve every potentially refusing policy before mutating renderer state.
  const curve: THREE.ToneMapping | undefined =
    beauty && environment !== null && environment !== undefined
      ? toneMapping(environment.toneMapping)
      : undefined;
  const filter: THREE.ShadowMapType | undefined =
    beauty && environment !== null && environment !== undefined
      ? shadowType(environment.shadows.type)
      : undefined;
  let restored: boolean = false;
  const restore: () => void = (): void => {
    if (restored) return;
    const failures: unknown[] = [];
    for (const operation of [
      (): void => {
        renderer.toneMapping = prior.toneMapping;
      },
      (): void => {
        renderer.toneMappingExposure = prior.exposure;
      },
      (): void => {
        renderer.shadowMap.enabled = prior.shadows;
      },
      (): void => {
        renderer.shadowMap.type = prior.shadowType;
      },
    ]) {
      try {
        operation();
      } catch (error) {
        failures.push(error);
      }
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1)
      throw new AggregateError(
        failures,
        "Renderer environment restoration failed.",
      );
    restored = true;
  };
  try {
    if (!beauty) {
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.shadowMap.enabled = false;
    } else if (environment !== null && environment !== undefined) {
      renderer.toneMapping = curve!;
      renderer.toneMappingExposure = environment.exposure;
      renderer.shadowMap.enabled = environment.shadows.enabled;
      renderer.shadowMap.type = filter!;
    } else if (delivery !== undefined)
      renderer.toneMapping = toneMapping(delivery);
  } catch (error) {
    try {
      restore();
    } catch (restorationError) {
      throw new AggregateError(
        [
          error,
          ...(restorationError instanceof AggregateError &&
          restorationError.errors.length !== 0
            ? restorationError.errors
            : [restorationError]),
        ],
        "Renderer environment configuration and restoration failed.",
      );
    }
    throw error;
  }
  return { restore };
};

const toneMapping: (
  curve: IAutoMovieSceneEnvironment["toneMapping"],
) => THREE.ToneMapping = (
  curve: IAutoMovieSceneEnvironment["toneMapping"],
): THREE.ToneMapping =>
  curve === "acesFilmic" ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;

const shadowType: (
  type: IAutoMovieSceneEnvironment["shadows"]["type"],
) => THREE.ShadowMapType = (
  type: IAutoMovieSceneEnvironment["shadows"]["type"],
): THREE.ShadowMapType =>
  AutoMovieEngineRenderShadow.normalizeAutoMovieShadowFilter(type) === "pcf"
    ? THREE.PCFShadowMap
    : THREE.VSMShadowMap;
