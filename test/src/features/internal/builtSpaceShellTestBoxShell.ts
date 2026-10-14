import type {
  IAutoMovieSpaceShell,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The eight corners and twelve outward facets of an axis-aligned box.
 *
 * Supply eight authored box vertices and twelve triangles with selectable winding. Constructing or locating this fixture alone is not a product behavior proof; its consumers own assertions.
 * The literal corner combinations and hand-listed outward facets define an axis-aligned box; reversing each triangle's last two indices changes only orientation.
 * Outward and inward cubes distinguish signed orientation, and consumers mutate vertices/indices for refusing twins. This builder does not triangulate arbitrary shells or prove closure itself.
 */
export const builtSpaceShellTestBoxShell: (
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
  outward?: boolean,
) => IAutoMovieSpaceShell = (
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
  outward: boolean = true,
): IAutoMovieSpaceShell => {
  const vertices: IAutoMovieVector3[] = [
    { x: min.x, y: min.y, z: min.z },
    { x: max.x, y: min.y, z: min.z },
    { x: max.x, y: min.y, z: max.z },
    { x: min.x, y: min.y, z: max.z },
    { x: min.x, y: max.y, z: min.z },
    { x: max.x, y: max.y, z: min.z },
    { x: max.x, y: max.y, z: max.z },
    { x: min.x, y: max.y, z: max.z },
  ];
  const triangles: number[] = [
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 3, 2, 6, 3, 6, 7, 0, 5, 1, 0, 4, 5, 0,
    3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2,
  ];
  if (outward) return { vertices, triangles };
  const flipped: number[] = [];
  for (let face: number = 0; face < triangles.length; face += 3)
    flipped.push(triangles[face]!, triangles[face + 2]!, triangles[face + 1]!);
  return { vertices, triangles: flipped };
};
