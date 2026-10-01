import type { IAutoMovieHumanBodySkinVoxels } from "../structures/IAutoMovieHumanBodySkinVoxels";
import { measureHumanBodyDistanceField } from "./measureHumanBodyDistanceField";

/**
 * Voxelise the posed skin around a set of points, for the closing of a
 * garment's creases.
 *
 * The grid covers the points padded by `pad`, in cubic cells of `cell`. Every
 * skin triangle that reaches it is sampled at a barycentric spacing of at most
 * `cell / 2`, and each sample falls in the voxel nearest to it. Each occupied
 * voxel keeps the mean of its samples' positions and the mean of their sign
 * normals: the pseudo-normal of the feature the sample lies on, which is the
 * face normal inside a face, the sum of the two unit face normals on an edge
 * and the angle-weighted vertex normal at a vertex (Baerentzen and Aanaes 2005,
 * "Signed distance computation using the angle weighted pseudonormal", IEEE
 * TVCG 11(3)). A pseudo-normal is valid only on its own feature, so a sample
 * inside a face is never blended with the normals at the face's corners, which
 * tilt it away from the face it lies on. The pseudo-normal is what tells the
 * air from the flesh on a concave feature, where the normal of one adjoining
 * face reads a point behind a crease's floor as in front of its wall. The exact
 * distance transform of the
 * occupied voxels (`measureHumanBodyDistanceField`) is the distance from each
 * voxel to the skin, to within the cell.
 *
 * The skin is read in metres of its own frame and with counter-clockwise
 * triangles seen from outside; samples beyond the grid are dropped, so the
 * skin is unbounded and only the part near the points counts. A grid of more
 * than sixteen million voxels is refused. Nothing here is a cloth or a
 * collision model: the queries answer about the skin as posed and nothing
 * else.
 *
 * @evidence contracts/common.md#principled-implementation Sampling each triangle finer than the cell and reading the exact distance transform of the occupied voxels bounds the distance to the skin by the cell, and the angle-weighted pseudo-normal is the standard sign for a point nearest a vertex or an edge of a consistently wound closed surface (Baerentzen and Aanaes 2005). Voxel means keep a query constant time; on the medial axis of a sheet thinner than the cell the sign is ambiguous, and a grid of the size of a garment's neighbourhood does not resolve features under a cell.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: turn the skin near a set of points into a distance grid and the four queries its consumer needs. The ball, the closing and the garment stay with the consumer, and the distance transform stays with its own owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No garment, landmark or vertex is named; the same grid answers for any skin and points, and the sign comes from the mesh's pseudo-normals and not from a case of the body.
 * @evidence contracts/common.md#meaningful-documentation The comment states the grid, the sampling, what each occupied voxel keeps and why, the frame and winding assumed, and what a query answers, on the declaration and on the returned structure.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function is a grid operation and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry, only the grid its consumer sized.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; it reads the skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint a viewer displays; its consumer answers that chapter.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through this function.
 */
export function voxelizeHumanBodySkin(props: {
  skin: readonly {
    positions: readonly number[];
    indices: readonly number[];
  }[];
  points: readonly number[];
  pad: number;
  cell: number;
}): IAutoMovieHumanBodySkinVoxels {
  const { skin, points, pad, cell } = props;
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
  let normals = new Float32Array(capacity * 3);
  let taken = 0;
  for (const { positions: corner, indices } of skin) {
    // only the triangles that reach the grid: a vertex at its edge sums the
    // pseudo-normal over the triangles it has there, which no sample near it
    // depends on
    const reaching = trianglesReaching(corner, indices, origin, dimensions, cell);
    const pseudo = pseudoNormals(corner, indices, reaching);
    const vertices = corner.length / 3;
    for (const t of reaching) {
      const a = indices[t] * 3;
      const b = indices[t + 1] * 3;
      const c = indices[t + 2] * 3;
      const e1 =[corner[b] - corner[a], corner[b + 1] - corner[a + 1], corner[b + 2] - corner[a + 2]];
      const e2 = [corner[c] - corner[a], corner[c + 1] - corner[a + 1], corner[c + 2] - corner[a + 2]];
      const unit = pseudo.face.get(t);
      if (unit === undefined) continue;
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
            normals = grow(normals, capacity, 3);
          }
          cells[taken] = ix + nx * (iy + ny * iz);
          positions[taken * 3] = px;
          positions[taken * 3 + 1] = py;
          positions[taken * 3 + 2] = pz;
          const normal = featureNormal(
            pseudo,
            vertices,
            [indices[t], indices[t + 1], indices[t + 2]],
            [steps - i - j, i, j],
            unit,
          );
          for (let k = 0; k < 3; k++) normals[taken * 3 + k] = normal[k];
          ++taken;
        }
    }
  }

  // bucket the samples by voxel and keep each occupied voxel's mean
  const occupied = new Uint8Array(total);
  const start = new Int32Array(total + 1);
  for (let s = 0; s < taken; s++) {
    occupied[cells[s]] = 1;
    ++start[cells[s] + 1];
  }
  for (let voxel = 0; voxel < total; voxel++) start[voxel + 1] += start[voxel];
  const order = new Int32Array(taken);
  const fill = start.slice(0, total);
  const mean = new Float32Array(total * 6);
  for (let s = 0; s < taken; s++) {
    const voxel = cells[s];
    order[fill[voxel]++] = s;
    for (let k = 0; k < 3; k++) {
      mean[voxel * 6 + k] += positions[s * 3 + k];
      mean[voxel * 6 + 3 + k] += normals[s * 3 + k];
    }
  }
  for (let voxel = 0; voxel < total; voxel++) {
    const used = start[voxel + 1] - start[voxel];
    if (used === 0) continue;
    const length =
      Math.hypot(mean[voxel * 6 + 3], mean[voxel * 6 + 4], mean[voxel * 6 + 5]) ||
      1;
    for (let k = 0; k < 3; k++) {
      mean[voxel * 6 + k] /= used;
      mean[voxel * 6 + 3 + k] /= length;
    }
  }
  const field = measureHumanBodyDistanceField({
    dimensions,
    sites: occupied,
    nearest: true,
  });
  const distance = { squared: field.squared, source: field.source! };

  const centre = (voxel: number): number[] => [
    origin[0] + (voxel % nx) * cell,
    origin[1] + (Math.floor(voxel / nx) % ny) * cell,
    origin[2] + Math.floor(voxel / (nx * ny)) * cell,
  ];
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
      const i = voxel % nx;
      const j = Math.floor(voxel / nx) % ny;
      const k = Math.floor(voxel / (nx * ny));
      let best = Infinity;
      let position = at.slice();
      // a neighbour past the grid's edge clamps onto the voxel itself
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
                position = [positions[base], positions[base + 1], positions[base + 2]];
              }
            }
          }
      return position;
    },
    centres: (rho) => {
      const clear = ((rho - cell) / cell) ** 2;
      const shell = ((rho + 2 * cell) / cell) ** 2;
      const result = new Uint8Array(total);
      for (let voxel = 0; voxel < total; voxel++) {
        const squared = distance.squared[voxel];
        if (squared < clear || squared >= shell) continue;
        // a dipole sum of the occupied voxels around the nearest one, each
        // its sample count times the cosine of the vector to it against its mean
        // pseudo-normal over the squared distance: positive in the air, negative
        // in the flesh, and a point behind a crease's floor reads negative
        // whichever wall is nearest
        const at = centre(voxel);
        const near = distance.source[voxel];
        const ni = near % nx;
        const nj = Math.floor(near / nx) % ny;
        const nk = Math.floor(near / (nx * ny));
        let side = 0;
        for (let k = Math.max(0, nk - 2); k <= Math.min(nz - 1, nk + 2); k++)
          for (let j = Math.max(0, nj - 2); j <= Math.min(ny - 1, nj + 2); j++)
            for (let i = Math.max(0, ni - 2); i <= Math.min(nx - 1, ni + 2); i++) {
              const u = i + nx * (j + ny * k);
              const used = start[u + 1] - start[u];
              if (used === 0) continue;
              const dx = at[0] - mean[u * 6];
              const dy = at[1] - mean[u * 6 + 1];
              const dz = at[2] - mean[u * 6 + 2];
              const squared = dx * dx + dy * dy + dz * dz;
              side +=
                (used *
                  (dx * mean[u * 6 + 3] + dy * mean[u * 6 + 4] + dz * mean[u * 6 + 5])) /
                (squared * Math.sqrt(squared));
            }
        if (side > 0) result[voxel] = 1;
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

/** The sign normals of the triangles a mesh offers a grid, by feature. */
interface IPseudoNormals {
  /** Angle-weighted vertex pseudo-normals, three numbers per vertex. */
  vertex: Float64Array;

  /** Sum of the unit normals of the triangles that share an edge, by edge key. */
  edge: Map<number, number[]>;

  /** Unit face normal of the triangle at each offset into `indices`. */
  face: Map<number, number[]>;
}

/**
 * The pseudo-normals of the given triangles of a mesh, one per feature: the
 * unit normal of each face, the sum of the unit normals of the faces that share
 * an edge, and the angle-weighted sum at each vertex, which are exactly the
 * three that Baerentzen and Aanaes (2005) prove give the sign of a point whose
 * nearest surface point lies on that feature. A sample inside a face therefore
 * carries the face normal and is never tilted by the faces at its corners.
 */
function pseudoNormals(
  positions: readonly number[],
  indices: readonly number[],
  triangles: readonly number[],
): IPseudoNormals {
  const vertex = new Float64Array(positions.length);
  const edge = new Map<number, number[]>();
  const face = new Map<number, number[]>();
  const count = positions.length / 3;
  const p = new Float64Array(9);
  for (const t of triangles) {
    for (let k = 0; k < 3; k++)
      for (let axis = 0; axis < 3; axis++)
        p[k * 3 + axis] = positions[indices[t + k] * 3 + axis];
    const fx = (p[4] - p[1]) * (p[8] - p[2]) - (p[5] - p[2]) * (p[7] - p[1]);
    const fy = (p[5] - p[2]) * (p[6] - p[0]) - (p[3] - p[0]) * (p[8] - p[2]);
    const fz = (p[3] - p[0]) * (p[7] - p[1]) - (p[4] - p[1]) * (p[6] - p[0]);
    const size = Math.hypot(fx, fy, fz);
    if (size === 0) continue;
    const unit = [fx / size, fy / size, fz / size];
    face.set(t, unit);
    for (let k = 0; k < 3; k++) {
      const key = edgeKey(indices[t + k], indices[t + ((k + 1) % 3)], count);
      const sum = edge.get(key);
      if (sum === undefined) edge.set(key, unit.slice());
      else for (let axis = 0; axis < 3; axis++) sum[axis] += unit[axis];
      const n = ((k + 1) % 3) * 3;
      const m = ((k + 2) % 3) * 3;
      const o = k * 3;
      const ax = p[n] - p[o];
      const ay = p[n + 1] - p[o + 1];
      const az = p[n + 2] - p[o + 2];
      const bx = p[m] - p[o];
      const by = p[m + 1] - p[o + 1];
      const bz = p[m + 2] - p[o + 2];
      const cosine =
        (ax * bx + ay * by + az * bz) /
        (Math.hypot(ax, ay, az) * Math.hypot(bx, by, bz));
      const angle = Math.acos(Math.min(1, Math.max(-1, cosine)));
      const at = indices[t + k] * 3;
      vertex[at] += angle * unit[0];
      vertex[at + 1] += angle * unit[1];
      vertex[at + 2] += angle * unit[2];
    }
  }
  return { vertex, edge, face };
}

/** The key of the undirected edge between two vertices of a mesh of `count`. */
function edgeKey(first: number, second: number, count: number): number {
  return Math.min(first, second) * count + Math.max(first, second);
}

/**
 * The pseudo-normal of the feature a triangle sample lies on. The sample's
 * barycentric weights, in whole steps, are zero on the corners opposite its
 * feature: two zeros put it on a vertex, one on an edge, none inside the face.
 * Every edge of a triangle that has a face normal has an edge normal, so only
 * a triangle without area, which the caller skips, lacks one.
 */
function featureNormal(
  pseudo: IPseudoNormals,
  count: number,
  corners: readonly [number, number, number],
  weights: readonly [number, number, number],
  face: readonly number[],
): readonly number[] {
  const present = [0, 1, 2].filter((k) => weights[k] !== 0);
  if (present.length === 1) {
    const at = corners[present[0]] * 3;
    return [pseudo.vertex[at], pseudo.vertex[at + 1], pseudo.vertex[at + 2]];
  }
  if (present.length === 2)
    return pseudo.edge.get(
      edgeKey(corners[present[0]], corners[present[1]], count),
    )!;
  return face;
}
