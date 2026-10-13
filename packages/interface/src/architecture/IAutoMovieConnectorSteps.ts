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
 * @evidence contracts/common.md#principled-implementation Compares `count * rise` with the route's net vertical change and `count * run` with its summed horizontal segment length, each within 1 mm; because the climb is net, a route that rises and then falls is checked only by its end-to-end difference.
 * @evidence contracts/common.md#clear-and-simple-design Three scalars describe one uniform flight; uneven risers or winders are not representable, and the record is read only by `validateBuiltEnvironment`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1 mm `STEP_TOLERANCE` is the single constant and is stated in the prose; no connector kind is exempt, and the route checks run only once count, rise, and run are themselves valid.
 * @evidence contracts/common.md#meaningful-documentation States the metre units, the safe-integer count floor, the millimetre tolerance, exactly which route quantities the totals must match, and that nothing renders treads from it.
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
