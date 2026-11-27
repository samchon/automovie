/*
 * The first grid instant after a read one that a measured margin does not
 * certify, by conservative advancement (Mirtich 1996, Impulse-based Dynamic
 * Simulation of Rigid Body Systems, ch. 3): a check reads a margin `d` at an
 * instant, how far its value may still move before it can violate, and a bound
 * on how far the value can move from that instant to a later one; every later
 * instant the bound keeps below `d` cannot violate and is not read.
 *
 * The grid is a scan's own sequence of instants, by index. `travel(at, j)`
 * bounds how far the checked value can move between the instant read, `at`, and
 * instant `j`: a quantity in the margin's unit, not negative, that does not
 * decrease as `j` grows (a bound summed over the grid's steps, or a rate bound
 * times the elapsed time), or undefined where no bound is certified, which then
 * holds for every later `j` too. Instant `j` is certified when its travel is
 * strictly below the margin. The search gallops (one step, two, four, ...)
 * until an instant is not certified or the grid ends, then halves the last
 * gallop to the first such instant, so the bound is asked a number of times
 * logarithmic in the stretch certified. The instant returned is the one a scan
 * that read every instant would reach first with an uncertified margin, so a
 * scan that reads only the returned instants finds the same first violation as
 * a scan of every instant.
 * Parameter at: The index of the instant read.
 * Parameter end: The index of the grid's last instant, at least `at`.
 * Parameter margin: How far the checked value may move from its reading at `at`
 * before it can violate, in the unit `travel` gives; zero, negative or NaN
 * certifies nothing.
 * Parameter travel: The bound on the value's movement from `at` to a later index,
 * or undefined where none is certified.
 * Returns: The least index in `(at, end]` that is not certified, or `end + 1`
 * when every instant to the end is.
 * When the bound is negative or not a number.
 */
export function advanceAutoMovieGrid(
  at: number,
  end: number,
  margin: number,
  travel: (from: number, to: number) => number | undefined,
): number {
  if (!(margin > 0) || at >= end) return at + 1;
  const certified = (j: number): boolean => {
    const moved: number | undefined = travel(at, j);
    if (moved === undefined) return false;
    if (!(moved >= 0))
      throw new RangeError(
        `A grid advancement's bound is ${moved}, not a non-negative number`,
      );
    return moved < margin;
  };

  // Gallop: `lo` is the last index known certified, `hi` the first known not.
  let lo: number = at;
  let hi: number = end + 1;
  for (let step: number = 1; ; step *= 2) {
    const j: number = Math.min(end, at + step);
    if (!certified(j)) {
      hi = j;
      break;
    }
    lo = j;
    if (j === end) return end + 1;
  }

  // Halve the last gallop to the first index not certified.
  while (hi - lo > 1) {
    const mid: number = lo + Math.floor((hi - lo) / 2);
    if (certified(mid)) lo = mid;
    else hi = mid;
  }
  return hi;
}
