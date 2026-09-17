/**
 * Viewer package boundaries for world maps and site representation.
 *
 * The package's lint.config.ts selects this declaration as an exclusion
 * carrier within its complete public-source population. It has no runtime
 * state and is not re-exported by the package barrel. Each declared
 * target/reason pair below owns one intentional negative relationship;
 * requirement and specification boundaries for this domain stay together.
 * Positive implementation citations remain on the actual public exports.
 * An exclusion neither implements a feature nor approves a rendered asset.
 * Add a boundary at its semantic owner and retain native graph validation.
 *
 * @evidenceExclude requirements/map/bridges-and-tunnels.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/coasts-and-oceans.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/deliverables-and-validation.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/external-assets-and-placement.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/geology-and-ground-surfaces.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/infrastructure-and-utilities.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/movement-and-visibility.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/parcels-and-land-use.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/parks-and-public-space.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/rail-and-transport.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/README.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/rivers-and-inland-water.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/roads-and-paths.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/scale-and-populations.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/scope-and-coordinates.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/settlements-and-urban-form.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/temporal-change.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/terrain-and-landforms.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/vegetation-and-ecology.md#map-ecology-gap The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/vegetation-and-ecology.md#map-habitat-ecological-relations The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/vegetation-and-ecology.md#map-vegetation-disturbance-recovery The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/vegetation-and-ecology.md#map-vegetation-layers-form The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/vegetation-and-ecology.md#map-vegetation-season-growth The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/vegetation-and-ecology.md#map-vegetation-terrain-water The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude requirements/map/weather-and-seasons.md The viewer draws compiled world state; site authoring, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/delivery-and-validation.md The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/ecology-weather-and-calendar.md#world-site-ecology-gap-limit The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/ecology-weather-and-calendar.md#world-site-growth-season-disturbance The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/ecology-weather-and-calendar.md#world-site-season-spatial-weather The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-habitat-relation The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/ecology-weather-and-calendar.md#world-site-weather-continuity-source-refusal The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/ecology-weather-and-calendar.md#world-site-weather-sampling-consequence The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/hydrology-coast-and-groundwater.md The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/land-settlements-and-public-space.md The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/partition-lod-streaming-and-seams.md The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/README.md The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/spatial-imports-and-placement.md The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/spatial-reference-and-identity.md The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/temporal-state-and-staleness.md The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/terrain-ground-and-geology.md The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/transport-crossings-and-utilities.md The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 * @evidenceExclude specifications/world-and-site/traversal-and-visibility.md The viewer draws compiled world state; site authority, geospatial policy, traversal analysis, and validation remain upstream.
 */
export type AutoMovieViewerWorldEvidenceExclusions = never;
