import { IAutoMovieSpaceShell, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Volume, in cubic metres, enclosed by a closed outward-wound shell.
 *
 * The divergence theorem over triangles: a sixth of the summed scalar triple
 * products. Voids subtract themselves through opposite winding. This is a
 * binary64 evaluation of the polyhedral formula, with cancellation and overflow
 * possible, especially for large coordinates far from the origin; it is not an
 * exact-arithmetic volume certificate. {@link builtEnvironmentSpaceFidelity}
 * reports the author's fidelity claim for what the facets represent.
 *
 * A shell wound inward returns the negative of its volume, and a triangle
 * naming a missing vertex is skipped, as is a trailing index group shorter than
 * three; validation refuses an open shell and an out-of-range index before this
 * is reached.
 *
 * @param shell Closed triangle shell, in metres.
 * @returns Signed enclosed volume in cubic metres, positive for outward
 *   winding.
 */
export function builtSpaceShellVolume(shell: IAutoMovieSpaceShell): number {
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
}
