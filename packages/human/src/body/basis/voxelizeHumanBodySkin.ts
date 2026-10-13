import { createAutoMovieSignedMeshQuery } from "@automovie/engine";

import type { IAutoMovieHumanBodySkinVoxels } from "../structures/IAutoMovieHumanBodySkinVoxels";
import type { IHumanBodySkinVoxelDistance } from "../structures/IHumanBodySkinVoxelDistance";
import type { IHumanBodySkinVoxelInput } from "./IHumanBodySkinVoxelInput";
import { measureHumanBodyDistanceField } from "./measureHumanBodyDistanceField";

/**
 * Sample native posed triangles into a garment's bounded distance grid.
 *
 * The grid supplies candidate ball centres. Its squared Euclidean transform measures occupied voxel sites in squared voxel units; shared engine nearest-feature queries supply actual triangle separation in posed metres. Candidate centres require the oriented exterior side of an interior source feature and exclude open-rim hits. This qualifies a local sheet rather than assigning a global closed-volume sign or proving posed skin has no intersections. Source positions/topology remain unchanged and no boundary is filled.
 *
 * Complete finite garment points, nonnegative finite padding and a positive finite cell length define the neighbourhood. Unrepresentable dimensions, reciprocal cell length and triangle step counts refuse before indexing or sampling. The existing sixteen-million voxel limit bounds the grid, and reaching triangles are sampled at spacing no larger than three quarters of a cell. It does not bound the number of triangle samples: very long triangles relative to cell size can still require large work and resident sample buffers. closeHumanBodyUnderwearCreases owns radius and displacement; its mask and free-ball predicate share these actual triangle queries.
 *
 * @evidence contracts/common.md#principled-implementation Reaching triangle samples populate occupied grid sites for the shared squared-distance transform; actual nearest-feature queries separately qualify ball centres by clearance, exterior sheet direction and open-rim exclusion.
 * @evidence contracts/common.md#clear-and-simple-design One compiled voxel neighbourhood exposes coordinate, local sample, continuous clearance and candidate-mask queries while source geometry and connected fitting retain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid/unrepresentable grid inputs refuse without bypassing the sixteen-million voxel bound; sample distance cannot replace triangle clearance or certify a closed volume, global embedding or clinical cloth fit.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes posed-metre triangle readings from squared voxel units, .75-cell sampling policy, finite indexing admission and sample-population costs outside the grid bound.
 * @evidence contracts/performance.md#efficient-algorithms Each reaching triangle with n edge subdivisions contributes O(n squared) samples, bucketing and the distance transform are linear in samples/grid size, and candidate qualification adds actual nearest-feature query costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One set of native triangle query hierarchies and one sampled grid serve candidate masks and free-ball clearance; local buckets and the shared distance owner avoid rebuilding them per point.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Query closures retain source snapshots and sample buckets until the voxel result is released; grid arrays are capped at sixteen million sites but sample capacity follows actual subdivisions, and no external handle or task is acquired.
 */
export function voxelizeHumanBodySkin(
  props: IHumanBodySkinVoxelInput,
): IAutoMovieHumanBodySkinVoxels {
  const { skin, points, pad, cell }: IHumanBodySkinVoxelInput = props;
  if (points.length === 0 || points.length % 3 !== 0 ||
      !points.every(Number.isFinite) || !Number.isFinite(pad) || pad < 0 ||
      !Number.isFinite(cell) || !(cell > 0))
    throw new Error("Garment voxel sampling needs finite complete points, nonnegative padding and a positive finite cell length.");
  const queries: ReturnType<typeof createAutoMovieSignedMeshQuery>[] = skin.map((surface: IHumanBodySkinVoxelInput["skin"][number]): ReturnType<typeof createAutoMovieSignedMeshQuery> =>
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
  const nearest: (at: readonly number[]) => ReturnType<(typeof queries)[number]> | undefined = (at: readonly number[]): ReturnType<(typeof queries)[number]> | undefined => {
    let best: ReturnType<(typeof queries)[number]> | undefined;
    for (const query of queries) {
      const hit: ReturnType<typeof query> = query(at);
      if (best === undefined || hit.distance < best.distance) best = hit;
    }
    return best;
  };
  const origin: number[] = [];
  const size: number[] = [];
  for (let k: number = 0; k < 3; k++) {
    let low: number = Infinity;
    let high: number = -Infinity;
    for (let i: number = k; i < points.length; i += 3) {
      low = Math.min(low, points[i]);
      high = Math.max(high, points[i]);
    }
    origin.push(low - pad);
    size.push(Math.ceil((high - low + 2 * pad) / cell) + 1);
  }
  const dimensions: [number, number, number] = [size[0], size[1], size[2]];
  const [nx, ny, nz]: [number, number, number] = dimensions;
  const total: number = nx * ny * nz;
  if (!origin.every(Number.isFinite) ||
      !dimensions.every((value: number): boolean => Number.isSafeInteger(value) && value > 0) ||
      !Number.isSafeInteger(total))
    throw new Error("Garment voxel grid dimensions exceed representable finite indexing.");
  if (total > MOST_VOXELS)
    throw new Error("The garment is too large to close its creases: " + total);

  // sample the skin into the voxels
  const inverse: number = 1 / cell;
  if (!Number.isFinite(inverse))
    throw new Error("Garment voxel cell reciprocal is not representable.");
  let capacity: number = 1 << 16;
  let cells: Int32Array = new Int32Array(capacity);
  let positions: Float64Array = new Float64Array(capacity * 3);
  let taken: number = 0;
  for (const { positions: corner, indices } of skin) {
    // Only triangles reaching the grid contribute coarse occupied sites.
    // The continuous nearest-feature query above still reads the whole skin.
    const reaching: number[] = trianglesReaching(
      corner,
      indices,
      origin,
      dimensions,
      cell,
    );
    for (const t of reaching) {
      const a: number = indices[t] * 3;
      const b: number = indices[t + 1] * 3;
      const c: number = indices[t + 2] * 3;
      const e1: number[] = [
        corner[b] - corner[a],
        corner[b + 1] - corner[a + 1],
        corner[b + 2] - corner[a + 2],
      ];
      const e2: number[] = [
        corner[c] - corner[a],
        corner[c + 1] - corner[a + 1],
        corner[c + 2] - corner[a + 2],
      ];
      const steps: number = Math.max(
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
      if (!Number.isSafeInteger(steps))
        throw new Error("Garment triangle sampling exceeds representable step indexing.");
      for (let i: number = 0; i <= steps; i++)
        for (let j: number = 0; j <= steps - i; j++) {
          const wi: number = i / steps;
          const wj: number = j / steps;
          const px: number = corner[a] + e1[0] * wi + e2[0] * wj;
          const py: number = corner[a + 1] + e1[1] * wi + e2[1] * wj;
          const pz: number = corner[a + 2] + e1[2] * wi + e2[2] * wj;
          const ix: number = Math.round((px - origin[0]) * inverse);
          const iy: number = Math.round((py - origin[1]) * inverse);
          const iz: number = Math.round((pz - origin[2]) * inverse);
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
  const occupied: Uint8Array = new Uint8Array(total);
  const start: Int32Array = new Int32Array(total + 1);
  for (let s: number = 0; s < taken; s++) {
    occupied[cells[s]] = 1;
    ++start[cells[s] + 1];
  }
  for (let voxel: number = 0; voxel < total; voxel++) start[voxel + 1] += start[voxel];
  const order: Int32Array = new Int32Array(taken);
  const fill: Int32Array = start.slice(0, total);
  for (let s: number = 0; s < taken; s++) order[fill[cells[s]]++] = s;
  const field: ReturnType<typeof measureHumanBodyDistanceField> = measureHumanBodyDistanceField({
    dimensions,
    sites: occupied,
    nearest: true,
  });
  const distance: IHumanBodySkinVoxelDistance = { squared: field.squared, source: field.source! };

  const centre: (voxel: number) => number[] = (voxel: number): number[] => [
    origin[0] + (voxel % nx) * cell,
    origin[1] + (Math.floor(voxel / nx) % ny) * cell,
    origin[2] + Math.floor(voxel / (nx * ny)) * cell,
  ];
  // the sample nearest to `at` among those of `voxel` and its neighbours, or
  // -1 where they hold none; a neighbour past the grid's edge clamps onto the
  // voxel itself
  const sampleNear: (voxel: number, at: readonly number[]) => number = (voxel: number, at: readonly number[]): number => {
    const i: number = voxel % nx;
    const j: number = Math.floor(voxel / nx) % ny;
    const k: number = Math.floor(voxel / (nx * ny));
    let best: number = Infinity;
    let sample: number = -1;
    for (let dk: number = -1; dk <= 1; dk++)
      for (let dj: number = -1; dj <= 1; dj++)
        for (let di: number = -1; di <= 1; di++) {
          const neighbour: number =
            Math.min(nx - 1, Math.max(0, i + di)) +
            nx *
              (Math.min(ny - 1, Math.max(0, j + dj)) +
                ny * Math.min(nz - 1, Math.max(0, k + dk)));
          for (let s: number = start[neighbour]; s < start[neighbour + 1]; s++) {
            const base: number = order[s] * 3;
            const gap: number =
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
    voxelOf: (at: readonly number[]): number => {
      const ijk: number[] = at.map((value: number, k: number): number =>
        Math.min(
          dimensions[k] - 1,
          Math.max(0, Math.round((value - origin[k]) / cell)),
        ),
      );
      return ijk[0] + nx * (ijk[1] + ny * ijk[2]);
    },
    nearest: (voxel: number, at: readonly number[]): number[] => {
      const s: number = sampleNear(voxel, at);
      return s < 0
        ? at.slice()
        : [positions[s * 3], positions[s * 3 + 1], positions[s * 3 + 2]];
    },
    clearance: (at: readonly number[]): number => nearest(at)?.distance ?? Infinity,
    centres: (rho: number): Uint8Array => {
      const clear: number = ((rho - cell) / cell) ** 2;
      const shell: number = ((rho + 2 * cell) / cell) ** 2;
      const result: Uint8Array = new Uint8Array(total);
      for (let voxel: number = 0; voxel < total; voxel++) {
        const squared: number = distance.squared[voxel];
        if (squared < clear || squared >= shell) continue;
        const hit: ReturnType<typeof nearest> = nearest(centre(voxel));
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
const MOST_VOXELS: number = 16_000_000;

/** `values` copied into an array of `capacity` records of `width` numbers. */
function grow<T extends Int32Array | Float32Array | Float64Array>(
  values: T,
  capacity: number,
  width: number,
): T {
  const larger: T = new (values.constructor as new (length: number) => T)(
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
  for (let t: number = 0; t < indices.length; t += 3) {
    let reaches: boolean = true;
    for (let axis: number = 0; axis < 3; axis++) {
      const low: number = origin[axis];
      const high: number = low + (dimensions[axis] - 1) * cell;
      const x: number = positions[indices[t] * 3 + axis];
      const y: number = positions[indices[t + 1] * 3 + axis];
      const z: number = positions[indices[t + 2] * 3 + axis];
      if ((x < low && y < low && z < low) || (x > high && y > high && z > high))
        reaches = false;
    }
    if (reaches) reaching.push(t);
  }
  return reaching;
}
