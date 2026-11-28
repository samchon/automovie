/**
 * Evaluate ground height in metres at a world XZ point.
 *
 * World terrain and scene surfaces share this rule. Use the containing surface
 * to check footprint membership and walkability before a bounded query.
 */
export type IAutoMovieHeightRule = IHeightRuleFields<
  | IAutoMovieHeightRule.IConstant
  | IAutoMovieHeightRule.IPlane
  | IAutoMovieHeightRule.IHeightfield
>;

// Preserve assignment of each public variant to an unknown-valued dictionary.
type IHeightRuleFields<Rule> = { [Key in keyof Rule]: Rule[Key] };

/** The variants selected by the height rule's `kind` field. */
export namespace IAutoMovieHeightRule {
  /** Return the same world Y value at every point. */
  export interface IConstant {
    /** Selects constant evaluation. */
    kind: "constant";

    /** Finite world Y in metres. */
    value: number;
  }

  /**
   * Evaluate `originHeight + slopeX * x + slopeZ * z` in world coordinates. Use
   * a query range where the products and sum are representable in binary64.
   */
  export interface IPlane {
    /** Selects planar evaluation. */
    kind: "plane";

    /** Finite world Y at X = 0 and Z = 0, in metres. */
    originHeight: number;

    /** Finite rise in metres per metre of positive X travel. */
    slopeX: number;

    /** Finite rise in metres per metre of positive Z travel. */
    slopeZ: number;
  }

  /**
   * Read stored heights on a regular world XZ lattice.
   *
   * The reader returns stored heights at lattice knots and bilinearly
   * interpolates between them. Queries beyond the lattice clamp to its edge.
   * Cover the intended footprint with the lattice to avoid clamping inside it.
   * Choose an origin and spacing that give distinct finite knot coordinates in
   * binary64. Engine world heightfield construction checks these conditions
   * when baking a callback into the stored samples.
   */
  export interface IHeightfield {
    /** Selects sampled height evaluation. */
    kind: "heightfield";

    /** Finite world X of column zero, in metres. */
    originX: number;

    /** Finite world Z of row zero, in metres. */
    originZ: number;

    /** Finite spacing along positive X in metres, greater than zero. */
    spacingX: number;

    /** Finite spacing along positive Z in metres, greater than zero. */
    spacingZ: number;

    /** Number of columns along positive X, a safe integer of at least two. */
    columns: number;

    /** Number of rows along positive Z, a safe integer of at least two. */
    rows: number;

    /**
     * Finite world Y samples in metres, with exactly `columns * rows` entries.
     * The sample at column X and row Z is `samples[Z * columns + X]`.
     */
    samples: number[];
  }
}
