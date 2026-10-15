import {
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSweep,
  type IAutoMovieSweepSection,
} from "@automovie/engine";
import { type IAutoMovieVector3 } from "@automovie/interface";

/** The same count at every tier. */
const fixed = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({ lowest: n, low: n, medium: n, high: n });

/** Columns of the two wide strips, a multiple of two so their middle is a sample. */
const STRIP: IAutoMovieSurfaceNetwork.ICounts = { lowest: 2, low: 4, medium: 8, high: 16 };

/** Half a wide strip's columns, from its middle to a flank strip. */
const HALF: IAutoMovieSurfaceNetwork.ICounts = { lowest: 1, low: 2, medium: 4, high: 8 };

/** Segments of the fork curve between the two fork tubes. */
const FORK: IAutoMovieSurfaceNetwork.ICounts = { lowest: 2, low: 2, medium: 2, high: 4 };

/** The flank strips and the side openings: two columns at every tier, so a side opening is a loop of eight. */
const SIDE: IAutoMovieSurfaceNetwork.ICounts = fixed(2);

/** Trunk bands along its spine: below the side openings, beside them, above them. */
const BANDS: Array<{ u: [number, number]; rows: IAutoMovieSurfaceNetwork.ICounts }> = [
  { u: [0, 0.66], rows: { lowest: 2, low: 4, medium: 8, high: 16 } },
  { u: [0.66, 0.86], rows: fixed(2) },
  { u: [0.86, 1], rows: { lowest: 1, low: 1, medium: 2, high: 4 } },
];

/** Trunk strips by `v`: the `+Z` face across the seam, the `+X` flank, the `-Z` face, the `-X` flank. */
const STRIPS: Array<{ name: string; v: [number, number]; columns: IAutoMovieSurfaceNetwork.ICounts }> = [
  { name: "front", v: [-0.17, 0.17], columns: STRIP },
  { name: "left", v: [0.17, 0.33], columns: SIDE },
  { name: "back", v: [0.33, 0.67], columns: STRIP },
  { name: "right", v: [0.67, 0.83], columns: SIDE },
];

/** A rounded section with half-axes toward `+x`, toward each side and toward `-x` of its plane, metres. */
const oval = (ahead: number, side: number, behind: number, exponent: number): IAutoMovieSweepSection => ({
  type: "superellipse",
  right: ahead,
  up: side,
  left: behind,
  down: side,
  exponents: [exponent, exponent, exponent, exponent],
});

const point = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

const edge = (
  sweep: string,
  from: [number, number],
  to: [number, number],
  segments: IAutoMovieSurfaceNetwork.ICounts,
): IAutoMovieSurfaceNetwork.ISweepEdge => ({
  type: "sweep",
  sweep,
  from: { u: from[0], v: from[1] },
  to: { u: to[0], v: to[1] },
  segments,
});

/**
 * A branched, lofted test body: a trunk tube with two side tubes branching
 * from openings in its flanks, a top tube on its upper end and two fork tubes
 * leaving its lower end on either side of a shared fork curve, every branch
 * joined to the trunk by a bridge.
 *
 * The trunk's spine runs up `+Y` with its section's first axis toward `+Z`, so
 * `v` 0 faces `+Z` and 0.25 faces `+X`. Its four strips by `v` are cut into
 * three bands by `u`; the flank strips' middle band is left out, opening a
 * hole of two by two faces on each flank. The side tubes have eight columns at
 * every tier and end on pinned rings, the junction a neighbouring part would
 * share. The fork tubes leave the trunk's lower edge through loops made of
 * half that edge and the shared fork curve; the top tube leaves its upper
 * edge. Tier counts vary in the wide strips and along the spines; the chord
 * through each side opening stays at two by two.
 *
 * `shape` changes the sizes without touching the layout, so every value gives
 * the same topology at a tier.
 *
 * @param shape.breadth Trunk breadth multiplier, 1 by default.
 * @param shape.branch Side tube radius multiplier, 1 by default.
 * @param shape.guides Whether the trunk carries its breadth guides and features, true by default.
 * @returns The network, metres.
 */
export function sweepBranchedBody(
  shape: { breadth?: number; branch?: number; guides?: boolean } = {},
): IAutoMovieSurfaceNetwork {
  const b: number = shape.breadth ?? 1;
  const a: number = shape.branch ?? 1;
  const trunk: IAutoMovieSweep = {
    spine: { points: [point(0, 0, 0), point(0, 0.3, 0.012), point(0, 0.6, 0)], normal: point(0, 0, 1) },
    stations: [
      { at: 0, section: oval(0.1, 0.16 * b, 0.11, 2.2) },
      { at: 0.45, section: oval(0.085, 0.13 * b, 0.09, 2) },
      { at: 0.75, section: oval(0.11, 0.17 * b, 0.1, 3) },
      { at: 1, section: oval(0.09, 0.17 * b, 0.09, 3.5) },
    ],
    ...((shape.guides ?? true)
      ? {
          guides: [Math.PI / 2, (3 * Math.PI) / 2].map((angle: number): IAutoMovieSweep.IGuide => ({
            angle,
            radii: [
              { at: 0, value: 0.16 * b },
              { at: 0.3, value: 0.13 * b },
              { at: 0.45, value: 0.125 * b },
              { at: 0.8, value: 0.175 * b },
              { at: 1, value: 0.17 * b },
            ],
          })),
          features: [
            {
              // a groove across the front, fading at both ends
              points: [-0.8, -0.4, 0, 0.4, 0.8].map((angle: number, k: number): IAutoMovieSweep.IFeaturePoint => ({
                at: 0.6,
                angle,
                offset: [0, -0.006, -0.008, -0.006, 0][k]!,
              })),
              width: 0.035,
            },
            {
              // a groove down the back, fading at both ends
              points: [0.05, 0.22, 0.4].map((at: number, k: number): IAutoMovieSweep.IFeaturePoint => ({
                at,
                angle: Math.PI,
                offset: [0, -0.01, 0][k]!,
              })),
              width: 0.03,
            },
          ],
        }
      : {}),
  };
  const tube = (from: IAutoMovieVector3, to: IAutoMovieVector3, normal: IAutoMovieVector3, r0: number, r1: number): IAutoMovieSweep => ({
    spine: { points: [from, to], normal },
    stations: [
      { at: 0, section: oval(r0, r0, r0, 2) },
      { at: 0.5, section: oval(r0 * 0.85, r0 * 0.9, r0 * 0.85, 2.2) },
      { at: 1, section: oval(r1, r1, r1, 2) },
    ],
  });
  const sideY: number = 0.456;
  const sweeps: Record<string, IAutoMovieSweep> = {
    trunk,
    sideLeft: tube(point(0.27 * b, sideY, 0), point(0.75, sideY, 0), point(0, -1, 1), 0.065 * a, 0.045 * a),
    sideRight: tube(point(-0.27 * b, sideY, 0), point(-0.75, sideY, 0), point(0, -1, -1), 0.065 * a, 0.045 * a),
    top: {
      spine: { points: [point(0, 0.68, 0), point(0, 0.8, 0.01)], normal: point(0, 0, 1) },
      stations: [{ at: 0, section: oval(0.06, 0.065, 0.065, 2) }, { at: 1, section: oval(0.05, 0.055, 0.055, 2) }],
    },
    forkLeft: tube(point(0.09 * b, -0.16, 0), point(0.1 * b, -0.9, 0), point(0, 0, -1), 0.1, 0.055),
    forkRight: tube(point(-0.09 * b, -0.16, 0), point(-0.1 * b, -0.9, 0), point(0, 0, 1), 0.1, 0.055),
  };

  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  for (const band of BANDS)
    for (const strip of STRIPS) {
      if (strip.columns === SIDE && band === BANDS[1]) continue;
      patches.push({ type: "sweep", name: `trunk.${strip.name}.${band.u[0]}`, sweep: "trunk", u: band.u, v: strip.v, rows: band.rows, columns: strip.columns });
    }
  for (const name of ["top"]) for (const strip of STRIPS)
    patches.push({ type: "sweep", name: `${name}.${strip.name}`, sweep: name, u: [0, 1], v: strip.v, rows: { lowest: 1, low: 1, medium: 2, high: 3 }, columns: strip.columns });
  const sideRows: IAutoMovieSurfaceNetwork.ICounts = { lowest: 2, low: 3, medium: 6, high: 12 };
  for (const branch of ["sideLeft", "sideRight"])
    patches.push({ type: "sweep", name: branch, sweep: branch, u: [0, 1], v: [0, 1], rows: sideRows, columns: fixed(8) });
  // branch strips by v, matched to the parts of the loop they meet: trunk back (or front) half, side, other half, fork
  const forkStrips: Array<{ v: [number, number]; columns: IAutoMovieSurfaceNetwork.ICounts }> = [
    { v: [-0.12, 0.1], columns: HALF },
    { v: [0.1, 0.22], columns: SIDE },
    { v: [0.22, 0.61], columns: HALF },
    { v: [0.61, 0.88], columns: FORK },
  ];
  const forkRows: IAutoMovieSurfaceNetwork.ICounts = { lowest: 2, low: 4, medium: 8, high: 16 };
  for (const branch of ["forkLeft", "forkRight"])
    forkStrips.forEach((strip, k: number): void => {
      patches.push({ type: "sweep", name: `${branch}.${k}`, sweep: branch, u: [0, 1], v: strip.v, rows: forkRows, columns: strip.columns });
    });

  const top: number = BANDS[1]!.u[1];
  const bottom: number = BANDS[1]!.u[0];
  const hole = (v0: number, v1: number): IAutoMovieSurfaceNetwork.IEdge[] => [
    edge("trunk", [bottom, v0], [bottom, v1], SIDE),
    edge("trunk", [bottom, v1], [top, v1], fixed(2)),
    edge("trunk", [top, v1], [top, v0], SIDE),
    edge("trunk", [top, v0], [bottom, v0], fixed(2)),
  ];
  const start = (sweep: string): IAutoMovieSurfaceNetwork.IEdge[] => [edge(sweep, [0, 0], [0, 1], fixed(8))];
  const bridgeRows: IAutoMovieSurfaceNetwork.ICounts = { lowest: 1, low: 2, medium: 2, high: 4 };
  patches.push(
    { type: "bridge", name: "joinSideLeft", from: { edges: hole(0.17, 0.33), tangent: "across" }, to: { edges: start("sideLeft"), tangent: "forward" }, rows: bridgeRows, tension: 0.8 },
    { type: "bridge", name: "joinSideRight", from: { edges: hole(0.67, 0.83), tangent: "across" }, to: { edges: start("sideRight"), tangent: "forward" }, rows: bridgeRows, tension: 0.8 },
  );
  const ring = (sweep: string, u: number): IAutoMovieSurfaceNetwork.IEdge[] =>
    STRIPS.map((s): IAutoMovieSurfaceNetwork.IEdge => edge(sweep, [u, s.v[0]], [u, s.v[1]], s.columns));
  patches.push({
    type: "bridge",
    name: "joinTop",
    from: { edges: ring("trunk", 1), tangent: "forward" },
    to: { edges: ring("top", 0), tangent: "forward" },
    rows: { lowest: 1, low: 1, medium: 2, high: 2 },
  });
  const forkStart = (branch: string): IAutoMovieSurfaceNetwork.IEdge[] =>
    forkStrips.map((s): IAutoMovieSurfaceNetwork.IEdge => edge(branch, [0, s.v[0]], [0, s.v[1]], s.columns));
  const joinForkRows: IAutoMovieSurfaceNetwork.ICounts = { lowest: 1, low: 2, medium: 3, high: 4 };
  patches.push(
    {
      type: "bridge",
      name: "joinForkLeft",
      from: {
        edges: [
          edge("trunk", [0, 0.5], [0, 0.33], HALF),
          edge("trunk", [0, 0.33], [0, 0.17], SIDE),
          edge("trunk", [0, 0.17], [0, 0], HALF),
          { type: "curve", curve: "fork" },
        ],
        tangent: "backward",
      },
      to: { edges: forkStart("forkLeft"), tangent: "forward" },
      rows: joinForkRows,
    },
    {
      type: "bridge",
      name: "joinForkRight",
      from: {
        edges: [
          edge("trunk", [0, 1], [0, 0.83], HALF),
          edge("trunk", [0, 0.83], [0, 0.67], SIDE),
          edge("trunk", [0, 0.67], [0, 0.5], HALF),
          { type: "curve", curve: "fork", reverse: true },
        ],
        tangent: "backward",
      },
      to: { edges: forkStart("forkRight"), tangent: "forward" },
      rows: joinForkRows,
    },
  );
  const end = (sweep: string, radius: number, side: number): IAutoMovieSurfaceNetwork.IRing => {
    const s = sweeps[sweep]!;
    const tip: IAutoMovieVector3 = s.spine.points[s.spine.points.length - 1]!;
    return {
      name: `${sweep}.end`,
      edges: [edge(sweep, [1, 0], [1, 1], fixed(8))],
      // a pinned octagon of control points across the tube's end, the shape a neighbouring part would share
      positions: Array.from({ length: 8 }, (_: unknown, k: number): IAutoMovieVector3 => {
        const angle: number = (2 * Math.PI * k) / 8;
        const n: IAutoMovieVector3 = s.spine.normal;
        const size: number = Math.hypot(n.y, n.z);
        const x: IAutoMovieVector3 = point(0, n.y / size, n.z / size);
        const y: IAutoMovieVector3 = point(0, -side * x.z, side * x.y);
        return point(
          tip.x,
          tip.y + radius * (Math.cos(angle) * x.y + Math.sin(angle) * y.y),
          tip.z + radius * (Math.cos(angle) * x.z + Math.sin(angle) * y.z),
        );
      }),
    };
  };
  return {
    sweeps,
    nodes: {
      forkFront: { type: "sweep", sweep: "trunk", u: 0, v: 0 },
      forkBack: { type: "sweep", sweep: "trunk", u: 0, v: 0.5 },
    },
    curves: {
      fork: {
        from: "forkFront",
        to: "forkBack",
        through: [point(0, -0.07, 0.02), point(0, -0.075, -0.03)],
        segments: FORK,
        direction: point(0, -1, 0),
      },
    },
    patches,
    rings: [end("sideLeft", 0.05 * a, 1), end("sideRight", 0.05 * a, -1)],
  };
}
