import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";

/**
 * The shortest structural rest edge, or `Infinity` when there is none.
 *
 * A lattice whose rest array does not hold exactly one coordinate triple per
 * particle has no answerable shortest edge and is reported as having none. That
 * is not politeness: the walk is over the **declared** lattice, so a record
 * claiming a billion columns would otherwise be walked a billion times by the
 * very validator that exists to refuse it, and by every budget report anybody
 * asked for on the way. The length mismatch is refused on its own path.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-fidelity-boundary Measures the spatial bound that makes the fixed-step tier supportable.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-failure-and-fidelity-boundary Returns no fabricated length when the authored lattice is inconsistent.
 */
export const shortestRestLength = (
  domain: IAutoMovieSoftBodyDomain,
): number => {
  const columns = domain.lattice.columns;
  const rows = domain.lattice.rows;
  if (domain.rest.length !== columns * rows * 3) return Infinity;
  let shortest = Infinity;
  for (let row = 0; row < rows; ++row)
    for (let column = 0; column < columns; ++column) {
      const particle = row * columns + column;
      if (column + 1 < columns) {
        const length = distance(domain.rest, particle, particle + 1);
        if (length < shortest) shortest = length;
      }
      if (row + 1 < rows) {
        const length = distance(domain.rest, particle, particle + columns);
        if (length < shortest) shortest = length;
      }
    }
  return shortest;
};

/** Distance between two particles of a flat `[x, y, z, ...]` position array. */
const distance = (values: ArrayLike<number>, a: number, b: number): number => {
  const dx = values[b * 3] - values[a * 3];
  const dy = values[b * 3 + 1] - values[a * 3 + 1];
  const dz = values[b * 3 + 2] - values[a * 3 + 2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};
