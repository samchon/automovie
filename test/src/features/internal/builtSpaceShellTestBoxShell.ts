import type { IAutoMovieSpaceShell, IAutoMovieVector3 } from "@automovie/interface";


/** The eight corners and twelve outward facets of an axis-aligned box. */
export const builtSpaceShellTestBoxShell = (
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
  outward = true,
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
  const triangles = [
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 3, 2, 6, 3, 6, 7, 0, 5, 1, 0, 4, 5, 0,
    3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2,
  ];
  if (outward) return { vertices, triangles };
  const flipped: number[] = [];
  for (let face = 0; face < triangles.length; face += 3)
    flipped.push(triangles[face]!, triangles[face + 2]!, triangles[face + 1]!);
  return { vertices, triangles: flipped };
};
