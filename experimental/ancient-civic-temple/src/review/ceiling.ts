import { builtSpaceContainsPoint } from "@automovie/engine";
import type { IAutoMovieBuiltSpace } from "@automovie/interface";


export const ceiling = (space: IAutoMovieBuiltSpace, x: number, z: number): number | null => {
  if (!builtSpaceContainsPoint(space, { x, y: 1, z })) return null;
  const tops = space.cells.filter((cell) => cell.planes.every((plane) => plane.normal.x * x + plane.normal.y + plane.normal.z * z <= plane.offset + 1e-8)).flatMap((cell) => {
    const limits = cell.planes.filter((plane) => plane.normal.y > 1e-9)
      .map((plane) => (plane.offset - plane.normal.x * x - plane.normal.z * z) / plane.normal.y);
    return limits.length === 0 ? [] : [Math.min(...limits)];
  });
  return tops.length === 0 ? null : Math.max(...tops);
};
