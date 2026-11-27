/**
 * Partition one unit UV square into an affine boundary collar and local leaves.
 * Side knots are bottom, right, top and left, increasing in chart u or v. Every
 * outer leaf edge lies within one supplied side interval. The initial partition
 * has at most the four side span counts plus five leaves. This bound does not
 * cover later splits, fitted controls or generated vertices. Roots are center,
 * corner.bottom-left, corner.bottom-right, corner.top-left, corner.top-right,
 * or bottom/right/top/left followed by their interval ordinal. A split replaces
 * its leaf by .0 and .1 children in increasing axis order; parameter is a
 * global UV coordinate, not a relative child parameter. Bounds are
 * [u0,u1,v0,v1]. Thin positive spans remain present; their physical
 * conditioning and quadrature representability belong to the consumer. Invalid
 * input or an unrepresentable or over-budget partition throws without mutating
 * input. No source, boundary authority or physical curve is inferred.
 */

export namespace IAutoMovieRecoveryChartCollar {
  /**
   * Partition one unit UV square into an affine boundary collar and local
   * leaves. Side knots are bottom, right, top and left, increasing in chart u
   * or v. Every outer leaf edge lies within one supplied side interval. The
   * initial partition has at most the four side span counts plus five leaves.
   * This bound does not cover later splits, fitted controls or generated
   * vertices. Roots are center, corner.bottom-left, corner.bottom-right,
   * corner.top-left, corner.top-right, or bottom/right/top/left followed by
   * their interval ordinal. A split replaces its leaf by .0 and .1 children in
   * increasing axis order; parameter is a global UV coordinate, not a relative
   * child parameter. Bounds are [u0,u1,v0,v1]. Thin positive spans remain
   * present; their physical conditioning and quadrature representability belong
   * to the consumer. Invalid input or an unrepresentable or over-budget
   * partition throws without mutating input. No source, boundary authority or
   * physical curve is inferred.
   */

  export type Operation = (input: {
    /** Four strict increasing unit knot arrays, including both endpoints. */
    knots: readonly [
      readonly number[],
      readonly number[],
      readonly number[],
      readonly number[],
    ];

    /** Positive safe bound on both the initial and every resulting leaf count. */
    maxLeaves: number;

    /** Sequential split requests addressed to the currently retained leaf IDs. */
    splits?: readonly {
      /**
       * Stable identity of the chart leaf addressed by this split or collar
       * record.
       */
      leaf: string;
      /** Normalized chart axis: 0 selects u and 1 selects v. */
      axis: 0 | 1;
      /**
       * Global normalized coordinate of the requested split on the selected
       * axis.
       */
      parameter: number;
    }[];
  }) => {
    /** Global UV coordinates separating corners, side bands and center. */
    frame: {
      /** Global normalized u coordinate of the leaf's left boundary. */
      uL: number;
      /** Global normalized u coordinate of the leaf's right boundary. */
      uR: number;
      /** Global normalized v coordinate of the leaf's lower boundary. */
      vD: number;
      /** Global normalized v coordinate of the leaf's upper boundary. */
      vU: number;
    };

    /**
     * Deterministic map order, with children appended when their parent is
     * split.
     */
    leaves: {
      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id: string;

      /**
       * Identity of the original unrefined partition cell from which this leaf
       * descends.
       */
      root: string;

      /** Nonnegative subdivision depth below the original partition cell. */
      level: number;

      /**
       * Global normalized chart rectangle [u0,v0,u1,v1] with strictly
       * increasing extents.
       */
      bounds: [number, number, number, number];
    }[];

    /** Count before applying any explicit split requests. */
    initialLeaves: number;

    /** Source-free construction qualifications; validity failures throw. */
    diagnostics: string[];
  };
}
