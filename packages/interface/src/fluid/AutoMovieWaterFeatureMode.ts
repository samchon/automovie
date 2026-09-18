/**
 * How a bound feature is evaluated over shot time.
 *
 * @evidence requirements/map/rivers-and-inland-water.md#map-water-boundary-volume Exposes `AutoMovieWaterFeatureMode` as the portable data boundary for the map water boundary volume requirement.
 * @evidence specifications/world-and-site/hydrology-coast-and-groundwater.md#world-site-watershed-water-boundary-input Types `AutoMovieWaterFeatureMode` for the world site watershed water boundary input system contract.
 */
export type AutoMovieWaterFeatureMode = "static" | "flowing" | "simulated";
