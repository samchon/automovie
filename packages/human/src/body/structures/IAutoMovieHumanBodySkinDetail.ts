/**
 * The table a body's skin micro-relief is generated from: one square tile of
 * the skin surface, its primary line families and its pores, in physical
 * units, and the relief's deepening with age.
 *
 * @evidence contracts/common.md#principled-implementation A seeded physical tile describes Gaussian groove families and pores, with an authored age-dependent strength curve.
 * @evidence contracts/common.md#clear-and-simple-design The relief schema separates resolution, physical scale and feature parameters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The seed makes the procedural field repeatable; the schema does not establish measured individual skin microstructure.
 * @evidence contracts/common.md#meaningful-documentation Members give millimetres, micrometres, phase directions and endpoint-held age interpolation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The procedural micro-relief table definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The procedural micro-relief table type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The procedural micro-relief table declaration does not acquire or retain runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinDetail {
  /** Seed of the pore placement and the lines' wander. */
  seed: number;

  /** Texels along each side of the square tile. */
  pixels: number;

  /** Physical side of the tile, millimetres. */
  tileMillimetres: number;

  /**
   * Line families: `(a, b)` are the integer phase coefficients in the UV
   * frame. Unwarped grooves follow constant `a*u + b*v`, so their tangent direction
   * is `(-b, a)` and their spacing is the tile side divided by `hypot(a, b)`.
   * Each is a Gaussian valley of `depth` and
   * `width` micrometres whose phase wanders by up to `wander` of a groove and
   * whose depth varies along it by up to `vary` of itself, breaking where it
   * reaches nothing.
   */
  lines: {
    /** Integer phase coefficient multiplying the tile's U coordinate. */
    a: number;

    /** Integer phase coefficient multiplying the tile's V coordinate. */
    b: number;

    /** Gaussian groove depth, micrometres. */
    depth: number;

    /** Gaussian groove width, micrometres. */
    width: number;

    /** Maximum phase wander, as a fraction of one groove period. */
    wander: number;

    /** Maximum depth variation, as a fraction of the groove depth. */
    vary: number;
  }[];

  /** Follicular openings: count per square centimetre, Gaussian radius and depth in micrometres. */
  pores: {
    /** Follicular opening density over the tile's physical area. */
    perSquareCentimetre: number;

    /** Gaussian opening radius, micrometres. */
    radiusMicrometres: number;

    /** Gaussian opening depth, micrometres. */
    depthMicrometres: number;
  };

  /**
   * The relief's strength by the document's `macroAge` weight, `[weight,
   * factor]` points, piecewise linear and held at the ends: the primary lines
   * deepen with age.
   */
  age: [number, number][];
}
