import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * One station of a loft: where it sits along the path and what it looks like.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Declares one operand of a multi-section loft operation.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Supplies one compatible section to the loft topology.
 */
export interface IAutoMovieLoftSection {
  /**
   * Where the section sits along the path, `0` at its first point and `1` at
   * its last, measured by chord length.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Places the section within the loft operation.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Defines the interpolation station used to connect compatible rings.
   */
  at: number;
  /**
   * The enclosing ring, in the path frame's right / up axes, in metres.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Declares the section's metric outer boundary.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the free-form enclosing profile of a loft station.
   */
  outer: readonly IAutoMovieProfilePoint[];
  /**
   * Rings removed from the section; omitted means a solid section.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Preserves the declared holes in each loft section.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Supplies the inner boundaries that the connected topology must retain.
   */
  holes?: ReadonlyArray<readonly IAutoMovieProfilePoint[]>;
}
