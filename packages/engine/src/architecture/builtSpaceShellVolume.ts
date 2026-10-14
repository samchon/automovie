import { IAutoMovieSpaceShell, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Volume, in cubic metres, enclosed by a closed outward-wound shell.
 *
 * The divergence theorem over triangles: a sixth of the summed scalar triple products. Voids subtract themselves through opposite winding. This is a binary64 evaluation of the polyhedral formula, with cancellation and overflow possible, especially for large coordinates far from the origin; it is not an exact-arithmetic volume certificate. {@link builtEnvironmentSpaceFidelity} reports the author's fidelity claim for what the facets represent.
 *
 * A shell wound inward returns the negative of its volume, and a triangle naming a missing vertex is skipped, as is a trailing index group shorter than three; validation refuses an open shell and an out-of-range index before this is reached.
 *
 * @param shell Closed triangle shell, in metres.
 * @returns Signed enclosed volume in cubic metres, positive for outward winding.
 *
 * @evidence contracts/common.md#principled-implementation Uses one sixth of the binary64 sum of `a · (b × c)`. The divergence-theorem volume and origin independence require a closed, consistently oriented shell with suitable finite intermediates. Validation checks local edge pairing and positive aggregate computed volume; it does not prove every component's orientation or exclude all self-intersections.
 * @evidence contracts/common.md#clear-and-simple-design One accumulation loop over the index triples, with voids handled by winding rather than by a separate record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no shell; a missing vertex is skipped rather than guessed, and the documentation says validation refuses that record before this runs.
 * @evidence contracts/common.md#meaningful-documentation States the formula, the unit, how voids and inward winding read, what is skipped, and which caller answers for fidelity.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the triangle indices with constant extra space, linear in the triangle count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure sum over one shell value that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates nothing beyond scalars and retains nothing.
 * @author Samchon
 */
export const builtSpaceShellVolume: (shell: IAutoMovieSpaceShell) => number = (
  shell: IAutoMovieSpaceShell,
): number => {
  let sum: number = 0;
  for (let face: number = 0; face + 2 < shell.triangles.length; face += 3) {
    const a: IAutoMovieVector3 | undefined =
      shell.vertices[shell.triangles[face]!];
    const b: IAutoMovieVector3 | undefined =
      shell.vertices[shell.triangles[face + 1]!];
    const c: IAutoMovieVector3 | undefined =
      shell.vertices[shell.triangles[face + 2]!];
    if (a === undefined || b === undefined || c === undefined) continue;
    sum +=
      a.x * (b.y * c.z - b.z * c.y) +
      a.y * (b.z * c.x - b.x * c.z) +
      a.z * (b.x * c.y - b.y * c.x);
  }
  return sum / 6;
};
