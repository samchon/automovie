
/**
 * Authored footprint and constant world height for flat terrain construction.
 */
export namespace IAutoMovieWorldTerrain {
  /**
   * Construct a flat world surface from an authored XZ footprint and height.
   *
   * @evidence contracts/development/design.md#principled-representation The polygon is in world XZ metres and height is constant world Y metres; worldTerrain constructs the surface without validating identity, geometry or finiteness.
   * @evidence contracts/development/design.md#minimal-and-owned-surface worldTerrain lowers these inputs directly to IAutoMovieWorldSurface with a cloned footprint and constant height rule; downstream world validation owns admission.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts walkable remains an explicit authored permission. Empty or malformed polygons are preserved for validation rather than repaired into a different footprint.
   * @evidence contracts/development/common.md#meaningful-documentation Authored footprint and constant world height for flat terrain construction. The polygon is in world XZ metres and height is constant world Y metres; worldTerrain constructs the surface without validating identity, geometry or finiteness.
   */
  export type IInput = {
    /** Authored surface identity, copied verbatim. This constructor does not reject blank or duplicate IDs; downstream world validation owns that admission. */
    id: string;
    /** Authored world XZ footprint in metres, cloned into the result without geometry correction or validation. */
    polygon: {
    /** Footprint vertex world X in metres. */
    x: number;
    /** Footprint vertex world Z in metres. */
    z: number }[];
    /** Constant world Y in metres for every point on the plane. Downstream validation checks finiteness; construction preserves the supplied value. */
    height: number;
    /** Authored support permission copied unchanged, independent of the footprint's shape. */
    walkable: boolean;
  };
}
