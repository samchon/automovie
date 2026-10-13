/**
 * The lowest and highest of a run of numbers, folded rather than spread.
 *
 * `Math.min(...values)` passes one argument per element, and a mesh of
 * forty-odd thousand triangles — an ordinary imported one, and one the built
 * environment validator accepts without complaint — overflows the call stack
 * before a single line has been classified. A drawing kernel that worked only
 * on models small enough to fit in an argument list is a kernel nobody could
 * put a building through, so every extreme this folder takes is taken here.
 *
 * An empty run yields the identities, `+Infinity` and `-Infinity`. Every caller
 * has already established that it has something to measure; the identities are
 * what makes that precondition visible rather than a thrown `undefined`.
 *
 * @author Samchon
 */
export const autoMovieDrawingRange = (
  values: Iterable<number>,
): { min: number; max: number } => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return { min, max };
};
