/**
 * The repeated step of a stepped connector.
 *
 * The three numbers are checked against the route they describe: the flight's
 * risers must add up to the route's own climb and its goings to the route's own
 * horizontal run, within a millimetre. A stair whose steps do not reach its own
 * landing is a design defect, not a rendering detail.
 *
 * The climb is the absolute `y` change from the route's first point to its
 * last, and the horizontal run is the summed `x`-`z` length of its segments.
 * Only validation reads this record; no lowering or drawing builds treads from
 * it.
 *
 * @author Samchon
 */
export interface IAutoMovieConnectorSteps {
  /** How many steps the run has; a safe integer of at least `1`. */
  count: number;

  /** Positive vertical rise of one step, in metres. */
  rise: number;

  /** Positive horizontal going of one step, in metres. */
  run: number;
}
