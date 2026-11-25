/**
 * Normalized foot-skin observations, separating projected dorsum heights from
 * toe skin reaches.
 *
 * The interface package owns these declarations; AutoMovieHumanFootPlaces in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanFootPlaces {
  /** Dorsum height per body-X span, at projected shares from heel X. */
  export type Forefoot = readonly {
    /**
     * Projected body-X station ahead of heel X divided by the foot's body-X
     * span.
     */
    readonly share: number;
    /** Dorsum height divided by the foot's projected body-X span. */
    readonly height: number;
  }[];

  /**
   * The toes' skin reaches, medial (the hallux) to lateral: each foremost point
   * ahead of the heel along the axis from the heel's rearmost to the foot's
   * foremost point, and its first loop's vertex-mean across that axis toward
   * the little toe, per foot length. `test_human_estimate_sites` reads
   * foot-axis projections of horizontal skin loops on four feet, below 25 mm
   * and ahead of 0.7 of the foot's length, each toe's tip the foremost over its
   * sections; SDs: tip 0.021, 0.018, 0.021, 0.020 and 0.013, across 0.008,
   * 0.006, 0.002, 0.007 and 0.008. The sections part six loops per foot on
   * average (SD 1.1), so the feet where they part other than five are left out.
   * These are skin observations, not metatarsal heads or MTP/PIP/DIP joint
   * centres. Reusing their across centres for a rig requires a separate
   * placement convention. The independent public breadth is applied by the
   * consumer; these retained ratios are still normalized by foot length. Across
   * means are not toe-normal breadths; gap-based width packing is a
   * construction proxy. Combining the along maximum and first-loop across mean
   * gives a generated apex proxy, not an observed three-dimensional tip.
   */
  export type Toes = readonly {
    /** Toe tip's forward reach divided by rotated heel-to-foremost foot length. */
    readonly tip: number;
    /**
     * First separate toe-loop transverse mean divided by rotated
     * heel-to-foremost foot length; this is a skin observation, not a bone
     * centre.
     */
    readonly across: number;
  }[];
}
