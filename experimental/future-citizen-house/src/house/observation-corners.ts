import { builtConvexCellVertices, builtSpaceContainsPoint } from "@automovie/engine";
import type { IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";

/** Corners of the actual orthogonal cell union at the observer's eye height.
 * An L footprint has six boundary corners; its bounding rectangle's absent
 * corners are not room corners. No room IDs or alternative coordinate atlas
 * enter this operation. Each inward diagonal remains 0.25m from both walls. */
export function boundaryCornerEyes(space: IAutoMovieBuiltSpace, y: number): IAutoMovieVector3[] {
  if (space.cells.some(cell => cell.planes.some(plane =>
    [plane.normal.x, plane.normal.y, plane.normal.z].filter(n => Math.abs(n) > 1e-8).length !== 1)))
    throw new Error(`${space.id}: orthogonal observation boundary required`);
  const vertices = space.cells.flatMap(cell => {
    const points = builtConvexCellVertices(cell);
    return points.some(p => p.y <= y) && points.some(p => p.y >= y) ? points : [];
  });
  const xs = [...new Set(vertices.map(p => p.x))].sort((a,b) => a-b);
  const zs = [...new Set(vertices.map(p => p.z))].sort((a,b) => a-b);
  const quadrants = [[-1,-1],[-1,1],[1,-1],[1,1]] as const;
  const output: IAutoMovieVector3[] = [];
  for (const x of xs) for (const z of zs) {
    const occupied = quadrants.map(([sx,sz]) => builtSpaceContainsPoint(space, {x:x+sx*.001,y,z:z+sz*.001}));
    const count = occupied.filter(Boolean).length;
    if (count !== 1 && count !== 3) continue;
    const [sx,sz] = quadrants[count === 1 ? occupied.indexOf(true) : 3-occupied.indexOf(false)]!;
    const point = {x:x+sx*.25,y,z:z+sz*.25};
    if (!builtSpaceContainsPoint(space,point))
      throw new Error(`${space.id}: actual boundary corner inset is outside own cells`);
    output.push(point);
  }
  return output;
}
