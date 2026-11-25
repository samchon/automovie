/** Finite lattice baking inputs for a sampled world-height surface. */
export namespace IAutoMovieWorldHeightfield {
  /** Bake a supplied height callback into a row-major terrain lattice. */
  export type IInput = {
    /**
     * Surface identity containing non-whitespace text; worldHeightfield rejects
     * blank input and preserves the original spelling.
     */
    id: string;
    /**
     * World XZ footprint in metres, cloned into the returned surface. This
     * constructor does not admit polygon geometry; downstream world validation
     * owns footprint validity.
     */
    polygon: {
      /** World X coordinate in metres for this footprint vertex. */
      x: number;
      /** World Z coordinate in metres for this footprint vertex. */
      z: number;
    }[];
    /**
     * Finite world XZ position of lattice column zero, row zero. The
     * constructor checks both coordinates before invoking height.
     */
    origin: {
      /** World X in metres at column zero. */
      x: number;
      /** World Z in metres at row zero. */
      z: number;
    };
    /**
     * Strictly positive finite axis pitches in metres. Individually admitted
     * pitches and dimensions do not guarantee representable derived
     * coordinates.
     */
    spacing: {
      /** Metres per column in the positive world X direction. */
      x: number;
      /** Metres per row in the positive world Z direction. */
      z: number;
    };
    /**
     * Safe integer at least two. Each row contains this many samples; the
     * product with rows has no separate allocation budget here.
     */
    columns: number;
    /**
     * Safe integer at least two. Rows are sampled in increasing positive-Z
     * order, with columns increasing inside each row.
     */
    rows: number;
    /**
     * Called once at each lattice point in row-major order; return finite world
     * Y in metres. Nonfinite return throws, and exceptions propagate without
     * retry. Purity is required for deterministic baking but not enforced.
     */
    height: (point: {
      /** Sample world X in metres: origin.x + column * spacing.x. */
      x: number;
      /** Sample world Z in metres: origin.z + row * spacing.z. */
      z: number;
    }) => number;
    /**
     * Authored support permission copied unchanged to the surface; lattice
     * slope does not infer or override it.
     */
    walkable: boolean;
  };
}
