import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

import { softBodyParticleDistance } from "./softBodyParticleDistance";

/**
 * Find the shortest horizontal or vertical lattice rest edge; return Infinity
 * for no structural edge or a mismatched coordinate-array length.
 */
export function shortestRestLength(domain: IAutoMovieSoftBodyDomain): number {
  const columns: number = domain.lattice.columns;
  const rows: number = domain.lattice.rows;
  if (domain.rest.length !== columns * rows * 3) return Infinity;
  let shortest: number = Infinity;
  for (let row: number = 0; row < rows; ++row)
    for (let column: number = 0; column < columns; ++column) {
      const particle: number = row * columns + column;
      if (column + 1 < columns) {
        const length: number = softBodyParticleDistance(
          domain.rest,
          particle,
          particle + 1,
        );
        if (length < shortest) shortest = length;
      }
      if (row + 1 < rows) {
        const length: number = softBodyParticleDistance(
          domain.rest,
          particle,
          particle + columns,
        );
        if (length < shortest) shortest = length;
      }
    }
  return shortest;
}
