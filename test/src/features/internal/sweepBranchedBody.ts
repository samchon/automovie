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
  { u: [0.86, 1], rows: { lowest: 1, low: 2, medium: 2, high: 4 } },
];

/** Trunk strips by `v`, mirror images of each other across the plane `x = 0`: the `+Z` face across the seam, the `+X` flank, the `-Z` face, the `-X` flank. */
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

/** The mirror image across the plane `x = 0`. */
const mirror = (p: IAutoMovieVector3): IAutoMovieVector3 => point(-p.x, p.y, p.z);

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
 * A branched, lofted test body, mirror-symmetric across the plane `x = 0`: a
 * trunk tube with two side tubes branching from openings in its flanks, a top
 * tube on its upper end and two fork tubes leaving its lower end on either
 * side of a shared fork curve, every branch joined to the trunk by a bridge.
 *
 * The trunk's spine runs up `+Y` with its section's first axis toward `+Z`, so
 * `v` 0 faces `+Z` and 0.25 faces `+X`, and the plane `x = 0` maps `v` to
 * `1 - v`. Its four strips by `v` are cut into three bands by `u`; the flank
 * strips' middle band is left out, opening a hole of two by two faces on each
 * flank, and the trunk's last stations narrow so its upper end rounds over.
 * The side bridges leave the openings tangent to the trunk, and the side
 * tubes, with eight columns at every tier, end on pinned rings, the junction
 * a neighbouring part would share. The fork tubes leave the trunk's lower edge
 * through loops made of half that edge and the shared fork curve; both
 * bridges leave the fork curve tangent to its horizontal normal plane, to
 * opposite sides, so the fork is a saddle. Every right-hand piece is the
 * mirror of the left-hand one: its spine points mirrored, its loops the
 * mirrored left loops traversed in reverse from the mirrored start, and its
 * strips at `1 - v`. Tier counts vary in the wide strips and along the
 * spines; the chord through each side opening stays at two by two.
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
      { at: 0.78, section: oval(0.11, 0.17 * b, 0.1, 2.6) },
      { at: 0.92, section: oval(0.1, 0.16 * b, 0.095, 2.4) },
      { at: 1, section: oval(0.07, 0.11 * b, 0.07, 2.2) },
    ],
    ...((shape.guides ?? true)
      ? {
          guides: [Math.PI / 2, (3 * Math.PI) / 2].map(
            (angle: number): IAutoMovieSweep.IGuide => ({
              angle,
              radii: [
                { at: 0, value: 0.16 * b },
                { at: 0.3, value: 0.13 * b },
                { at: 0.45, value: 0.125 * b },
                { at: 0.8, value: 0.172 * b },
                { at: 0.92, value: 0.16 * b },
                { at: 1, value: 0.11 * b },
              ],
            }),
          ),
          features: [
            {
              // a groove across the +Z face, fading at both ends
              points: [-0.8, -0.4, 0, 0.4, 0.8].map(
                (angle: number, k: number): IAutoMovieSweep.IFeaturePoint => ({
                  at: 0.6,
                  angle,
                  offset: [0, -0.006, -0.008, -0.006, 0][k]!,
                }),
              ),
              width: 0.035,
            },
            {
              // a groove down the -Z face, fading at both ends
              points: [0.05, 0.22, 0.4].map(
                (at: number, k: number): IAutoMovieSweep.IFeaturePoint => ({
                  at,
                  angle: Math.PI,
                  offset: [0, -0.01, 0][k]!,
                }),
              ),
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
  const reflect = (s: IAutoMovieSweep): IAutoMovieSweep => ({
    ...s,
    spine: { points: s.spine.points.map(mirror), normal: mirror(s.spine.normal) },
  });
  const sideY: number = 0.456;
  const sideLeft: IAutoMovieSweep = tube(point(0.27 * b, sideY, 0), point(0.75, sideY, 0), point(0, -1, 1), 0.042 * a, 0.034 * a);
  const forkLeft: IAutoMovieSweep = tube(point(0.095 * b, -0.16, 0), point(0.1 * b, -0.9, 0), point(0, 0, -1), 0.082, 0.055);
  const sweeps: Record<string, IAutoMovieSweep> = {
    trunk,
    sideLeft,
    sideRight: reflect(sideLeft),
    top: {
      spine: { points: [point(0, 0.66, 0), point(0, 0.8, 0.01)], normal: point(0, 0, 1) },
      stations: [
        { at: 0, section: oval(0.06, 0.065, 0.065, 2) },
        { at: 1, section: oval(0.05, 0.055, 0.055, 2) },
      ],
    },
    forkLeft,
    forkRight: reflect(forkLeft),
  };

  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  for (const band of BANDS)
    for (const strip of STRIPS) {
      if (strip.columns === SIDE && band === BANDS[1]) continue;
      patches.push({ type: "sweep", name: `trunk.${strip.name}.${band.u[0]}`, sweep: "trunk", u: band.u, v: strip.v, rows: band.rows, columns: strip.columns });
    }
  for (const strip of STRIPS)
    patches.push({ type: "sweep", name: `top.${strip.name}`, sweep: "top", u: [0, 1], v: strip.v, rows: { lowest: 1, low: 1, medium: 2, high: 3 }, columns: strip.columns });
  const sideRows: IAutoMovieSurfaceNetwork.ICounts = { lowest: 2, low: 3, medium: 6, high: 12 };
  for (const branch of ["sideLeft", "sideRight"])
    patches.push({ type: "sweep", name: branch, sweep: branch, u: [0, 1], v: [0, 1], rows: sideRows, columns: fixed(8) });
  // fork strips by v, matched to the parts of the loop they meet: the trunk edge's -Z half, its flank, its +Z half, the fork curve
  const forkStripsLeft: Array<{ v: [number, number]; columns: IAutoMovieSurfaceNetwork.ICounts }> = [
    { v: [-0.12, 0.1], columns: HALF },
    { v: [0.1, 0.22], columns: SIDE },
    { v: [0.22, 0.61], columns: HALF },
    { v: [0.61, 0.88], columns: FORK },
  ];
  // the mirror at 1 - v, in increasing order
  const forkStripsRight: typeof forkStripsLeft = [...forkStripsLeft]
    .reverse()
    .map((s) => ({ v: [1 - s.v[1], 1 - s.v[0]] as [number, number], columns: s.columns }));
  const forkRows: IAutoMovieSurfaceNetwork.ICounts = { lowest: 2, low: 4, medium: 8, high: 16 };
  const forkStrips: Record<string, typeof forkStripsLeft> = { forkLeft: forkStripsLeft, forkRight: forkStripsRight };
  for (const branch of ["forkLeft", "forkRight"])
    forkStrips[branch]!.forEach((strip, k: number): void => {
      patches.push({ type: "sweep", name: `${branch}.${k}`, sweep: branch, u: [0, 1], v: strip.v, rows: forkRows, columns: strip.columns });
    });

  const [u0, u1] = BANDS[1]!.u;
  const bridgeRows: IAutoMovieSurfaceNetwork.ICounts = { lowest: 1, low: 2, medium: 2, high: 4 };
  const start = (sweep: string): IAutoMovieSurfaceNetwork.IEdge[] => [edge(sweep, [0, 0], [0, 1], fixed(8))];
  patches.push(
    {
      type: "bridge",
      name: "joinSideLeft",
      from: {
        edges: [
          edge("trunk", [u0, 0.17], [u0, 0.33], SIDE),
          edge("trunk", [u0, 0.33], [u1, 0.33], fixed(2)),
          edge("trunk", [u1, 0.33], [u1, 0.17], SIDE),
          edge("trunk", [u1, 0.17], [u0, 0.17], fixed(2)),
        ],
        tangent: "across",
      },
      to: { edges: start("sideLeft"), tangent: "forward" },
      rows: bridgeRows,
      tension: 0.8,
    },
    {
      type: "bridge",
      name: "joinSideRight",
      from: {
        edges: [
          edge("trunk", [u0, 0.83], [u1, 0.83], fixed(2)),
          edge("trunk", [u1, 0.83], [u1, 0.67], SIDE),
          edge("trunk", [u1, 0.67], [u0, 0.67], fixed(2)),
          edge("trunk", [u0, 0.67], [u0, 0.83], SIDE),
        ],
        tangent: "across",
      },
      to: { edges: start("sideRight"), tangent: "forward" },
      rows: bridgeRows,
      tension: 0.8,
    },
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
    forkStrips[branch]!.map((s): IAutoMovieSurfaceNetwork.IEdge => edge(branch, [0, s.v[0]], [0, s.v[1]], s.columns));
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
        tangent: "across",
      },
      to: { edges: forkStart("forkLeft"), tangent: "forward" },
      rows: joinForkRows,
    },
    {
      type: "bridge",
      name: "joinForkRight",
      from: {
        edges: [
          { type: "curve", curve: "fork", reverse: true },
          edge("trunk", [0, 1], [0, 0.83], HALF),
          edge("trunk", [0, 0.83], [0, 0.67], SIDE),
          edge("trunk", [0, 0.67], [0, 0.5], HALF),
        ],
        tangent: "across",
      },
      to: { edges: forkStart("forkRight"), tangent: "forward" },
      rows: joinForkRows,
    },
  );
  // a pinned octagon of control points across the left side tube's end, the shape a neighbouring part would share
  const tip: IAutoMovieVector3 = sideLeft.spine.points[1]!;
  const root: number = Math.SQRT1_2;
  const endLeft: IAutoMovieVector3[] = Array.from({ length: 8 }, (_: unknown, k: number): IAutoMovieVector3 => {
    const angle: number = (2 * Math.PI * k) / 8;
    const radius: number = 0.037 * a;
    // the tube's frame: first axis (0, -1, 1) / sqrt 2, second axis +X crossed with it, (0, -1, -1) / sqrt 2
    return point(tip.x, tip.y + radius * root * (-Math.cos(angle) - Math.sin(angle)), tip.z + radius * root * (Math.cos(angle) - Math.sin(angle)));
  });
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
        normal: point(0, -1, 0),
      },
    },
    patches,
    rings: [
      { name: "sideLeft.end", edges: [edge("sideLeft", [1, 0], [1, 1], fixed(8))], positions: endLeft },
      {
        name: "sideRight.end",
        edges: [edge("sideRight", [1, 0], [1, 1], fixed(8))],
        positions: endLeft.map((_: IAutoMovieVector3, k: number): IAutoMovieVector3 => mirror(endLeft[(8 - k) % 8]!)),
      },
    ],
  };
}
