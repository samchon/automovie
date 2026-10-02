import type { IAutoMovieHumanBodySkinVoxels } from "../structures/IAutoMovieHumanBodySkinVoxels";
import { measureHumanBodyDistanceField } from "./measureHumanBodyDistanceField";

/**
 * Voxelise the posed skin around a set of points, for the closing of a
 * garment's creases.
 *
 * The grid covers the points padded by `pad`, in cubic cells of `cell`. Every
 * skin triangle that reaches it is sampled at a barycentric spacing of at most
 * three quarters of a cell along its longest edge, and each sample falls in the
 * voxel nearest to it. Each sample keeps its position and its sign normal: the
 * pseudo-normal of the feature it lies on, which is the face normal inside a
 * face, the sum of the unit face normals of the faces that share an edge and
 * the angle-weighted vertex normal at a vertex (Baerentzen and Aanaes 2005,
 * "Signed distance computation using the angle weighted pseudonormal", IEEE
 * TVCG 11(3)). A feature is the same feature whichever vertex indices name it,
 * so corners at one position (a material or UV seam duplicates them) are
 * welded by their exact coordinates, and an edge is open only where one
 * triangle has it. The exact distance transform of the occupied voxels
 * (`measureHumanBodyDistanceField`) is the distance from each voxel to the
 * skin, to within the cell.
 *
 * A voxel is air or flesh by the sign of the offset from the skin sample
 * nearest to its centre against that sample's pseudo-normal, which is the
 * Baerentzen and Aanaes test applied to the sampled surface. The test needs no
 * neighbouring faces: a pseudo-normal is valid on its own feature, so it holds
 * on both sides of a wedge edge or a crease floor, where a sum over the normals
 * of several features reads a point above a convex edge against the faces that
 * point away from it.
 *
 * The skin is read in metres of its own frame and with counter-clockwise
 * triangles seen from outside; samples beyond the grid are dropped, so the
 * skin is unbounded and only the part near the points counts. A grid of more
 * than sixteen million voxels is refused. Nothing here is a cloth or a
 * collision model: the queries answer about the skin as posed and nothing
 * else.
 *
 * @evidence contracts/common.md#principled-implementation Sampling each triangle finer than the cell and reading the exact distance transform of the occupied voxels bounds the distance to the skin by the cell, and the pseudo-normal of the nearest feature is the standard sign for a point of a consistently wound closed surface (Baerentzen and Aanaes 2005). Two features within the sample spacing of equal distance (the medial axis of a sheet thinner than a cell) can swap which one is nearest, so the sign there is ambiguous; an open boundary carries only the single face normal, which gives the reach of the sheet and no more. A grid of the size of a garment's neighbourhood does not resolve features under a cell.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: turn the skin near a set of points into a distance grid and the four queries its consumer needs. The ball, the closing and the garment stay with the consumer, and the distance transform stays with its own owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No garment, landmark or vertex is named; the same grid answers for any skin and points, and the sign comes from the mesh's pseudo-normals and not from a case of the body.
 * @evidence contracts/common.md#meaningful-documentation The comment states the grid, the sampling, what each sample keeps and why, how a voxel is read as air or flesh, the frame and winding assumed, and what a query answers, on the declaration and on the returned structure.
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
    const reaching = trianglesReaching(
      corner,
      indices,
      origin,
      dimensions,
      cell,
    );
    const pseudo = pseudoNormals(corner, indices, reaching);
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
            [indices[t], indices[t + 1], indices[t + 2]],
            [steps - i - j, i, j],
            unit,
          );
          for (let k = 0; k < 3; k++) normals[taken * 3 + k] = normal[k];
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
  const distance = { squared: field.squared, source: field.source! };

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
    centres: (rho) => {
      const clear = ((rho - cell) / cell) ** 2;
      const shell = ((rho + 2 * cell) / cell) ** 2;
      const result = new Uint8Array(total);
      for (let voxel = 0; voxel < total; voxel++) {
        const squared = distance.squared[voxel];
        if (squared < clear || squared >= shell) continue;
        // air where the voxel lies on the side the nearest sample's
        // pseudo-normal points to
        const at = centre(voxel);
        const s = sampleNear(distance.source[voxel], at) * 3;
        const side =
          (at[0] - positions[s]) * normals[s] +
          (at[1] - positions[s + 1]) * normals[s + 1] +
          (at[2] - positions[s + 2]) * normals[s + 2];
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
  /** The first vertex index at each vertex's exact position. */
  weld: Int32Array;

  /** Angle-weighted vertex pseudo-normals by welded vertex, three numbers each. */
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
 * Corners at one exact position are one vertex, so an edge between two
 * triangles that name its ends by different indices (a UV or material seam) is
 * shared, and a triangle without area adds nothing.
 */
function pseudoNormals(
  positions: readonly number[],
  indices: readonly number[],
  triangles: readonly number[],
): IPseudoNormals {
  const count = positions.length / 3;
  const weld = new Int32Array(count).fill(-1);
  const first = new Map<string, number>();
  for (const t of triangles)
    for (let k = 0; k < 3; k++) {
      const v = indices[t + k];
      if (weld[v] >= 0) continue;
      const key = positions.slice(v * 3, v * 3 + 3).join(",");
      weld[v] = first.get(key) ?? v;
      first.set(key, weld[v]);
    }
  const vertex = new Float64Array(positions.length);
  const edge = new Map<number, number[]>();
  const face = new Map<number, number[]>();
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
      const key = edgeKey(
        weld[indices[t + k]],
        weld[indices[t + ((k + 1) % 3)]],
        count,
      );
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
      const at = weld[indices[t + k]] * 3;
      vertex[at] += angle * unit[0];
      vertex[at + 1] += angle * unit[1];
      vertex[at + 2] += angle * unit[2];
    }
  }
  return { weld, vertex, edge, face };
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
  corners: readonly [number, number, number],
  weights: readonly [number, number, number],
  face: readonly number[],
): readonly number[] {
  const present = [0, 1, 2].filter((k) => weights[k] !== 0);
  if (present.length === 1) {
    const at = pseudo.weld[corners[present[0]]] * 3;
    return [pseudo.vertex[at], pseudo.vertex[at + 1], pseudo.vertex[at + 2]];
  }
  if (present.length === 2)
    return pseudo.edge.get(
      edgeKey(
        pseudo.weld[corners[present[0]]],
        pseudo.weld[corners[present[1]]],
        pseudo.weld.length,
      ),
    )!;
  return face;
}
