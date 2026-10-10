import { createAutoMovieSignedMeshQuery } from "@automovie/engine";

import type { IAutoMovieHumanBodySkinVoxels } from "../structures/IAutoMovieHumanBodySkinVoxels";
import type { IHumanBodySkinVoxelDistance } from "../structures/IHumanBodySkinVoxelDistance";
import type { IHumanBodySkinVoxelInput } from "./IHumanBodySkinVoxelInput";
import { measureHumanBodyDistanceField } from "./measureHumanBodyDistanceField";

/**
 * Sample native posed triangles into a garment's bounded distance grid.
 *
 * The grid supplies candidate ball centres, not continuous triangle clearance.
 * Its Euclidean transform measures occupied voxel sites; the existing engine
 * nearest-feature query supplies actual triangle distance for both candidate
 * centres and the consumer's ball resting on a skin vertex. Candidate centres
 * retain the oriented interior-feature side of the source sheet and exclude
 * open-rim hits. This is local sheet qualification, not a closed-volume sign
 * for arbitrary open surfaces or a proof that posed skin has no intersections.
 * No source positions or topology are changed and no boundary is filled.
 *
 * All values use metres in the posed skin frame. The grid retains the existing
 * sixteen-million voxel limit and samples reaching triangles at spacing no
 * larger than three quarters of a cell. `closeHumanBodyUnderwearCreases` owns
 * the radius and displacement; this owner shares one triangle distance reading
 * between its candidate mask and the consumer's free-ball predicate.
 */
export function voxelizeHumanBodySkin(
  props: IHumanBodySkinVoxelInput,
): IAutoMovieHumanBodySkinVoxels {
  const { skin, points, pad, cell } = props;
  const queries = skin.map((surface) =>
    createAutoMovieSignedMeshQuery(
      {
        positions: [...surface.positions],
        indices: [...surface.indices],
        normals: null,
        uvs: null,
        skin: null,
      },
      { boundary: "open" },
    ),
  );
  const nearest = (at: readonly number[]): ReturnType<(typeof queries)[number]> | undefined => {
    let best: ReturnType<(typeof queries)[number]> | undefined;
    for (const query of queries) {
      const hit = query(at);
      if (best === undefined || hit.distance < best.distance) best = hit;
    }
    return best;
  };
  const origin: number[] = [];
  const size: number[] = [];
  for (let k = 0; k < 3; k++) {
    let low = Infinity;
    let high = -Infinity;
    for (let i = k; i < points.length; i += 3) {
      low = Math.min(low, points[i]);
      high = Math.max(high, points[i]);
    }
    origin.push(low - pad);
    size.push(Math.ceil((high - low + 2 * pad) / cell) + 1);
  }
  const dimensions = size as [number, number, number];
  const [nx, ny, nz] = dimensions;
  const total = nx * ny * nz;
  if (total > MOST_VOXELS)
    throw new Error("The garment is too large to close its creases: " + total);

  // sample the skin into the voxels
  const inverse = 1 / cell;
  let capacity = 1 << 16;
  let cells = new Int32Array(capacity);
  let positions = new Float64Array(capacity * 3);
  let taken = 0;
  for (const { positions: corner, indices } of skin) {
    // Only triangles reaching the grid contribute coarse occupied sites.
    // The continuous nearest-feature query above still reads the whole skin.
    const reaching = trianglesReaching(
      corner,
      indices,
      origin,
      dimensions,
      cell,
    );
    for (const t of reaching) {
      const a = indices[t] * 3;
      const b = indices[t + 1] * 3;
      const c = indices[t + 2] * 3;
      const e1 = [
        corner[b] - corner[a],
        corner[b + 1] - corner[a + 1],
        corner[b + 2] - corner[a + 2],
      ];
      const e2 = [
        corner[c] - corner[a],
        corner[c + 1] - corner[a + 1],
        corner[c + 2] - corner[a + 2],
      ];
      const steps = Math.max(
        1,
        Math.ceil(
          Math.max(
            Math.hypot(e1[0], e1[1], e1[2]),
            Math.hypot(e2[0], e2[1], e2[2]),
            Math.hypot(e2[0] - e1[0], e2[1] - e1[1], e2[2] - e1[2]),
          ) /
            (cell * 0.75),
        ),
      );
      for (let i = 0; i <= steps; i++)
        for (let j = 0; j <= steps - i; j++) {
          const wi = i / steps;
          const wj = j / steps;
          const px = corner[a] + e1[0] * wi + e2[0] * wj;
          const py = corner[a + 1] + e1[1] * wi + e2[1] * wj;
          const pz = corner[a + 2] + e1[2] * wi + e2[2] * wj;
          const ix = Math.round((px - origin[0]) * inverse);
          const iy = Math.round((py - origin[1]) * inverse);
          const iz = Math.round((pz - origin[2]) * inverse);
          if (ix < 0 || iy < 0 || iz < 0) continue;
          if (ix >= nx || iy >= ny || iz >= nz) continue;
          if (taken === capacity) {
            capacity *= 2;
            cells = grow(cells, capacity, 1);
            positions = grow(positions, capacity, 3);
          }
          cells[taken] = ix + nx * (iy + ny * iz);
          positions[taken * 3] = px;
          positions[taken * 3 + 1] = py;
          positions[taken * 3 + 2] = pz;
          ++taken;
        }
    }
  }

  // bucket the samples by voxel
  const occupied = new Uint8Array(total);
  const start = new Int32Array(total + 1);
  for (let s = 0; s < taken; s++) {
    occupied[cells[s]] = 1;
    ++start[cells[s] + 1];
  }
  for (let voxel = 0; voxel < total; voxel++) start[voxel + 1] += start[voxel];
  const order = new Int32Array(taken);
  const fill = start.slice(0, total);
  for (let s = 0; s < taken; s++) order[fill[cells[s]]++] = s;
  const field = measureHumanBodyDistanceField({
    dimensions,
    sites: occupied,
    nearest: true,
  });
  const distance: IHumanBodySkinVoxelDistance = { squared: field.squared, source: field.source! };

  const centre = (voxel: number): number[] => [
    origin[0] + (voxel % nx) * cell,
    origin[1] + (Math.floor(voxel / nx) % ny) * cell,
    origin[2] + Math.floor(voxel / (nx * ny)) * cell,
  ];
  // the sample nearest to `at` among those of `voxel` and its neighbours, or
  // -1 where they hold none; a neighbour past the grid's edge clamps onto the
  // voxel itself
  const sampleNear = (voxel: number, at: readonly number[]): number => {
    const i = voxel % nx;
    const j = Math.floor(voxel / nx) % ny;
    const k = Math.floor(voxel / (nx * ny));
    let best = Infinity;
    let sample = -1;
    for (let dk = -1; dk <= 1; dk++)
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          const neighbour =
            Math.min(nx - 1, Math.max(0, i + di)) +
            nx *
              (Math.min(ny - 1, Math.max(0, j + dj)) +
                ny * Math.min(nz - 1, Math.max(0, k + dk)));
          for (let s = start[neighbour]; s < start[neighbour + 1]; s++) {
            const base = order[s] * 3;
            const gap =
              (positions[base] - at[0]) ** 2 +
              (positions[base + 1] - at[1]) ** 2 +
              (positions[base + 2] - at[2]) ** 2;
            if (gap < best) {
              best = gap;
              sample = order[s];
            }
          }
        }
    return sample;
  };
  return {
    dimensions,
    cell,
    distance,
    centre,
    voxelOf: (at) => {
      const ijk = at.map((value, k) =>
        Math.min(
          dimensions[k] - 1,
          Math.max(0, Math.round((value - origin[k]) / cell)),
        ),
      );
      return ijk[0] + nx * (ijk[1] + ny * ijk[2]);
    },
    nearest: (voxel, at) => {
      const s = sampleNear(voxel, at);
      return s < 0
        ? at.slice()
        : [positions[s * 3], positions[s * 3 + 1], positions[s * 3 + 2]];
    },
    clearance: (at) => nearest(at)?.distance ?? Infinity,
    centres: (rho) => {
      const clear = ((rho - cell) / cell) ** 2;
      const shell = ((rho + 2 * cell) / cell) ** 2;
      const result = new Uint8Array(total);
      for (let voxel = 0; voxel < total; voxel++) {
        const squared = distance.squared[voxel];
        if (squared < clear || squared >= shell) continue;
        const hit = nearest(centre(voxel));
        if (
          hit !== undefined &&
          !hit.boundary &&
          hit.signedDistance > 0 &&
          hit.distance >= rho
        )
          result[voxel] = 1;
      }
      return result;
    },
  };
}

/** The most voxels a garment's grid may have. */
const MOST_VOXELS = 16_000_000;

/** `values` copied into an array of `capacity` records of `width` numbers. */
function grow<T extends Int32Array | Float32Array | Float64Array>(
  values: T,
  capacity: number,
  width: number,
): T {
  const larger = new (values.constructor as new (length: number) => T)(
    capacity * width,
  );
  larger.set(values);
  return larger;
}

/** The offsets into `indices` of the triangles that are not wholly beyond the grid on one side. */
function trianglesReaching(
  positions: readonly number[],
  indices: readonly number[],
  origin: readonly number[],
  dimensions: readonly number[],
  cell: number,
): number[] {
  const reaching: number[] = [];
  for (let t = 0; t < indices.length; t += 3) {
    let reaches = true;
    for (let axis = 0; axis < 3; axis++) {
      const low = origin[axis];
      const high = low + (dimensions[axis] - 1) * cell;
      const x = positions[indices[t] * 3 + axis];
      const y = positions[indices[t + 1] * 3 + axis];
      const z = positions[indices[t + 2] * 3 + axis];
      if ((x < low && y < low && z < low) || (x > high && y > high && z > high))
        reaches = false;
    }
    if (reaches) reaching.push(t);
  }
  return reaching;
}
