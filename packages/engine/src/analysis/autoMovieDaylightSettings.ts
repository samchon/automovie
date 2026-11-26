import type {
  IAutoMovieAnalysisLuminaire,
  IAutoMovieAnalysisSolid,
  IAutoMovieDaylightRequest,
  IAutoMovieEnvironmentInstant,
} from "@automovie/interface";

import { autoMovieAnalysisSettingsTargets } from "./internal/autoMovieAnalysisSettingsTargets";

/**
 * Serialize the settings a daylight study's run records: the context id, ground
 * and north, the resolved instant, the ordered context occluders, workplane,
 * shades and luminaires, the sky settings and the projected targets.
 *
 * Shades and luminaires are projected to their declared fields in a fixed
 * order. Other nested records are serialized as supplied, so their extra
 * runtime fields and serialization hooks are not filtered.
 *
 * Entry- and text-linear serialization creates temporary projections and the
 * returned string once per study; no request or cache survives sealing.
 *
 * @param request The study request.
 * @param instant The resolved environmental instant, or `null` for an
 *   artificial-light study.
 * @param occluders The context's solids.
 * @returns The settings text the run's digest covers.
 */
export function autoMovieDaylightSettings(
  request: IAutoMovieDaylightRequest,
  instant: IAutoMovieEnvironmentInstant | null,
  occluders: readonly IAutoMovieAnalysisSolid[],
): string {
  return JSON.stringify({
    context: request.context.id,
    ground: request.context.ground,
    north: request.context.north,
    instant,
    occluders,
    workplane: request.workplane,
    shades: request.shades.map(
      (shade: IAutoMovieAnalysisSolid): IAutoMovieAnalysisSolid => ({
        id: shade.id,
        planes: shade.planes,
      }),
    ),
    luminaires: request.luminaires.map(
      (
        luminaire: IAutoMovieAnalysisLuminaire,
      ): IAutoMovieAnalysisLuminaire => ({
        id: luminaire.id,
        position: luminaire.position,
        intensity: luminaire.intensity,
      }),
    ),
    sky: request.sky,
    diffuseSamples: request.diffuseSamples,
    targets: autoMovieAnalysisSettingsTargets(request.targets),
  });
}
