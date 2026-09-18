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
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtSpaceShellVolume` produces volume, in cubic metres, enclosed by a closed outward-wound shell. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtSpaceShellVolume` performs volume calculation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
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
