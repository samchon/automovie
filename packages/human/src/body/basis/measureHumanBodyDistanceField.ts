/**
 * The exact Euclidean distance from every voxel of a regular grid to the
 * nearest site voxel, with the nearest site's index when the caller asks for
 * it.
 *
 * The transform is the separable one of Felzenszwalb and Huttenlocher (2012,
 * "Distance transforms of sampled functions", Theory of Computing 8): the
 * squared distance to a set of sites is `min over sites of (x - s)^2` summed
 * over the axes, so the lower envelope of parabolas along one axis, taken axis
 * by axis, gives the exact squared distance between voxel centres in time
 * linear in the voxel count. The result is measured in voxels, between voxel
 * centres; the grid's spacing and origin belong to the caller. When
 * `nearest` is requested each parabola also carries the index of the site it
 * came from through the three passes, so a voxel reads the site that attains
 * its distance (one of them when several tie).
 *
 * `sites` is one byte per voxel, `x` fastest and `z` slowest, nonzero at a
 * site. With no site at all every distance is `1e20`, a finite stand-in for
 * infinity that keeps the parabola intersections defined, and every source is
 * `-1`.
 */
export function measureHumanBodyDistanceField(props: {
  dimensions: readonly [number, number, number];
  sites: Uint8Array;
  nearest: boolean;
}): { squared: Float64Array; source: Int32Array | null } {
  const [nx, ny, nz] = props.dimensions;
  const count = nx * ny * nz;
  const squared = new Float64Array(count);
  const source = props.nearest ? new Int32Array(count) : null;
  for (let i = 0; i < count; i++) {
    const site = props.sites[i] !== 0;
    squared[i] = site ? 0 : FAR;
    if (source !== null) source[i] = site ? i : -1;
  }
  const longest = Math.max(nx, ny, nz);
  const scratch = {
    value: new Float64Array(longest),
    origin: new Int32Array(longest),
    root: new Int32Array(longest),
    edge: new Float64Array(longest + 1),
  };
  // one pass per axis: x has stride 1, y has stride nx, z has stride nx * ny
  for (let z = 0; z < nz; z++)
    for (let y = 0; y < ny; y++)
      line(squared, source, scratch, (z * ny + y) * nx, 1, nx);
  for (let z = 0; z < nz; z++)
    for (let x = 0; x < nx; x++)
      line(squared, source, scratch, z * nx * ny + x, nx, ny);
  for (let y = 0; y < ny; y++)
    for (let x = 0; x < nx; x++)
      line(squared, source, scratch, y * nx + x, nx * ny, nz);
  return { squared, source };
}

/** A finite stand-in for an infinite squared distance. */
const FAR = 1e20;

interface IScratch {
  value: Float64Array;
  origin: Int32Array;
  root: Int32Array;
  edge: Float64Array;
}

/**
 * Replace one line of squared distances by the lower envelope of the parabolas
 * rooted at its samples, `count` voxels from `start` in steps of `stride`.
 */
function line(
  squared: Float64Array,
  source: Int32Array | null,
  scratch: IScratch,
  start: number,
  stride: number,
  count: number,
): void {
  const { value, origin, root, edge } = scratch;
  for (let q = 0; q < count; q++) {
    value[q] = squared[start + q * stride];
    if (source !== null) origin[q] = source[start + q * stride];
  }
  let k = 0;
  root[0] = 0;
  edge[0] = -FAR;
  edge[1] = FAR;
  for (let q = 1; q < count; q++) {
    let cross: number;
    for (;;) {
      const r = root[k];
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
  for (let q = 0; q < count; q++) {
    while (edge[k + 1] < q) ++k;
    const r = root[k];
    squared[start + q * stride] = (q - r) * (q - r) + value[r];
    if (source !== null) source[start + q * stride] = origin[r];
  }
}
