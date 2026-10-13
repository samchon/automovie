import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
  IAutoMovieFluidSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Derive the drawable free surface of one solved fluid state.
 *
 * The engine owns this so the renderer stays a projection of the solve. A
 * viewer that built its own water mesh would be a second opinion about where
 * the water is, and a second opinion can disagree with the depth field that the
 * mass balance was proven against.
 *
 * One vertex per cell, at the cell centre, at world height `origin.y + bed +
 * depth`; vertex order is the row-major cell order, so a vertex index and a
 * cell index are the same number. A quad is triangulated only when all four of
 * its corner cells are wet (`depth > solver.dryDepth`) and none is solid, which
 * is what makes a drained basin draw nothing at all rather than a flat sheet
 * lying on its floor. Triangles wind counter-clockwise seen from above, so the
 * surface faces `+y`.
 *
 * Normals come from the central difference of the free surface, `n = normalize(
 * −∂η/∂x, 1, −∂η/∂z )`, degenerating to forward and backward differences at the
 * lattice edge and to exactly `(0, 1, 0)` on a single-cell axis: still water is
 * numerically exactly flat, which is the visual counterpart of the solver's
 * lake-at-rest property.
 *
 * `IAutoMovieFluidSurface.flow` is, per cell, the average of its two x faces
 * and of its two z faces. A renderer scrolls ripples along it and never
 * re-derives it. `bounds` is the extent of the vertices the emitted triangles
 * use, or `null` when no quad is drawn.
 *
 * Throws when the state was not solved from this domain. Two water features
 * over two lattices is the ordinary case, so handing the second one's state to
 * the first one's grid is the ordinary mistake, and a lattice reading depths
 * that were never indexed for it emits `NaN` positions a renderer draws as
 * nothing at all: a silent empty pond in place of a named refusal.
 *
 * @evidence contracts/common.md#principled-implementation Reads the surface straight off the solved field: one centred vertex per cell at `bed + depth`, normals from central differences of that elevation (one-sided at the edge, flat on a single-cell axis), a quad only where all four corner cells are wet and not solid, and counter-clockwise winding whose cross product points up.
 * @evidence contracts/common.md#clear-and-simple-design One pass emits per-vertex attributes in row-major cell order, a second pass emits the drawable quads, and a third measures their bounds, so vertex and cell indices coincide and no remapping table exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dry quads are dropped by the solver's own `dryDepth`, not a renderer threshold, and a foreign state is refused instead of drawn; no lattice or domain is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the vertex placement and order, the wet-quad rule, the winding, the normal and flow derivations, what `bounds` measures, and the refusal with its reason.
 * @evidence contracts/performance.md#efficient-algorithms Linear in cells: one elevation pass, one attribute pass, one quad pass, and a bounds pass over the emitted indices, at most six per cell; the elevation array is computed once so each normal reads four neighbours without re-adding bed and depth.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One derivation per state per call; nothing is cached across frames.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned buffers are fresh and sized by the cell count, and the elevation scratch array dies with the call.
 */
export const fluidSurfaceGeometry = (props: {
  domain: IAutoMovieFluidDomain;
  state: IAutoMovieFluidState;
}): IAutoMovieFluidSurface => {
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

  const drawable = (cell: number): boolean =>
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
};
