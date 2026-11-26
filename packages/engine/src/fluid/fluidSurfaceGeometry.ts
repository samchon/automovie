import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
  IAutoMovieFluidSurface,
  type IAutoMovieFluidSurfaceGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Derive the drawable free surface of one solved fluid state.
 *
 * Numerical mesh derivation belongs to the engine; the viewer copies these
 * attributes into Float32 buffers. That projection does not preserve every
 * binary64 bit or establish rendered pixel equality.
 *
 * One vertex per cell lies at its centre and world height origin.y + bed +
 * depth in row-major cell order. A quad is triangulated only when all four
 * corner cells have depth > solver.dryDepth and none is solid. Thus drained or
 * singleton-axis lattices have no triangles; nondegenerate X/Z spacing gives
 * counter-clockwise winding seen from above and a positive Y cross-product
 * component.
 *
 * Normals use `normalize(-dEta/dX, 1, -dEta/dZ)` from central differences,
 * one-sided differences at edges, and zero slope on a singleton axis. They do
 * not infer submerged/solid boundary slopes separately. Equal computed
 * elevations give flat normals when derived arithmetic is representable; a
 * singleton on one axis leaves the other axis's slope intact.
 *
 * IAutoMovieFluidSurface.flow is the per-cell average of its two x faces and of
 * its two z faces. The viewer uploads flow for supplied shaders; its default
 * material does not use it to animate ripples. UVs span [0, 1] independently on
 * each axis, or zero on a singleton. bounds measures only triangle-referenced
 * vertices and is null when no quad is drawn, even though all cell vertices
 * remain in the mesh.
 *
 * Throws for a mismatched state domain id. Matching ids do not validate
 * provenance, array lengths or finite fields; caller admission and a compatible
 * solved state are required. Extreme finite sums, slopes, squared normal
 * lengths and face averages have no finite-result gate.
 */
export function fluidSurfaceGeometry(
  props: IAutoMovieFluidSurfaceGeometry.IProps,
): IAutoMovieFluidSurface {
  const domain: IAutoMovieFluidDomain = props.domain;
  const state: IAutoMovieFluidState = props.state;
  if (state.domain !== domain.id)
    throw new Error(
      `fluid domain "${domain.id}" cannot draw a surface from a state of "${state.domain}"`,
    );
  const columns: number = domain.grid.columns;
  const rows: number = domain.grid.rows;
  const dx: number = domain.grid.cellX;
  const dz: number = domain.grid.cellZ;
  const origin: IAutoMovieVector3 = domain.grid.origin;
  const dry: number = domain.solver.dryDepth;

  const elevation: Float64Array = new Float64Array(columns * rows);
  for (let cell: number = 0; cell < elevation.length; ++cell)
    elevation[cell] = domain.bed[cell] + state.depth[cell];

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const flow: number[] = [];
  for (let row: number = 0; row < rows; ++row)
    for (let column: number = 0; column < columns; ++column) {
      const cell: number = row * columns + column;
      positions.push(
        origin.x + (column + 0.5) * dx,
        origin.y + elevation[cell],
        origin.z + (row + 0.5) * dz,
      );
      const west: number = column > 0 ? column - 1 : column;
      const east: number = column < columns - 1 ? column + 1 : column;
      const south: number = row > 0 ? row - 1 : row;
      const north: number = row < rows - 1 ? row + 1 : row;
      const slopeX: number =
        east === west
          ? 0
          : (elevation[row * columns + east] -
              elevation[row * columns + west]) /
            ((east - west) * dx);
      const slopeZ: number =
        north === south
          ? 0
          : (elevation[north * columns + column] -
              elevation[south * columns + column]) /
            ((north - south) * dz);
      const length: number = Math.sqrt(slopeX * slopeX + 1 + slopeZ * slopeZ);
      normals.push(-slopeX / length, 1 / length, -slopeZ / length);
      uvs.push(
        columns > 1 ? column / (columns - 1) : 0,
        rows > 1 ? row / (rows - 1) : 0,
      );
      const westFace: number = row * (columns + 1) + column;
      const southFace: number = row * columns + column;
      flow.push(
        (state.velocityX[westFace] + state.velocityX[westFace + 1]) / 2,
        (state.velocityZ[southFace] + state.velocityZ[southFace + columns]) / 2,
      );
    }

  /**
   * Constant-work quad-corner predicate on borrowed admitted arrays; solidity
   * must be exactly false and depth exceed the solver's dry threshold. No extra
   * renderer cutoff or retained state is introduced.
   */
  const drawable: (cell: number) => boolean = (cell: number): boolean =>
    domain.solid[cell] === false && state.depth[cell] > dry;
  const indices: number[] = [];
  for (let row: number = 0; row + 1 < rows; ++row)
    for (let column: number = 0; column + 1 < columns; ++column) {
      const here: number = row * columns + column;
      const ahead: number = here + columns;
      if (
        drawable(here) === false ||
        drawable(here + 1) === false ||
        drawable(ahead) === false ||
        drawable(ahead + 1) === false
      )
        continue;
      indices.push(here, ahead, here + 1, here + 1, ahead, ahead + 1);
    }

  const low: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const high: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
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
    flow,
  };
}
