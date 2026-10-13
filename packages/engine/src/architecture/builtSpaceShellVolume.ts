import { IAutoMovieSpaceShell } from "@automovie/interface";

/**
 * Volume, in cubic metres, enclosed by a closed outward-wound shell.
 *
 * The divergence theorem over triangles: a sixth of the summed scalar triple
 * products. Voids subtract themselves, because their facets are wound the other
 * way and contribute the negative of what they enclose, which is the whole
 * reason an atrium is inner facets rather than a second record. Exact for the
 * flats as written; what the flats stand for is
 * {@link builtEnvironmentSpaceFidelity}'s answer, not this one's.
 *
 * A shell wound inward returns the negative of its volume, and a triangle
 * naming a missing vertex is skipped; validation refuses both an open shell and
 * an out-of-range index before this is reached.
 *
 * @evidence contracts/common.md#principled-implementation Divergence theorem over a closed triangle mesh, a sixth of the summed `a · (b x c)` per triangle, exact for flat facets with inward-wound void facets subtracting themselves; it presumes a closed, consistently outward-wound shell.
 * @evidence contracts/common.md#clear-and-simple-design One loop with no helper, shared by validation and the quantity take-off so the two never compute shell volume differently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Skipping a triangle with a missing vertex is a compensation reachable only on an unvalidated shell, and an inward-wound shell's negative sum is returned as is instead of being hidden by an absolute value.
 * @evidence contracts/common.md#meaningful-documentation States the cubic-metre unit, the outward-winding premise, how voids subtract, the sign for an inward shell, the skipped-triangle case, and that faceting fidelity is another query's answer.
 * @evidence contracts/performance.md#cost-and-resources Linear in triangle count with constant arithmetic and no allocation per triangle; the result is a scalar that nothing caches, so validation and the take-off each pay one pass per shell.
 * @author Samchon
 */
export const builtSpaceShellVolume = (shell: IAutoMovieSpaceShell): number => {
  let sum = 0;
  for (let face = 0; face + 2 < shell.triangles.length; face += 3) {
    const a = shell.vertices[shell.triangles[face]!];
    const b = shell.vertices[shell.triangles[face + 1]!];
    const c = shell.vertices[shell.triangles[face + 2]!];
    if (a === undefined || b === undefined || c === undefined) continue;
    sum +=
      a.x * (b.y * c.z - b.z * c.y) +
      a.y * (b.z * c.x - b.x * c.z) +
      a.z * (b.x * c.y - b.y * c.x);
  }
  return sum / 6;
};
