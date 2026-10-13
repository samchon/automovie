import {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisMetricGap,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
  IAutoMovieAnalysisSolver,
  IAutoMovieAnalysisWarning,
  IAutoMovieEnvironmentInstant,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieAnalysisLuminaire } from "./IAutoMovieAnalysisLuminaire";
import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import { IAutoMovieAnalysisWorkplane } from "./IAutoMovieAnalysisWorkplane";
import { IAutoMovieDaylightRequest } from "./IAutoMovieDaylightRequest";
import { autoMovieAnalysisMetric } from "./autoMovieAnalysisMetric";
import { autoMovieAnalysisSettingsTargets } from "./autoMovieAnalysisSettingsTargets";
import { autoMovieContextSolids } from "./autoMovieContextSolids";
import { autoMovieHemisphereDirections } from "./autoMovieHemisphereDirections";
import { autoMovieRayObstructed } from "./autoMovieRayObstructed";
import { autoMovieSkyward } from "./autoMovieSkyward";
import { AUTOMOVIE_DAYLIGHT_SKY_MODEL } from "./constants/AUTOMOVIE_DAYLIGHT_SKY_MODEL";
import { resolveAutoMovieDaylightRequest } from "./resolveAutoMovieDaylightRequest";
import { sealAutoMovieAnalysisRun } from "./sealAutoMovieAnalysisRun";
import { warnAutoMovieAnalysisTargetKeys } from "./warnAutoMovieAnalysisTargetKeys";

/** Distances this short or shorter put a fitting on the sample point. */
const EPSILON: number = 1e-12;

/**
 * Measure one workplane under one declared instant, one set of shades and one
 * set of luminaires.
 *
 * The governing model is stated and bounded rather than implied:
 *
 * - Beam illuminance is `DNI * max(0, dot(n, s))`, zeroed when any solid stops
 *   the ray to the sun;
 * - Sky illuminance is the isotropic vault `DHI * V`, where `V` is the fraction
 *   of a cosine-weighted hemisphere that reaches the sky unobstructed and above
 *   the reference ground. Cosine weighting makes this exact, not approximate,
 *   for an unobstructed plane: every direction is visible, so `V` is one and
 *   the result is the declared horizontal illuminance for any sample count;
 * - Each luminaire contributes `I * max(0, dot(n, d)) / r^2`, zeroed when a solid
 *   stands between the fitting and the point;
 * - Ground-reflected light is **not** modelled, and says so as an `unsupported`
 *   metric rather than being quietly folded into the sky term.
 *
 * Anything the solver cannot answer is reported rather than approximated. A sky
 * model it does not implement returns an `unsupported` run; a study with
 * neither a sun nor a fitting returns `not-run`; a contrast ratio over a plane
 * with a dark point returns a gap, because `max / 0` is not a large number, it
 * is not a number.
 *
 * Everything the study is configured with is digested into the run, so two
 * identical requests produce one identical artifact and any change to shading,
 * time or grid produces a different one.
 *
 * The cosine-weighted sky estimate is exact only for an unobstructed plane
 * whose hemisphere lies wholly above the reference ground; a tilted or shaded
 * plane's sky term depends on `diffuseSamples`. Throws on a malformed request
 * (see {@link IAutoMovieDaylightRequest}).
 *
 * @evidence contracts/common.md#principled-implementation Sums beam, isotropic-sky and point-luminaire illuminance at each cell centre, with occlusion by the analytic half-space slab test and the sky term estimated over a deterministic cosine-weighted Hammersley hemisphere whose cosine weighting cancels Lambert's cosine, so the visible fraction times DHI is the sky illuminance.
 * @evidence contracts/common.md#clear-and-simple-design One function owns sampling, metrics and sealing with a private helper per light component; request checking and frame resolution live in `resolveAutoMovieDaylightRequest`, and directions, occlusion, metric building and sealing are shared analysis helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unimplemented sky returns an `unsupported` run and ground reflection is an `unsupported` metric; the 1e-12 epsilon guards only a fitting coincident with a sample point, and no study or fixture is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the three illuminance laws, the excluded ground reflection, the unsupported, not-run and gap cases, the settings digest, and where the sky estimate is exact.
 * @evidence contracts/performance.md#efficient-algorithms Time is O(C·(D + L + 1)·N·P) for C cells (at most 4096), D sky samples (unbounded), L luminaires and N solids of P planes, dominated by the sky rays; directions below the reference ground are dropped once per study rather than tested at every cell, and no spatial index prunes solids, so every ray tests every solid.
 * @evidence contracts/performance.md#reuse-equivalent-work One unit normal, one sky-direction set and its skyward subset, one solid list and one coincident-luminaire set are shared across every cell, valid because each depends only on the plane, the ground, the context and the shades fixed for the study; the sky set is not built for an artificial-light study that never reads it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds per-study arrays of at most C samples and illuminances plus D sky directions only until the run is sealed; D has no upper bound because `diffuseSamples` has none, and nothing persists across calls.
 * @author Samchon
 */
export const analyzeAutoMovieDaylight = (props: {
  /** Study to measure; validated in full before any ray is cast. */
  request: IAutoMovieDaylightRequest;
}): IAutoMovieAnalysisRun => {
  const request: IAutoMovieDaylightRequest = props.request;
  const resolved: {
    instant: IAutoMovieEnvironmentInstant | null;
    normal: IAutoMovieVector3;
    axisU: IAutoMovieVector3;
    axisV: IAutoMovieVector3;
  } = resolveAutoMovieDaylightRequest(request);
  const instant: IAutoMovieEnvironmentInstant | null = resolved.instant;
  const solver: IAutoMovieAnalysisSolver = {
    id: "automovie.daylight.isotropic-sky",
    version: "1",
    model:
      "beam DNI*cos(i) with analytic convex occlusion, isotropic sky DHI*V by cosine-weighted hemisphere visibility, point luminaires I*cos/r^2; ground-reflected light excluded",
  };
  const contextSolids: IAutoMovieAnalysisSolid[] = autoMovieContextSolids(
    request.context,
  );
  const settings: string = daylightSettings(request, instant, contextSolids);
  const domain: "daylight" | "artificial-light" =
    instant === null ? "artificial-light" : "daylight";

  if (request.sky !== AUTOMOVIE_DAYLIGHT_SKY_MODEL)
    return sealAutoMovieAnalysisRun({
      id: request.id,
      domain,
      subject: request.subject,
      inputRevision: request.inputRevision,
      solver,
      settings,
      outcome: {
        status: "unsupported",
        reason: `sky luminance model "${request.sky}" is not implemented by this solver`,
        remedy: `declare the "${AUTOMOVIE_DAYLIGHT_SKY_MODEL}" sky model, or bind an external adapter that implements "${request.sky}" and record its result as its own run`,
      },
    });
  if (instant === null && request.luminaires.length === 0)
    return sealAutoMovieAnalysisRun({
      id: request.id,
      domain,
      subject: request.subject,
      inputRevision: request.inputRevision,
      solver,
      settings,
      outcome: {
        status: "not-run",
        reason:
          "the study declares neither an environmental instant nor a luminaire, so nothing emits light onto the workplane",
        remedy:
          "name an instant of the environment context, declare at least one luminaire, or stop requesting the study",
      },
    });

  const warnings: IAutoMovieAnalysisWarning[] = [];
  const solids: IAutoMovieAnalysisSolid[] = [
    ...contextSolids,
    ...request.shades,
  ];
  // The grid is planar, so every sample shares one normal and therefore one set
  // of sky directions, and whether a direction clears the reference ground
  // depends on the direction alone. Both are settled once instead of once per
  // point, which is what keeps a fine grid under a fine sky a study rather than
  // a wait.
  const sky: {
    open: IAutoMovieVector3[];
    count: number;
    illuminance: number;
  } | null =
    instant === null
      ? null
      : {
          open: autoMovieHemisphereDirections({
            normal: resolved.normal,
            count: request.diffuseSamples,
          }).filter((direction: IAutoMovieVector3): boolean =>
            autoMovieSkyward(direction, request.context.ground),
          ),
          count: request.diffuseSamples,
          illuminance: instant.diffuseHorizontalIlluminance,
        };
  const beam: { sun: IAutoMovieVector3; illuminance: number } | null =
    instant === null
      ? null
      : {
          sun: Vector3.normalize(instant.sun),
          illuminance: instant.directNormalIlluminance,
        };
  const coincident: Set<string> = new Set<string>();
  const samples: IAutoMovieAnalysisSample[] = [];
  const direct: number[] = [];
  const diffuse: number[] = [];
  const artificial: number[] = [];

  for (let i: number = 0; i < request.workplane.countU; ++i)
    for (let j: number = 0; j < request.workplane.countV; ++j) {
      const point: IAutoMovieVector3 = gridPoint(
        request.workplane,
        resolved,
        i,
        j,
      );
      const sunlight: number =
        beam === null
          ? 0
          : beamIlluminance({
              point,
              normal: resolved.normal,
              solids,
              ...beam,
            });
      const skylight: number =
        sky === null ? 0 : skyIlluminance({ point, solids, ...sky });
      const lamp: number = artificialIlluminance({
        point,
        normal: resolved.normal,
        luminaires: request.luminaires,
        solids,
        warnings,
        coincident,
      });
      direct.push(sunlight);
      diffuse.push(skylight);
      artificial.push(lamp);
      samples.push({
        id: `${i}-${j}`,
        key: "workplane.total.illuminance",
        position: point,
        value: sunlight + skylight + lamp,
      });
    }

  const totals: number[] = samples.map(
    (sample: IAutoMovieAnalysisSample): number => sample.value,
  );
  const daylight: number[] = direct.map(
    (value: number, index: number): number => value + diffuse[index]!,
  );
  const metric = (
    key: string,
    unit: string,
    value: number | null,
    gap?: IAutoMovieAnalysisMetricGap,
    status?: "unsupported" | "not-run",
  ): IAutoMovieAnalysisMetric =>
    autoMovieAnalysisMetric({
      key,
      unit,
      value,
      targets: request.targets,
      warnings,
      gap,
      status,
    });
  const noInstant: IAutoMovieAnalysisMetricGap = {
    reason:
      "the study declares no environmental instant, so no sun and no sky were read",
    remedy:
      "name an instant of the environment context to measure daylight on this plane",
  };
  const minimum: number = Math.min(...totals);
  const maximum: number = Math.max(...totals);
  const mean: number = average(totals);
  const skyMean: number = average(diffuse);

  const metrics: IAutoMovieAnalysisMetric[] = [
    metric(
      "workplane.direct.illuminance",
      "lx",
      instant === null ? null : average(direct),
      instant === null ? noInstant : undefined,
    ),
    metric(
      "workplane.skyDiffuse.illuminance",
      "lx",
      instant === null ? null : skyMean,
      instant === null ? noInstant : undefined,
    ),
    metric(
      "workplane.daylight.illuminance",
      "lx",
      instant === null ? null : average(daylight),
      instant === null ? noInstant : undefined,
    ),
    metric("workplane.artificial.illuminance", "lx", average(artificial)),
    metric("workplane.total.illuminance", "lx", mean),
    metric("workplane.total.illuminance.min", "lx", minimum),
    metric("workplane.total.illuminance.max", "lx", maximum),
    metric(
      "workplane.total.uniformity",
      "ratio",
      mean === 0 ? null : minimum / mean,
      mean === 0
        ? {
            reason:
              "the mean workplane illuminance is 0 lx, so a min/mean uniformity ratio is undefined",
            remedy:
              "light the plane, or read the min and max illuminance metrics directly",
          }
        : undefined,
    ),
    metric(
      "workplane.total.contrast",
      "ratio",
      minimum === 0 ? null : maximum / minimum,
      minimum === 0
        ? {
            reason:
              "the darkest workplane sample measures 0 lx, so a max/min contrast ratio is undefined",
            remedy:
              "raise the minimum illuminance, or judge the plane by its min and max illuminance metrics",
          }
        : undefined,
    ),
    metric(
      "workplane.daylightFactor",
      "%",
      instant === null || instant.diffuseHorizontalIlluminance === 0
        ? null
        : (skyMean / instant.diffuseHorizontalIlluminance) * 100,
      instant === null
        ? noInstant
        : instant.diffuseHorizontalIlluminance === 0
          ? {
              reason: `instant "${instant.id}" declares 0 lx of diffuse horizontal illuminance, so a daylight factor has no reference sky to divide by`,
              remedy:
                "declare the unobstructed horizontal sky illuminance of the instant, or judge the plane by its absolute illuminance",
            }
          : undefined,
    ),
    metric(
      "workplane.groundReflected.illuminance",
      "lx",
      null,
      {
        reason:
          "this solver models the sky vault only; light reflected from the reference ground and from surrounding surfaces is not computed",
        remedy:
          "bind an inter-reflection adapter and record its result as its own run, or read this plane as a sky-component study",
      },
      "unsupported",
    ),
  ];

  warnAutoMovieAnalysisTargetKeys({
    targets: request.targets,
    keys: metrics.map((entry: IAutoMovieAnalysisMetric): string => entry.key),
    warnings,
  });
  return sealAutoMovieAnalysisRun({
    id: request.id,
    domain,
    subject: request.subject,
    inputRevision: request.inputRevision,
    solver,
    settings,
    outcome: { status: "solved", metrics, samples, warnings },
  });
};

/** Beam illuminance at one point, or zero when the sun is hidden or behind. */
const beamIlluminance = (props: {
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  sun: IAutoMovieVector3;
  illuminance: number;
  solids: readonly IAutoMovieAnalysisSolid[];
}): number => {
  const incidence: number = Vector3.dot(props.normal, props.sun);
  if (incidence <= 0) return 0;
  if (
    autoMovieRayObstructed({
      origin: props.point,
      direction: props.sun,
      solids: props.solids,
      maxDistance: Infinity,
    })
  )
    return 0;
  return props.illuminance * incidence;
};

/**
 * Isotropic sky illuminance at one point: the declared illuminance times the
 * share of all `count` hemisphere directions that are skyward and unobstructed.
 */
const skyIlluminance = (props: {
  point: IAutoMovieVector3;
  illuminance: number;
  solids: readonly IAutoMovieAnalysisSolid[];
  open: readonly IAutoMovieVector3[];
  count: number;
}): number => {
  let visible: number = 0;
  for (const direction of props.open)
    if (
      !autoMovieRayObstructed({
        origin: props.point,
        direction,
        solids: props.solids,
        maxDistance: Infinity,
      })
    )
      ++visible;
  return (props.illuminance * visible) / props.count;
};

/** Summed luminaire illuminance at one point. */
const artificialIlluminance = (props: {
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  luminaires: readonly IAutoMovieAnalysisLuminaire[];
  solids: readonly IAutoMovieAnalysisSolid[];
  warnings: IAutoMovieAnalysisWarning[];
  coincident: Set<string>;
}): number => {
  let total: number = 0;
  for (const luminaire of props.luminaires) {
    const offset: IAutoMovieVector3 = Vector3.subtract(
      luminaire.position,
      props.point,
    );
    const distance: number = Vector3.length(offset);
    if (distance <= EPSILON) {
      // Reported once per fitting rather than once per sample: the fact is
      // about the luminaire, and a warning repeated per grid cell would bury
      // every other warning the run carries.
      if (!props.coincident.has(luminaire.id)) {
        props.coincident.add(luminaire.id);
        props.warnings.push({
          code: "luminaire-on-workplane",
          detail: `luminaire "${luminaire.id}" sits on the workplane itself, where the inverse square law has no value; it contributes nothing`,
          subject: luminaire.id,
        });
      }
      continue;
    }
    const direction: IAutoMovieVector3 = Vector3.normalize(offset);
    const incidence: number = Vector3.dot(props.normal, direction);
    if (incidence <= 0) continue;
    if (
      autoMovieRayObstructed({
        origin: props.point,
        direction,
        solids: props.solids,
        maxDistance: distance,
      })
    )
      continue;
    total += (luminaire.intensity * incidence) / (distance * distance);
  }
  return total;
};

/** The world position of one grid cell centre. */
const gridPoint = (
  workplane: IAutoMovieAnalysisWorkplane,
  plane: { axisU: IAutoMovieVector3; axisV: IAutoMovieVector3 },
  i: number,
  j: number,
): IAutoMovieVector3 => {
  const u: number = ((i + 0.5) * workplane.sizeU) / workplane.countU;
  const v: number = ((j + 0.5) * workplane.sizeV) / workplane.countV;
  return {
    x: workplane.origin.x + plane.axisU.x * u + plane.axisV.x * v,
    y: workplane.origin.y + plane.axisU.y * u + plane.axisV.y * v,
    z: workplane.origin.z + plane.axisU.z * u + plane.axisV.z * v,
  };
};

/** The arithmetic mean of a non-empty list, in list order. */
const average = (values: readonly number[]): number =>
  values.reduce((sum: number, value: number): number => sum + value, 0) /
  values.length;

/** The canonical settings text one daylight run is digested against. */
const daylightSettings = (
  request: IAutoMovieDaylightRequest,
  instant: IAutoMovieEnvironmentInstant | null,
  occluders: readonly IAutoMovieAnalysisSolid[],
): string =>
  JSON.stringify({
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
      (luminaire: IAutoMovieAnalysisLuminaire): IAutoMovieAnalysisLuminaire => ({
        id: luminaire.id,
        position: luminaire.position,
        intensity: luminaire.intensity,
      }),
    ),
    sky: request.sky,
    diffuseSamples: request.diffuseSamples,
    targets: autoMovieAnalysisSettingsTargets(request.targets),
  });
