/**
 * Open-ended enough to name a feature, closed enough to validate.
 *
 * @evidence requirements/map/rivers-and-inland-water.md#map-water-boundary-volume Exposes `AutoMovieWaterFeatureKind` as the portable data boundary for the map water boundary volume requirement.
 * @evidence specifications/world-and-site/hydrology-coast-and-groundwater.md#world-site-watershed-water-boundary-input Types `AutoMovieWaterFeatureKind` for the world site watershed water boundary input system contract.
 */
export type AutoMovieWaterFeatureKind =
  | "pond"
  | "channel"
  | "fountain"
  | "waterfall"
  | "reservoir"
  | "other";
