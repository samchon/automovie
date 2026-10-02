import { voxelizeHumanBodySkin } from "@automovie/human";

/** An indexed triangle mesh in metres, counter-clockwise seen from outside. */
export interface ISkinVoxelSolid {
  positions: number[];
  indices: number[];
}

/**
 * Closed convex solids with an analytic inside test, for the sign of the
 * skin's voxels. Every solid is wound outward, and `isInsideConvexSolid` is
 * the independent oracle: a point of a convex solid is behind the plane of
 * every face, which uses no normal, distance transform or sample of the
 * voxeliser it judges.
 *
 * - The tetrahedron has a flat +Z face (x, y from -0.04 to 0.04 at z = 0) and
 *   its fourth corner 0.04 below it, so its edges are acute and the faces on
 *   either side of an edge tilt away from a point above it.
 * - The cube has half side `half`, centred on the origin.
 */
export const createVoxelTetrahedron = (): ISkinVoxelSolid => ({
  positions: [-0.04, -0.04, 0, 0.04, -0.04, 0, 0, 0.04, 0, 0, 0, -0.04],
  indices: [0, 1, 2, 0, 3, 1, 1, 3, 2, 2, 3, 0],
});

export const createVoxelCube = (half = 0.04): ISkinVoxelSolid => ({
  positions: [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ].flatMap((corner) => corner.map((value) => value * half)),
  indices: [
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 6, 2, 3, 7, 6, 0,
    4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5,
  ],
});

/** The same solid wound the other way, so every face points inward. */
export const reverseVoxelSolid = (solid: ISkinVoxelSolid): ISkinVoxelSolid => ({
  positions: solid.positions,
  indices: solid.indices.map((_, at) => {
    const first = at - (at % 3);
    return solid.indices[first + [0, 2, 1][at % 3]];
  }),
});

/** The solid turned by the unit quaternion proportional to `(x, y, z, w)`. */
export const rotateVoxelSolid = (
  solid: ISkinVoxelSolid,
  quaternion: readonly [number, number, number, number],
): ISkinVoxelSolid => {
  const length = Math.hypot(...quaternion);
  const [x, y, z, w] = quaternion.map((value) => value / length);
  const rows = [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
  const positions: number[] = [];
  for (let at = 0; at < solid.positions.length; at += 3)
    for (const row of rows)
      positions.push(
        row[0] * solid.positions[at] +
          row[1] * solid.positions[at + 1] +
          row[2] * solid.positions[at + 2],
      );
  return { positions, indices: solid.indices };
};

/** Whether `at` is on or behind the plane of every face of a convex solid. */
export const isInsideConvexSolid = (
  solid: ISkinVoxelSolid,
  at: readonly number[],
): boolean => {
  for (let t = 0; t < solid.indices.length; t += 3) {
    const [a, b, c] = [0, 1, 2].map((k) =>
      solid.positions.slice(solid.indices[t + k] * 3).slice(0, 3),
    );
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const normal = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    if (
      normal[0] * (at[0] - a[0]) +
        normal[1] * (at[1] - a[1]) +
        normal[2] * (at[2] - a[2]) >
      0
    )
      return false;
  }
  return true;
};

/**
 * Judge every voxel of a ball's centre shell against an independent inside
 * test. A voxel is in the shell when the grid's own distance to the skin is
 * within a cell less than `rho` and two cells beyond it. The result counts the
 * shell voxels, those `air` calls air and flesh, those of the first kind that the
 * skin declines, and those of the second kind that it
 * admits.
 */
export const censusSkinVoxelSigns = (props: {
  skin: ISkinVoxelSolid[];
  points: number[];
  rho: number;
  cell: number;
  air: (at: readonly number[]) => boolean;
}): {
  shell: number;
  air: number;
  flesh: number;
  airRefused: number;
  fleshAdmitted: number;
} => {
  const { rho, cell } = props;
  const voxels = voxelizeHumanBodySkin({
    skin: props.skin,
    points: props.points,
    pad: rho + 2 * cell,
    cell,
  });
  const centres = voxels.centres(rho);
  const census = { shell: 0, air: 0, flesh: 0, airRefused: 0, fleshAdmitted: 0 };
  for (let voxel = 0; voxel < centres.length; voxel++) {
    const squared = voxels.distance.squared[voxel];
    if (squared < ((rho - cell) / cell) ** 2) continue;
    if (squared >= ((rho + 2 * cell) / cell) ** 2) continue;
    ++census.shell;
    const air = props.air(voxels.centre(voxel));
    ++census[air ? "air" : "flesh"];
    if (air && centres[voxel] === 0) ++census.airRefused;
    if (!air && centres[voxel] === 1) ++census.fleshAdmitted;
  }
  return census;
};
