/**
 * Is a point inside a closed shell?
 *
 * The winding number, summed as signed solid angles (Van Oosterom–Strackee), so
 * the answer never depends on a ray direction somebody had to pick and a void's
 * inward facets cancel the outer boundary's contribution exactly. A point
 * strictly inside subtends a full turn, a point outside subtends nothing, and a
 * point in a void subtends nothing because that is what a void is.
 *
 * The shell's own surface is inside it, tested first and by distance, because
 * solid angle degenerates exactly where a crate's corner sits: on a face it is
 * half a turn, but on an edge or at a vertex it is whatever the dihedral
 * happens to be, so a box standing in the corner of a room would have been
 * reported outside the room it is in.
  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const spaceShellContainsPoint = (
  shell: IAutoMovieSpaceShell,
  point: IAutoMovieVector3,
): boolean => {
  let winding = 0;
  for (let face = 0; face + 2 < shell.triangles.length; face += 3) {
    const a = shell.vertices[shell.triangles[face]!];
    const b = shell.vertices[shell.triangles[face + 1]!];
    const c = shell.vertices[shell.triangles[face + 2]!];
    if (a === undefined || b === undefined || c === undefined) continue;
    if (pointOnTriangle(point, a, b, c)) return true;
    winding += signedSolidAngle(point, a, b, c);
  }
  return Math.abs(winding) >= 2 * Math.PI;
};
