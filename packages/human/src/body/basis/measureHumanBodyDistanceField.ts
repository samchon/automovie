/**
 * The squared Euclidean distance from every voxel of a regular grid to the nearest site voxel, with the nearest site's index when the caller asks for it.
 *
 * The transform is the separable one of Felzenszwalb and Huttenlocher (2012, "Distance transforms of sampled functions", https://theoryofcomputing.org/articles/v008a019/): the squared distance to a set of sites is `min over sites of (x - s)^2` summed over the axes, so the lower envelope of parabolas along one axis, taken axis by axis, gives the exact squared distance between voxel centres in time linear in the voxel count. The result is measured in squared voxel units, between voxel centres; the grid's spacing and origin belong to the caller. When `nearest` is requested each parabola also carries the index of the site it came from through the three passes, so a voxel reads the site that attains its distance (one of them when several tie).
 *
 * `sites` is one byte per voxel, `x` fastest and `z` slowest, nonzero at a site. With no site at all every distance is `1e20`, a finite stand-in for infinity that keeps the parabola intersections defined, and every source is `-1`.
 *
 * The owning skin voxelizer bounds its grid to sixteen million sites, preserving Int32 site identity and represented integer-distance magnitudes. Direct callers must supply positive integer dimensions, a matching site array and the same representable extent; this utility does not admit arbitrary grid sizes or measure continuous triangle clearance.
 *
 * @evidence contracts/common.md#principled-implementation Three separable lower-parabola-envelope passes compute squared lattice-centre distance and propagate the attaining site index through the same selected roots.
 * @evidence contracts/common.md#clear-and-simple-design One reusable longest-line scratch record serves all axis passes, keeping spacing/origin and continuous surface-distance ownership outside the lattice transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The finite 1e20 no-site sentinel and -1 identity remain explicit; bounded matching integer grids are caller premises, and voxel-centre distance never substitutes for actual triangle clearance.
 * @evidence contracts/common.md#meaningful-documentation The prose cites the transform, states squared voxel units, storage order, optional site identity, ties, no-site behavior and the owning grid extent.
 * @evidence contracts/performance.md#efficient-algorithms Each axis line's parabola stack pushes and removes roots linearly, so three passes cost O(N) for N voxels; result storage is O(N) and shared scratch uses O(max dimension).
 * @evidence contracts/performance.md#reuse-equivalent-work The same line routine and scratch buffers are reused for every row and axis, while optional nearest-site output avoids retaining a source result when not requested.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Squared distances and optional site indices transfer to the caller; longest-line scratch expires after synchronous return, without a persistent cache, handle or task.
 */
export function measureHumanBodyDistanceField(props: {
  dimensions: readonly [number, number, number];
  sites: Uint8Array;
  nearest: boolean;
}): { squared: Float64Array; source: Int32Array | null } {
  const [nx, ny, nz]: readonly [number, number, number] = props.dimensions;
  const count: number = nx * ny * nz;
  const squared: Float64Array = new Float64Array(count);
  const source: Int32Array | null = props.nearest ? new Int32Array(count) : null;
  let hasSite: boolean = false;
  for (let i: number = 0; i < count; i++) {
    const site: boolean = props.sites[i] !== 0;
    hasSite ||= site;
    squared[i] = site ? 0 : FAR;
    if (source !== null) source[i] = site ? i : -1;
  }
  if (!hasSite) return { squared, source };
  const longest: number = Math.max(nx, ny, nz);
  const scratch: IScratch = {
    value: new Float64Array(longest),
    origin: new Int32Array(longest),
    root: new Int32Array(longest),
    edge: new Float64Array(longest + 1),
  };
  // one pass per axis: x has stride 1, y has stride nx, z has stride nx * ny
  for (let z: number = 0; z < nz; z++)
    for (let y: number = 0; y < ny; y++)
      line(squared, source, scratch, (z * ny + y) * nx, 1, nx);
  for (let z: number = 0; z < nz; z++)
    for (let x: number = 0; x < nx; x++)
      line(squared, source, scratch, z * nx * ny + x, nx, ny);
  for (let y: number = 0; y < ny; y++)
    for (let x: number = 0; x < nx; x++)
      line(squared, source, scratch, y * nx + x, nx * ny, nz);
  return { squared, source };
}

/** A finite stand-in for an infinite squared distance. */
const FAR: number = 1e20;

interface IScratch {
  value: Float64Array;
  origin: Int32Array;
  root: Int32Array;
  edge: Float64Array;
}

/**
 * Replace one line of squared distances by the lower envelope of the parabolas rooted at its samples, `count` voxels from `start` in steps of `stride`.
 */
function line(
  squared: Float64Array,
  source: Int32Array | null,
  scratch: IScratch,
  start: number,
  stride: number,
  count: number,
): void {
  const { value, origin, root, edge }: IScratch = scratch;
  for (let q: number = 0; q < count; q++) {
    value[q] = squared[start + q * stride];
    if (source !== null) origin[q] = source[start + q * stride];
  }
  let k: number = 0;
  root[0] = 0;
  edge[0] = -FAR;
  edge[1] = FAR;
  for (let q: number = 1; q < count; q++) {
    let cross: number;
    for (;;) {
      const r: number = root[k];
      cross = (value[q] + q * q - (value[r] + r * r)) / (2 * q - 2 * r);
      if (cross > edge[k]) break;
      --k;
    }
    ++k;
    root[k] = q;
    edge[k] = cross;
    edge[k + 1] = FAR;
  }
  k = 0;
  for (let q: number = 0; q < count; q++) {
    while (edge[k + 1] < q) ++k;
    const r: number = root[k];
    squared[start + q * stride] = (q - r) * (q - r) + value[r];
    if (source !== null) source[start + q * stride] = origin[r];
  }
}
