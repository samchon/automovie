/**
 * A small disc of the realized skin, about a datum point, faired into a G1 thin-plate patch once every face is drawn and closed.
 *
 * Where meeting surfaces leave a corner or a fold that no operator owns, as a host's wall turning into a port's band under a slit, the
 * orthodox remedy trims a small neighbourhood and fills it G1 to its rim; the engine fills a disc of the skin whose path along its edges
 * from the skin vertex nearest `point` is shorter than `radius`, holding the two rings outside it. A point farther than `radius` from every
 * skin vertex is one diagnostic and that fill is left out.
 *
 * @evidence contracts/development/design.md#principled-representation The fill is the discrete thin-plate patch a fork's fill already uses, placed by a landmark the author states instead of by an operator's own corner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A point and a radius are the whole declaration; the disc and its rim are read from the skin.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A point with no skin near it is reported, never moved to the nearest skin anywhere.
 * @evidence contracts/development/common.md#meaningful-documentation States what is filled, how the disc is found, the units and the failure effect.
 */
export interface IAutoMovieConstructionFill {
  /** The datum the disc is centred near, `[x, y, z]` in the construction's frame, metres. */
  point: [number, number, number];

  /** The disc's radius along the skin, metres, positive. */
  radius: number;
}
