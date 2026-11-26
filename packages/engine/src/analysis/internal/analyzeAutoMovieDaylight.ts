import {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisMetricGap,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
  type IAutoMovieAnalysisSolid,
  IAutoMovieAnalysisSolver,
  IAutoMovieAnalysisWarning,
  type IAutoMovieAnalysisWorkplane,
  type IAutoMovieAnalyzeDaylight,
  type IAutoMovieDaylightRequest,
  IAutoMovieEnvironmentInstant,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { autoMovieAnalysisMetric } from "../autoMovieAnalysisMetric";
import { autoMovieArtificialIlluminance } from "../autoMovieArtificialIlluminance";
import { autoMovieContextSolids } from "./autoMovieContextSolids";
import { autoMovieDaylightSettings } from "../autoMovieDaylightSettings";
import { autoMovieRayObstructed } from "./autoMovieRayObstructed";
import { autoMovieSkyIlluminance } from "../autoMovieSkyIlluminance";
import { AUTOMOVIE_DAYLIGHT_SKY_MODEL } from "../constants/AUTOMOVIE_DAYLIGHT_SKY_MODEL";
import { resolveAutoMovieDaylightRequest } from "./resolveAutoMovieDaylightRequest";
import { sealAutoMovieAnalysisRun } from "./sealAutoMovieAnalysisRun";
import { warnAutoMovieAnalysisTargetKeys } from "./warnAutoMovieAnalysisTargetKeys";

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
 *   the reference ground. An unobstructed ground-facing-up plane has V=1;
 *   tilted or shaded planes retain sampling error;
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
 * Settings text covers the declared study fields and preserves list order;
 * equivalent covered JSON values repeat the digest, while ignored fields,
 * signed zero and possible hash collisions limit identity claims.
 *
 * The cosine-weighted sky estimate is exact only for an unobstructed plane
 * whose hemisphere lies wholly above the reference ground; a tilted or shaded
 * plane's sky term depends on `diffuseSamples`. This identity is mathematical:
 * binary64 light products and summation can overflow, and nonfinite computed
 * metrics throw even when scalar inputs were admitted.
 */
export function analyzeAutoMovieDaylight(
  props: IAutoMovieAnalyzeDaylight.IProps,
): IAutoMovieAnalysisRun {
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
  const settings: string = autoMovieDaylightSettings(
    request,
    instant,
    contextSolids,
  );
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
  const sky: ((point: IAutoMovieVector3) => number) | null =
    instant === null
      ? null
      : autoMovieSkyIlluminance({
          normal: resolved.normal,
          ground: request.context.ground,
          count: request.diffuseSamples,
          illuminance: instant.diffuseHorizontalIlluminance,
          solids,
        });
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
      const skylight: number = sky === null ? 0 : sky(point);
      const lamp: number = autoMovieArtificialIlluminance({
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
  const metric: (
    key: string,
    unit: string,
    value: number | null,
    gap?: IAutoMovieAnalysisMetricGap,
    status?: "unsupported" | "not-run",
  ) => IAutoMovieAnalysisMetric = (
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
}

/**
 * Multiply declared beam illuminance by positive normal/sun incidence,
 * returning zero behind the face or when the convex-solid union blocks the sky
 * ray. Unit resolved directions are the caller premise; this helper does not
 * admit nonfinite arithmetic.
 *
 * One incidence check and at most one O(total solid planes) ray test allocate
 * only ray props, with no cached visibility or retained point.
 */
const beamIlluminance: (props: {
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
  sun: IAutoMovieVector3;
  illuminance: number;
  solids: readonly IAutoMovieAnalysisSolid[];
}) => number = (props: {
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
 * Place cell (i,j) at half-cell offsets on the request's normalized U/V axes,
 * in model metres from its origin. Admitted positive dimensions/counts and
 * in-range loop indices are premises; oblique axes form a parallelogram and
 * finite inputs do not guarantee finite sums.
 *
 * Constant arithmetic returns a new vector without changing or retaining the
 * borrowed workplane/frame.
 */
const gridPoint: (
  workplane: IAutoMovieAnalysisWorkplane,
  plane: { axisU: IAutoMovieVector3; axisV: IAutoMovieVector3 },
  i: number,
  j: number,
) => IAutoMovieVector3 = (
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

/**
 * Sum then divide a nonempty illuminance list in stored order; the positive
 * admitted grid count supplies nonemptiness. This binary64 mean has ordinary
 * summation error and can overflow before division.
 *
 * One O(N) fold uses constant extra storage, with no copy, cache or retained
 * list.
 */
const average: (values: readonly number[]) => number = (
  values: readonly number[],
): number =>
  values.reduce((sum: number, value: number): number => sum + value, 0) /
  values.length;
