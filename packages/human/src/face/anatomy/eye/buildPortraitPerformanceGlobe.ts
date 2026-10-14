import type { IAutoMovieMesh } from "@automovie/interface";

import type { IPortraitEyeSphere } from "../../surface/structures/IPortraitEyeSphere";

/**
 * Construct one complete globe independent of eyelid visibility. Single pole
 * vertices and wrapped ring indices avoid collapsed rectangular pole cells.
 * The surrounding opaque tissues, not a changing optical mesh, hide the globe.
 *
 * The sphere is in the caller's frame and unit (the eye component passes head
 * millimetres, +Y superior, +Z anterior); its poles lie on the frame's Y axis.
 * Positions are exactly `center + radius * normal`, so each unit normal is the
 * analytic outward normal of the sphere and not a triangle average. Columns
 * (3 to 512) are the meridians and rows (2 to 512) the latitude bands, giving
 * `columns * (rows - 1) + 2` vertices and `2 * columns * (rows - 1)` triangles.
 * A non-finite or non-positive sphere, a count outside those ranges or a
 * placement that overflows finite coordinates throws.
 *
 * @evidence contracts/common.md#principled-implementation Single poles and wrapped latitude rings construct one outward sampled sphere with analytic radial normals in the caller's frame.
 * @evidence contracts/common.md#clear-and-simple-design Bounded sampling admission precedes one mesh allocation; surrounding tissue rather than mesh clipping owns optical visibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts outside 3..512 columns or 2..512 rows and nonrepresentable placement refuse, without dimension clipping or anatomy claims.
 * @evidence contracts/common.md#meaningful-documentation The prose gives caller units/axes, exact count formulas, analytic normal meaning and refusal conditions.
 * @evidence contracts/performance.md#efficient-algorithms C columns and R rows require O(CR) positions/indices/normals under the explicit 512-by-512 sampling limits.
 * @evidence contracts/performance.md#reuse-equivalent-work Ring vertices are shared across adjacent faces and analytic unit normals are reused for radius-scaled placement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned arrays own the globe; scalar/ring loop temporaries expire and no input sphere or resource is retained.
 */
export function buildPortraitPerformanceGlobe(
  sphere: IPortraitEyeSphere,
  columns: number,
  rows: number,
): IAutoMovieMesh {
  if (
    ![sphere.center.x, sphere.center.y, sphere.center.z, sphere.radius].every(
      Number.isFinite,
    ) ||
    sphere.radius <= 0 ||
    !Number.isInteger(columns) ||
    columns < 3 ||
    columns > 512 ||
    !Number.isInteger(rows) ||
    rows < 2 ||
    rows > 512
  )
    throw new Error(
      "A performance globe needs a finite positive sphere and bounded integer sampling.",
    );
  const normals: number[] = [0, 1, 0];
  const indices: number[] = [];
  for (let row: number = 1; row < rows; row++) {
    const latitude: number = (Math.PI * row) / rows;
    for (let column: number = 0; column < columns; column++) {
      const longitude: number = (2 * Math.PI * column) / columns;
      normals.push(
        Math.sin(latitude) * Math.cos(longitude),
        Math.cos(latitude),
        Math.sin(latitude) * Math.sin(longitude),
      );
    }
  }
  const south: number = normals.length / 3;
  normals.push(0, -1, 0);
  for (let column: number = 0; column < columns; column++) {
    const next: number = (column + 1) % columns;
    indices.push(0, 1 + next, 1 + column);
    for (let row: number = 0; row < rows - 2; row++) {
      const a: number = 1 + row * columns + column,
        b: number = 1 + row * columns + next;
      indices.push(a, b, a + columns, b, b + columns, a + columns);
    }
    const last: number = 1 + (rows - 2) * columns;
    indices.push(last + column, last + next, south);
  }
  const center: number[] = [sphere.center.x, sphere.center.y, sphere.center.z];
  const positions: number[] = normals.map(
    (value: number, axis: number): number  => center[axis % 3] + sphere.radius * value,
  );
  if (!positions.every(Number.isFinite))
    throw new Error(
      "Globe placement exceeds representable construction coordinates.",
    );
  return { positions, normals, indices, uvs: null, skin: null };
}
