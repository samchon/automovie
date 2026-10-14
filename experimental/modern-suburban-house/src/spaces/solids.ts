
import {
  buildAutoMoviePolyhedron,
  extrudeAutoMovieRegion,
  tessellateToMesh,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import type { IPlanPoint } from "../types/IPlanPoint";
import type { IWallFace } from "../types/IWallFace";
import type { IWallHole } from "../types/IWallHole";
import type { IWallPoint } from "../types/IWallPoint";
import type { IWallSolid } from "../types/IWallSolid";

/**
 * Axis-aligned box between two world corners.
 */
export const block = (
  min: readonly [number, number, number],
  max: readonly [number, number, number],
): IAutoMovieMesh => {
  const [width, height, depth] = [
    max[0] - min[0],
    max[1] - min[1],
    max[2] - min[2],
  ];
  if (!(width > 0 && height > 0 && depth > 0))
    throw new Error(
      `block needs positive extents, got ${width} × ${height} × ${depth}`,
    );
  return transformAutoMovieMesh(
    tessellateToMesh({ type: "box", width, height, depth }),
    {
      translation: {
        x: (min[0] + max[0]) / 2,
        y: (min[1] + max[1]) / 2,
        z: (min[2] + max[2]) / 2,
      },
    },
  );
};

/** Quarter turn about world Y: local +X becomes world +Z, local +Z becomes world -X. */
const TO_Z_AXIS = { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
/** Quarter turn about world X: local +Y becomes world +Z, local +Z becomes world -Y. */
const TO_PLAN = { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };


export const wallPanel = (props: {
  axis: "x" | "z";
  across: readonly [number, number];
  outline: readonly IWallPoint[];
  holes?: readonly IWallHole[];
}): IWallSolid => {
  const depth = props.across[1] - props.across[0];
  const center = (props.across[0] + props.across[1]) / 2;
  const outer = props.outline.map((p) => ({ x: p.u, y: p.y }));
  const holes = (props.holes ?? []).map((h) => [
    { x: h.from, y: h.bottom },
    { x: h.to, y: h.bottom },
    { x: h.to, y: h.top },
    { x: h.from, y: h.top },
  ]);
  const local = extrudeAutoMovieRegion({ outer, holes, depth });
  const face: IWallFace = {
    axis: props.axis,
    across: props.across,
    outline: props.outline,
    holes: props.holes ?? [],
  };
  // Along X the region already lies in world X/Y; only its depth moves to Z.
  if (props.axis === "x") return {
    mesh: transformAutoMovieMesh(local, {
      translation: { x: 0, y: 0, z: center },
    }),
    face,
  };
  // Along Z: local X turns into world +Z and the depth axis into world -X.
  return {
    mesh: transformAutoMovieMesh(local, {
      rotation: TO_Z_AXIS,
      translation: { x: center, y: 0, z: 0 },
    }),
    face,
  };
};

/**
 * A straight wall panel between two heights: the common rectangular case.
 *
 * A void whose bottom reaches the panel bottom (a door in a partition that
 * stands on the finished floor) cannot be a hole: it is cut as a notch of the
 * outline, so the panel stays one closed body on each side of the door. A void
 * that leaves the panel's length range or sits below its bottom is refused.
 */
export const straightWall = (props: {
  axis: "x" | "z";
  across: readonly [number, number];
  along: readonly [number, number];
  bottom: number;
  top: number;
  holes?: readonly IWallHole[];
}): IWallSolid => {
  const eps = 1e-9;
  const holes = props.holes ?? [];
  for (const h of holes)
    if (h.from <= props.along[0] + eps || h.to >= props.along[1] - eps || h.bottom < props.bottom - eps || h.top >= props.top - eps)
      throw new Error(
        `void "${h.id}" [${h.from}, ${h.to}] × [${h.bottom}, ${h.top}] leaves wall [${props.along[0]}, ${props.along[1]}] × [${props.bottom}, ${props.top}]`,
      );
  const notches = holes.filter((h) => h.bottom <= props.bottom + eps).sort(
    (x, y) => x.from - y.from,
  );
  const outline: IWallPoint[] = [{ u: props.along[0], y: props.bottom }];
  for (const n of notches)
    outline.push(
      { u: n.from, y: props.bottom },
      { u: n.from, y: n.top },
      { u: n.to, y: n.top },
      { u: n.to, y: props.bottom },
    );
  outline.push(
    { u: props.along[1], y: props.bottom },
    { u: props.along[1], y: props.top },
    { u: props.along[0], y: props.top },
  );
  const solid = wallPanel({
    axis: props.axis,
    across: props.across,
    outline,
    holes: holes.filter((h) => h.bottom > props.bottom + eps),
  });
  // The face is the full rectangle with every void, notches included.
  return {
    mesh: solid.mesh,
    face: {
      axis: props.axis,
      across: props.across,
      outline: [
        { u: props.along[0], y: props.bottom },
        { u: props.along[1], y: props.bottom },
        { u: props.along[1], y: props.top },
        { u: props.along[0], y: props.top },
      ],
      holes,
    },
  };
};

/**
 * A horizontal slab: a plan polygon with optional plan holes between two heights.
 */
export const slab = (props: {
  outline: readonly IPlanPoint[];
  holes?: readonly (readonly IPlanPoint[])[];
  bottom: number;
  top: number;
}): IAutoMovieMesh => {
  // Local (x, y) = world (x, z); after the quarter turn local +Z points to
  // world -Y, so the centred extrusion is moved to the slab's mid height.
  const local = extrudeAutoMovieRegion({
    outer: props.outline.map((p) => ({ x: p.x, y: p.z })),
    holes: (props.holes ?? []).map((ring) =>
      ring.map((p) => ({ x: p.x, y: p.z })),
    ),
    depth: props.top - props.bottom,
  });
  return transformAutoMovieMesh(local, {
    rotation: TO_PLAN,
    translation: { x: 0, y: (props.bottom + props.top) / 2, z: 0 },
  });
};

/**
 * Plan rectangle helper for caller-supplied X and Z extents.
 */
export const rect = (x: readonly [number, number], z: readonly [number, number]): IPlanPoint[] => [
  { x: x[0], z: z[0] },
  { x: x[1], z: z[0] },
  { x: x[1], z: z[1] },
  { x: x[0], z: z[1] },
];

const sub = (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
const cross = (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});


export const slopedSlab = (props: {
  plan: readonly IPlanPoint[];
  top: (x: number, z: number) => number;
  /** Constant vertical thickness under the top; ignored when `floor` is given. */
  thickness?: number;
  /** An underside instead: a level (a beam packer) or a planar height function (a wall-head wedge). */
  floor?: number | ((x: number, z: number) => number);
  /** Free outline edges alone receive visible vertical thickness. */
  freeEdge?: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean;
}): IAutoMovieMesh => {
  if (props.plan.length < 3) throw new Error(
    "sloped slab needs at least three plan corners",
  );
  if (props.floor === undefined && !(props.thickness! > 0)) throw new Error(
    "sloped slab needs a positive thickness or a floor",
  );
  const up = props.plan.map((p) => ({
    x: p.x,
    y: props.top(p.x, p.z),
    z: p.z,
  }));
  const normal = cross(sub(up[1]!, up[0]!), sub(up[2]!, up[0]!));
  const top = normal.y > 0 ? up : [...up].reverse();
  const floor = props.floor;
  const bottom = top.map((p) => ({
    x: p.x,
    y: floor === undefined
      ? p.y - props.thickness!
      : typeof floor === "number"
        ? floor
        : floor(p.x, p.z),
    z: p.z,
  }));
  const faces: IAutoMovieVector3[][] = [top, [...bottom].reverse()];
  const same = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9 && Math.abs(a.z - b.z) < 1e-9;
  for (let i = 0; i < top.length; ++i) {
    const j = (i + 1) % top.length;
    if (props.freeEdge !== undefined && !props.freeEdge(top[i]!, top[j]!)) continue;
    // A wedge meets its floor along an edge: drop the coincident corners so the
    // side under that edge is a triangle, and skip a side with no height at all.
    const side = [top[i]!, bottom[i]!, bottom[j]!, top[j]!].filter(
      (p, k, all) => !same(p, all[(k + all.length - 1) % all.length]!),
    );
    if (side.length >= 3) faces.push(side);
  }
  return buildAutoMoviePolyhedron(faces);
};

/**
 * One pitched roof part with a concave plan decomposed only on its weather
 * and underside faces. The caller supplies convex coplanar tiles and a free
 * outline predicate; shared tile seams receive no vertical face.
 */
export const slopedPlate = (props: {
  plans: readonly (readonly IPlanPoint[])[];
  top: (x: number, z: number) => number;
  thickness: number;
  freeEdge: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean;
}): IAutoMovieMesh => {
  if (props.plans.length === 0 || !(props.thickness > 0)) throw new Error(
    "sloped plate needs tiles and positive thickness",
  );
  const faces: IAutoMovieVector3[][] = [];
  for (const plan of props.plans) {
    if (plan.length < 3) throw new Error(
      "sloped plate tile needs three corners",
    );
    const up = plan.map((p) => ({ x: p.x, y: props.top(p.x, p.z), z: p.z }));
    const normal = cross(sub(up[1]!, up[0]!), sub(up[2]!, up[0]!));
    const top = normal.y > 0 ? up : [...up].reverse();
    const bottom = top.map((p) => ({
      x: p.x,
      y: p.y - props.thickness,
      z: p.z,
    }));
    faces.push(top, [...bottom].reverse());
    for (let i = 0; i < top.length; i++) {
      const j = (i + 1) % top.length;
      if (props.freeEdge(top[i]!, top[j]!)) faces.push([top[i]!, bottom[i]!, bottom[j]!, top[j]!]);
    }
  }
  return buildAutoMoviePolyhedron(faces);
};

/**
 * A straight bar of square section between two world points, for rails and
 * sloped handrails. Its four long faces follow the bar direction; the section
 * is `size` wide and stays level across the bar.
 */
export const bar = (from: IAutoMovieVector3, to: IAutoMovieVector3, size: number): IAutoMovieMesh => {
  const dir = sub(to, from);
  const horizontal = Math.hypot(dir.x, dir.z);
  if (horizontal === 0) return block(
    [from.x - size / 2, Math.min(from.y, to.y), from.z - size / 2],
    [from.x + size / 2, Math.max(from.y, to.y), from.z + size / 2],
  );
  const side = {
    x: (-dir.z / horizontal) * (size / 2),
    y: 0,
    z: (dir.x / horizontal) * (size / 2),
  };
  const lift = { x: 0, y: size / 2, z: 0 };
  const corner = (p: IAutoMovieVector3, s: number, l: number): IAutoMovieVector3 => ({
    x: p.x + side.x * s + lift.x * l,
    y: p.y + side.y * s + lift.y * l,
    z: p.z + side.z * s + lift.z * l,
  });
  const a = [
    corner(from, -1, -1),
    corner(from, 1, -1),
    corner(from, 1, 1),
    corner(from, -1, 1),
  ];
  const b = [
    corner(to, -1, -1),
    corner(to, 1, -1),
    corner(to, 1, 1),
    corner(to, -1, 1),
  ];
  const faces: IAutoMovieVector3[][] = [
    [a[0]!, a[3]!, a[2]!, a[1]!],
    [b[0]!, b[1]!, b[2]!, b[3]!],
  ];
  for (let i = 0; i < 4; ++i) {
    const j = (i + 1) % 4;
    faces.push([a[i]!, a[j]!, b[j]!, b[i]!]);
  }
  // Keep every face outward: a face whose normal points toward the bar axis is reversed.
  const mid = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
    z: (from.z + to.z) / 2,
  };
  return buildAutoMoviePolyhedron(
    faces.map((f) => {
      const n = cross(sub(f[1]!, f[0]!), sub(f[2]!, f[0]!));
      const c = f.reduce(
        (s, p) => ({
          x: s.x + p.x / f.length,
          y: s.y + p.y / f.length,
          z: s.z + p.z / f.length,
        }),
        { x: 0, y: 0, z: 0 },
      );
      const out = sub(c, mid);
      return n.x * out.x + n.y * out.y + n.z * out.z >= 0 ? f : [...f].reverse();
    }),
  );
};
