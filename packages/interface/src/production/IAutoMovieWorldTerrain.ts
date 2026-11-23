/** Authored footprint and constant world height for flat terrain construction. */
export namespace IAutoMovieWorldTerrain {
  /** Construct a flat world surface from an authored XZ footprint and height. */
  export type IInput = {
    /**
     * Authored surface identity, copied verbatim. This constructor does not
     * reject blank or duplicate IDs; downstream world validation owns that
     * admission.
     */
    id: string;
    /**
     * Authored world XZ footprint in metres, cloned into the result without
     * geometry correction or validation.
     */
    polygon: {
      /** Footprint vertex world X in metres. */
      x: number;
      /** Footprint vertex world Z in metres. */
      z: number;
    }[];
    /**
     * Constant world Y in metres for every point on the plane. Downstream
     * validation checks finiteness; construction preserves the supplied value.
     */
    height: number;
    /**
     * Authored support permission copied unchanged, independent of the
     * footprint's shape.
     */
    walkable: boolean;
  };
}
