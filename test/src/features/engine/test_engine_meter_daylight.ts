import { AutoMovieEngineAnalysis, AutoMovieEngineExposure } from "@automovie/engine";
import type {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
  IAutoMovieEnvironmentContext,
  IAutoMovieEnvironmentInstant,
  IAutoMovieMeterIlluminance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { aimedLight } from "../internal/aimedLight";
import { analysisContext } from "../internal/analysisContext";
import { nclose } from "../internal/nclose";

/**
 * Meter a daylight exterior so the sun counts once, through its staged light,
 * and the declared sky is reported but left out of the total.
 *
 * Scenarios:
 *
 * 1. An instant with DNI 80000, DHI 20000 and the sun 30 degrees above the
 *    horizon, plus a directional light of 80000 lux staging that sun, meters
 *    80000 × 0.5 = 40000 lux on an unobstructed horizontal plane: the beam
 *    counts once, through the light.
 * 2. The same meter lists `daylightSky` as unmetered at 20000 lux, equal to the
 *    daylight study's sky term for the same context, instant, plane and sample
 *    count, and the total excludes it.
 * 3. The same instant with no light meters 0 lux and still lists `daylightSky` at
 *    20000 lux.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the meter and the daylight study on one declared site and compares totals and unmetered entries; adding the instant's beam would give 80000, and adding the sky would give 60000.
 * @evidence contracts/development/testing.md#independent-expectations 40000 is the cosine law at 30 degrees elevation; 20000 is the declared DHI an unobstructed upward plane sees whole, and the study's own metric is an independent run of the shared sky term through the study's request path.
 * @evidence contracts/development/common.md#meaningful-documentation Direct and diffuse daylight produce separate meter outputs at the authored solar angle. Removing the light yields zero measured lux while retaining the reported sky term.
 */
export function test_engine_meter_daylight(): void {
  const elevation: number = (30 * Math.PI) / 180;
  const sun: IAutoMovieVector3 = {
    x: Math.cos(elevation),
    y: Math.sin(elevation),
    z: 0,
  };
  const instant: IAutoMovieEnvironmentInstant = {
    id: "afternoon",
    label: "low-sun",
    time: 0,
    sun,
    directNormalIlluminance: 80000,
    diffuseHorizontalIlluminance: 20000,
    outdoorAirTemperature: null,
    outdoorRelativeHumidity: null,
  };
  const context: IAutoMovieEnvironmentContext = analysisContext({
    instants: [instant],
  });
  const point: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const normal: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const daylight: IAutoMovieMeterIlluminance.IDaylight = {
    context,
    instant,
    diffuseSamples: 64,
  };
  const staged: IAutoMovieMeterIlluminance.IResult = AutoMovieEngineExposure.meterAutoMovieIlluminance({
    lights: [
      aimedLight({
        id: "sun",
        intensity: 80000,
        position: point,
        direction: { x: -sun.x, y: -sun.y, z: -sun.z },
        kind: { type: "directional" },
      }),
    ],
    point,
    normal,
    daylight,
  });
  TestValidator.predicate(
    "the beam counts once, through the staged light",
    nclose(staged.lux, 40000, 1e-6),
  );

  const run: IAutoMovieAnalysisRun = AutoMovieEngineAnalysis.daylight({
    request: {
      id: "meter-parity",
      subject: "exterior",
      inputRevision: "r1",
      context,
      instant: "afternoon",
      workplane: {
        origin: { x: -0.5, y: 0, z: 0.5 },
        axisU: { x: 1, y: 0, z: 0 },
        axisV: { x: 0, y: 0, z: -1 },
        sizeU: 1,
        sizeV: 1,
        countU: 1,
        countV: 1,
      },
      shades: [],
      luminaires: [],
      sky: "isotropic",
      diffuseSamples: 64,
      targets: [],
    },
  });
  const studied: number | null =
    run.outcome.status === "solved"
      ? (run.outcome.metrics.find(
          (metric: IAutoMovieAnalysisMetric): boolean =>
            metric.key === "workplane.skyDiffuse.illuminance",
        )?.value ?? null)
      : null;
  const sky: IAutoMovieMeterIlluminance.IUnmetered | undefined =
    staged.unmetered[0];
  TestValidator.predicate(
    "the sky is unmetered at the study's own value",
    staged.unmetered.length === 1 &&
      sky !== undefined &&
      sky.source === "daylightSky" &&
      sky.lux !== null &&
      studied !== null &&
      nclose(sky.lux, 20000, 1e-6) &&
      nclose(sky.lux, studied, 1e-9),
  );

  const unlit: IAutoMovieMeterIlluminance.IResult = AutoMovieEngineExposure.meterAutoMovieIlluminance({
    lights: [],
    point,
    normal,
    daylight,
  });
  TestValidator.predicate(
    "without a staged sun nothing is metered, and the sky is still listed",
    unlit.lux === 0 &&
      unlit.unmetered.length === 1 &&
      unlit.unmetered[0]!.source === "daylightSky" &&
      nclose(unlit.unmetered[0]!.lux ?? NaN, 20000, 1e-6),
  );
}
