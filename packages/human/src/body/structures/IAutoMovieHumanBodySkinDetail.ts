/**
 * The table a body's skin micro-relief is generated from: one square tile of
 * the skin surface, its primary line families and its pores, in physical
 * units, and the relief's deepening with age.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Types the measured micro-relief statistics a user can read to see what the skin detail is made of.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Declares the table form: tile size and resolution, line families, pores, seed and the age curve.
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
   * Line families: grooves along the integer direction `(a, b)`, `hypot(a,
   * b)` of them across the tile, each a Gaussian valley of `depth` and
   * `width` micrometres whose phase wanders by up to `wander` of a groove and
   * whose depth varies along it by up to `vary` of itself, breaking where it
   * reaches nothing.
   */
  lines: {
    a: number;
    b: number;
    depth: number;
    width: number;
    wander: number;
    vary: number;
  }[];

  /** Follicular openings: count per square centimetre, Gaussian radius and depth in micrometres. */
  pores: {
    perSquareCentimetre: number;
    radiusMicrometres: number;
    depthMicrometres: number;
  };

  /**
   * The relief's strength by the document's `macroAge` weight, `[weight,
   * factor]` points, piecewise linear and held at the ends: the primary lines
   * deepen with age.
   */
  age: [number, number][];
}
