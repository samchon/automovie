/**
 * Slack, in radians, on the full turn a revolute panel may travel.
 *
 * Validation and the swept-envelope solver share this on purpose: the cap is
 * what bounds the solver's critical-angle walk, so a range the validator waved
 * through but the solver could not enumerate would be a hang rather than a
 * disagreement.
  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const FULL_TURN_EPSILON = 1e-6;
