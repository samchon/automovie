import { softBodyParticleDistance } from "./softBodyParticleDistance";
import { IAutoMovieSoftBodyDomain } from "@automovie/interface";
/** Find the shortest horizontal or vertical lattice rest edge; return Infinity for no structural edge or a mismatched coordinate-array length.
 *
 * @evidence contracts/common.md#principled-implementation A row-major horizontal/vertical walk uses the same scalar distance arithmetic as the solver, after checking one triple per declared particle. Typed admitted dimensions and dense finite rest entries are premises; extreme square overflow/underflow is not normalized away.
 * @evidence contracts/common.md#clear-and-simple-design The travel-number validator and budget reuse one shortest-edge owner, and canonical particle distance keeps budgeting arithmetic aligned with solver rest lengths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Length mismatch exits before a potentially huge lattice walk; Infinity is the existing no-edge sentinel and does not certify malformed domains, which validation reports independently.
 * @evidence contracts/common.md#meaningful-documentation States edge families, no-edge/mismatch meaning and numeric premises.
 * @evidence contracts/performance.md#efficient-algorithms With P admitted lattice particles, at most two outgoing edges per particle make O(P) time and constant extra storage; a length mismatch takes constant time.
 * @evidence contracts/performance.md#reuse-equivalent-work Each edge is considered once; a changed rest field or dimensions require a new minimum, so no cross-call cache is used.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar is returned; the authored rest array is read without copying, mutating or retaining it.
 *
 * @author Samchon
 */
export const shortestRestLength: (domain: IAutoMovieSoftBodyDomain) => number = (
  domain: IAutoMovieSoftBodyDomain,
): number => {
  const columns: number = domain.lattice.columns;
  const rows: number = domain.lattice.rows;
  if (domain.rest.length !== columns * rows * 3) return Infinity;
  let shortest: number = Infinity;
  for (let row: number = 0; row < rows; ++row)
    for (let column: number = 0; column < columns; ++column) {
      const particle: number = row * columns + column;
      if (column + 1 < columns) {
        const length: number = softBodyParticleDistance(domain.rest, particle, particle + 1);
        if (length < shortest) shortest = length;
      }
      if (row + 1 < rows) {
        const length: number = softBodyParticleDistance(domain.rest, particle, particle + columns);
        if (length < shortest) shortest = length;
      }
    }
  return shortest;
};