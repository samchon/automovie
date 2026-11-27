import {
  IAutoMovieSoftBodySurface,
  type IAutoMovieSoftBodySurfaceGeometry,
} from "@automovie/interface";

/*
 * Derive fresh panel mesh arrays from a solved row-major particle field. Two
 * fixed triangles cover each lattice quad, UVs follow lattice coordinates and
 * zero accumulated normals use +Y. Bounds include indexed triangle vertices; a
 * cord or point with no quads returns null bounds.
 */
export function softBodySurfaceGeometry(
  props: IAutoMovieSoftBodySurfaceGeometry.IProps,
): IAutoMovieSoftBodySurface {
  const { domain, state }: typeof props = props;
  const columns: number = domain.lattice.columns;
  const rows: number = domain.lattice.rows;
  const count: number = columns * rows;

  const positions: number[] = state.positions.slice();
  const uvs: number[] = [];
  for (let row: number = 0; row < rows; ++row)
    for (let column: number = 0; column < columns; ++column)
      uvs.push(
        columns > 1 ? column / (columns - 1) : 0,
        rows > 1 ? row / (rows - 1) : 0,
      );

  const indices: number[] = [];
  for (let row: number = 0; row + 1 < rows; ++row)
    for (let column: number = 0; column + 1 < columns; ++column) {
      const here: number = row * columns + column;
      const ahead: number = here + columns;
      indices.push(here, ahead, here + 1, here + 1, ahead, ahead + 1);
    }

  const accumulated: Float64Array<ArrayBuffer> = new Float64Array(count * 3);
  for (let at: number = 0; at < indices.length; at += 3) {
    const a: number = indices[at];
    const b: number = indices[at + 1];
    const c: number = indices[at + 2];
    const ux: number = positions[b * 3] - positions[a * 3];
    const uy: number = positions[b * 3 + 1] - positions[a * 3 + 1];
    const uz: number = positions[b * 3 + 2] - positions[a * 3 + 2];
    const vx: number = positions[c * 3] - positions[a * 3];
    const vy: number = positions[c * 3 + 1] - positions[a * 3 + 1];
    const vz: number = positions[c * 3 + 2] - positions[a * 3 + 2];
    const nx: number = uy * vz - uz * vy;
    const ny: number = uz * vx - ux * vz;
    const nz: number = ux * vy - uy * vx;
    for (const vertex of [a, b, c]) {
      accumulated[vertex * 3] += nx;
      accumulated[vertex * 3 + 1] += ny;
      accumulated[vertex * 3 + 2] += nz;
    }
  }
  const normals: number[] = [];
  for (let vertex: number = 0; vertex < count; ++vertex) {
    const nx: number = accumulated[vertex * 3];
    const ny: number = accumulated[vertex * 3 + 1];
    const nz: number = accumulated[vertex * 3 + 2];
    const length: number = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (length === 0) normals.push(0, 1, 0);
    else normals.push(nx / length, ny / length, nz / length);
  }

  const low: { x: number; y: number; z: number } = {
    x: Infinity,
    y: Infinity,
    z: Infinity,
  };
  const high: { x: number; y: number; z: number } = {
    x: -Infinity,
    y: -Infinity,
    z: -Infinity,
  };
  for (const index of indices) {
    const x: number = positions[index * 3];
    const y: number = positions[index * 3 + 1];
    const z: number = positions[index * 3 + 2];
    low.x = Math.min(low.x, x);
    low.y = Math.min(low.y, y);
    low.z = Math.min(low.z, z);
    high.x = Math.max(high.x, x);
    high.y = Math.max(high.y, y);
    high.z = Math.max(high.z, z);
  }

  return {
    domain: domain.id,
    step: state.step,
    mesh: { positions, normals, uvs, indices, skin: null },
    bounds: indices.length === 0 ? null : { min: low, max: high },
  };
}
