import { AutoMovieEngineSoftBody } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `softBodyNeighbourOf` returns the row-major index of a particle's `at`-th
 * lattice neighbour (the table's order: four structural, four shear, four
 * bend), or −1 off the lattice.
 *
 * Scenarios:
 *
 * 1. On a 4 × 3 lattice, particle (1, 1) = 5: its right neighbour (at 1) is 6, its
 *    lower-right shear (at 7) is 10, its bend two right (at 9) is 7.
 * 2. Its bend two left (at 8) and two up (at 10) leave the lattice: −1.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Queries AutoMovieEngineSoftBody.softBodyNeighbourOf for five authored table positions at cell (1, 1) of a 4-by-3 lattice.
 * @evidence contracts/development/testing.md#independent-expectations Row-major indices at (2, 1), (2, 2) and (3, 1) are 6, 10 and 7. A two-cell move left or up leaves the grid and yields -1.
 * @evidence contracts/development/common.md#meaningful-documentation Right structural, lower-right shear and right bend neighbours exercise all three edge families. Two bend directions test the grid boundary.
 */
export function test_engine_soft_body_neighbour_of(): void {
  TestValidator.equals(
    "neighbours on the lattice",
    [1, 7, 9].map((at: number): number => AutoMovieEngineSoftBody.softBodyNeighbourOf(4, 3, 1, 1, at)),
    [6, 10, 7],
  );
  TestValidator.equals(
    "neighbours off the lattice",
    [8, 10].map((at: number): number => AutoMovieEngineSoftBody.softBodyNeighbourOf(4, 3, 1, 1, at)),
    [-1, -1],
  );
}
