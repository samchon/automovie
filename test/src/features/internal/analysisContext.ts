import type { IAutoMovieEnvironmentContext } from "@automovie/interface";

/**
 * Builders shared by the environmental-analysis scenarios.
 *
 * They exist so every scenario measures the same declared world: an analysis that quietly changed its context between cases would make two results incomparable, which is exactly what the analysis contract is supposed to stop.
 */

/** A ground-level site with three declared instants and no neighbours.
 *
 * analysisContext supplies the daylight, envelope, environment-context and production-library/analysis-overlay cases through the compatibility barrel; its original initializer and API are preserved. Assertions belong to those consumers, so constructing this fixture alone is not a behavior proof.
 * The authored noon/afternoon/night directions, illuminances, temperatures and humidities are study inputs, not returned measurements; consumers derive cosine and heat/air expectations separately. The site ids and labels declare metadata and do not load external weather records.
 * Each call creates the same three ordered instants with an empty occluder list, then applies the caller's overrides. Consumers own valid contexts, individual malformed fields, missing resident slots and changed context premises; this builder validates none of them.
 */
export const analysisContext: (overrides?: Partial<IAutoMovieEnvironmentContext>) => IAutoMovieEnvironmentContext = (
  overrides: Partial<IAutoMovieEnvironmentContext> = {},
): IAutoMovieEnvironmentContext => ({
  version: 1,
  id: "site",
  units: "meter",
  north: { x: 0, y: 0, z: -1 },
  ground: { up: { x: 0, y: 1, z: 0 }, elevation: 0 },
  instants: [
    {
      id: "noon",
      label: "equinox-1200",
      time: 0,
      sun: { x: 0, y: 1, z: 0 },
      directNormalIlluminance: 1000,
      diffuseHorizontalIlluminance: 200,
      outdoorAirTemperature: 0,
      outdoorRelativeHumidity: 0.8,
    },
    {
      id: "afternoon",
      label: "equinox-1500",
      time: 3600,
      sun: { x: 1, y: 1, z: 0 },
      directNormalIlluminance: 800,
      diffuseHorizontalIlluminance: 150,
      outdoorAirTemperature: 5,
      outdoorRelativeHumidity: 0.6,
    },
    {
      id: "night",
      label: "equinox-0000",
      time: 7200,
      sun: { x: 0, y: -1, z: 0 },
      directNormalIlluminance: 0,
      diffuseHorizontalIlluminance: 0,
      outdoorAirTemperature: null,
      outdoorRelativeHumidity: null,
    },
  ],
  occluders: [],
  ...overrides,
});
