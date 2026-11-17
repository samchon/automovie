/**
 * Finite lattice baking inputs for a sampled world-height surface.
 */
export namespace IAutoMovieWorldHeightfield {
  /**
   * Bake a supplied height callback into a row-major terrain lattice.
   *
   * @evidence contracts/development/design.md#principled-representation Origin/spacing and callback coordinates use world XZ metres, and height answers world Y metres. Columns/rows must be safe integers at least two and spacing finite positive; worldHeightfield checks these before sampling.
   * @evidence contracts/development/design.md#minimal-and-owned-surface worldHeightfield consumes height only to bake row-major samples into IAutoMovieWorldSurface; the resulting surface stores no callback or host handle.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The polygon is cloned but not geometrically admitted here. Determinism, allocation feasibility and representable derived sample coordinates remain caller obligations; callback errors stop baking without retry.
   * @evidence contracts/development/common.md#meaningful-documentation Finite lattice baking inputs for a sampled world-height surface. Origin/spacing and callback coordinates use world XZ metres, and height answers world Y metres. Columns/rows must be safe integers at least two and spacing finite positive; worldHeightfield checks these before sampling.
   */
  export type IInput = {
    /** Surface identity containing non-whitespace text; worldHeightfield rejects blank input and preserves the original spelling. */
    id: string;
    /** World XZ footprint in metres, cloned into the returned surface. This constructor does not admit polygon geometry; downstream world validation owns footprint validity. */
    polygon: {
      /** World X coordinate in metres for this footprint vertex. */
      x: number;
      /** World Z coordinate in metres for this footprint vertex. */
      z: number;
    }[];
    /** Finite world XZ position of lattice column zero, row zero. The constructor checks both coordinates before invoking height. */
    origin: {
      /** World X in metres at column zero. */
      x: number;
      /** World Z in metres at row zero. */
      z: number;
    };
    /** Strictly positive finite axis pitches in metres. Individually admitted pitches and dimensions do not guarantee representable derived coordinates. */
    spacing: {
      /** Metres per column in the positive world X direction. */
      x: number;
      /** Metres per row in the positive world Z direction. */
      z: number;
    };
    /** Safe integer at least two. Each row contains this many samples; the product with rows has no separate allocation budget here. */
    columns: number;
    /** Safe integer at least two. Rows are sampled in increasing positive-Z order, with columns increasing inside each row. */
    rows: number;
    /** Called once at each lattice point in row-major order; return finite world Y in metres. Nonfinite return throws, and exceptions propagate without retry. Purity is required for deterministic baking but not enforced. */
    height: (point: {
      /** Sample world X in metres: origin.x + column * spacing.x. */
      x: number;
      /** Sample world Z in metres: origin.z + row * spacing.z. */
      z: number;
    }) => number;
    /** Authored support permission copied unchanged to the surface; lattice slope does not infer or override it. */
    walkable: boolean;
  };
}
