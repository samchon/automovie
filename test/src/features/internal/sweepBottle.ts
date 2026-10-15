import {
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSweep,
  type IAutoMovieSweepSection,
  type IAutoMovieSweepSurface,
  compileAutoMovieSweep,
} from "@automovie/engine";
import { type IAutoMovieVector3 } from "@automovie/interface";

/** Columns per quarter turn by tier. */
const QUARTER: IAutoMovieSurfaceNetwork.ICounts = { lowest: 1, low: 2, medium: 4, high: 8 };

/** Segments of each heel spoke, from the rim to the inner loop, by tier. */
const SPOKE: IAutoMovieSurfaceNetwork.ICounts = { lowest: 1, low: 1, medium: 2, high: 4 };

/** The inner loop's size relative to the base section. */
const INSET: number = 0.6;

/** Rows along the spine by tier. */
const ROWS: IAutoMovieSurfaceNetwork.ICounts = { lowest: 2, low: 4, medium: 8, high: 16 };

/** A section with equal half-axes along `x` and `y` of its plane and one exponent, metres. */
const rounded = (x: number, y: number, exponent: number): IAutoMovieSweepSection => ({
  type: "superellipse",
  right: x,
  up: y,
  left: x,
  down: y,
  exponents: [exponent, exponent, exponent, exponent],
});

/**
 * A rigid product-like test body: a flask-shaped bottle lofted from six
 * stations, a rounded-square body rising from a rounded heel and narrowing
 * through a shoulder into a round neck with a lip, its mouth left open as a
 * ring. The heel turns the wall inward before the base, as a moulded bottle's
 * does; the base continues it as a band of four Coons patches from the bottom
 * loop to a smaller inner loop below it, closed by one Coons patch, so every
 * vertex of the bottom loop joins two wall faces and two band faces. Each
 * spoke from the loop is a quadratic arc that continues the wall down and
 * arrives level at the inner loop, which lies at the least depth every spoke
 * can turn within half its run.
 *
 * The spine runs up `+Y`; the body is wider along the section's `x` axis
 * (`+Z`) than along `y` (`-X`), and two guides hold the body's depth flat
 * between the base and shoulder stations, so the flat faces come from the
 * guides rather than from extra stations. The four tube patches are the
 * quarters of the turn, so the band's outer sides weld onto their bottom
 * rows.
 *
 * `shape` changes the sizes without touching the layout, so every value gives
 * the same topology at a tier.
 *
 * @param shape.width Body width multiplier, 1 by default.
 * @param shape.height Height multiplier, 1 by default.
 * @returns The network, metres.
 */
export function sweepBottle(shape: { width?: number; height?: number } = {}): IAutoMovieSurfaceNetwork {
  const w: number = shape.width ?? 1;
  const h: number = shape.height ?? 1;
  const bottle: IAutoMovieSweep = {
    spine: { points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0.26 * h, z: 0 }], normal: { x: 0, y: 0, z: 1 } },
    stations: [
      { at: 0, section: rounded(0.04 * w, 0.022 * w, 2.6) },
      { at: 0.05, section: rounded(0.05 * w, 0.03 * w, 3) },
      { at: 0.55, section: rounded(0.052 * w, 0.032 * w, 3.2) },
      { at: 0.78, section: rounded(0.022, 0.02, 2.2) },
      { at: 0.9, section: rounded(0.014, 0.014, 2) },
      { at: 1, section: rounded(0.016, 0.016, 2) },
    ],
    guides: [Math.PI / 2, (3 * Math.PI) / 2].map(
      (angle: number): IAutoMovieSweep.IGuide => ({
        angle,
        radii: [
          { at: 0, value: 0.022 * w },
          { at: 0.05, value: 0.03 * w },
          { at: 0.55, value: 0.031 * w },
          { at: 0.78, value: 0.02 },
          { at: 1, value: 0.016 },
        ],
      }),
    ),
  };
  const quarters: Array<[number, number]> = [
    [0, 0.25],
    [0.25, 0.5],
    [0.5, 0.75],
    [0.75, 1],
  ];
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = quarters.map(
    ([v0, v1]: [number, number], k: number): IAutoMovieSurfaceNetwork.IPatch => ({
      type: "sweep",
      name: `wall.${k}`,
      sweep: "bottle",
      u: [0, 1],
      v: [v0, v1],
      rows: ROWS,
      columns: QUARTER,
    }),
  );
  const bottom = (from: number, to: number): IAutoMovieSurfaceNetwork.ISweepEdge => ({
    type: "sweep",
    sweep: "bottle",
    from: { u: 0, v: from },
    to: { u: 0, v: to },
    segments: QUARTER,
  });
  // the base as a heel band of four patches round an inner patch, so every rim vertex has valence four
  const nodes: Record<string, IAutoMovieSurfaceNetwork.INode> = {};
  const curves: Record<string, IAutoMovieSurfaceNetwork.ICurve> = {};
  const surface: IAutoMovieSweepSurface = compileAutoMovieSweep(bottle);
  const rim = (v: number): IAutoMovieVector3 => surface.point(0, v);
  // the wall continued below the rim, a unit vector down its u lines
  const down = (v: number): IAutoMovieVector3 => {
    const a: IAutoMovieVector3 = surface.along(0, v);
    const size: number = Math.hypot(a.x, a.y, a.z);
    return { x: -a.x / size, y: -a.y / size, z: -a.z / size };
  };
  const shrink = (p: IAutoMovieVector3, y: number): IAutoMovieVector3 => ({ x: INSET * p.x, y, z: INSET * p.z });
  // the inner loop lies where every spoke can turn from the wall to level within half its run: the least such drop
  const drop: number = Math.min(
    ...[0, 0.25, 0.5, 0.75].map((v: number): number => {
      const d: IAutoMovieVector3 = down(v);
      const run: number = (1 - INSET) * Math.hypot(rim(v).x, rim(v).z);
      return (0.5 * run * -d.y) / Math.hypot(d.x, d.z);
    }),
  );
  const inner = (v: number): IAutoMovieVector3 => shrink(rim(v), rim(v).y - drop);
  for (let k: number = 0; k < 4; ++k) {
    const v: number = k / 4;
    // a quadratic arc from the rim down the wall to level at the inner loop, through its middle
    const d: IAutoMovieVector3 = down(v);
    const reach: number = drop / -d.y;
    const bend: IAutoMovieVector3 = { x: rim(v).x + reach * d.x, y: rim(v).y - drop, z: rim(v).z + reach * d.z };
    const end: IAutoMovieVector3 = inner(v);
    nodes[`rim.${k}`] = { type: "sweep", sweep: "bottle", u: 0, v };
    nodes[`inner.${k}`] = { type: "point", position: end };
    curves[`spoke.${k}`] = {
      from: `rim.${k}`,
      to: `inner.${k}`,
      through: [
        {
          x: 0.25 * rim(v).x + 0.5 * bend.x + 0.25 * end.x,
          y: 0.25 * rim(v).y + 0.5 * bend.y + 0.25 * end.y,
          z: 0.25 * rim(v).z + 0.5 * bend.z + 0.25 * end.z,
        },
      ],
      segments: SPOKE,
    };
  }
  // inner edges run with v decreasing, counterclockwise seen from below like the rim
  for (let k: number = 0; k < 4; ++k)
    curves[`inner.${k}`] = {
      from: `inner.${(k + 1) % 4}`,
      to: `inner.${k}`,
      through: [inner((k + 0.5) / 4)],
      segments: QUARTER,
    };
  for (let k: number = 0; k < 4; ++k)
    patches.push({
      type: "coons",
      name: `heel.${k}`,
      sides: [
        bottom((k + 1) / 4, k / 4),
        { type: "curve", curve: `spoke.${k}` },
        { type: "curve", curve: `inner.${k}`, reverse: true },
        { type: "curve", curve: `spoke.${(k + 1) % 4}`, reverse: true },
      ],
    });
  patches.push({
    type: "coons",
    name: "base",
    sides: [3, 2, 1, 0].map((k: number): IAutoMovieSurfaceNetwork.ICurveEdge => ({ type: "curve", curve: `inner.${k}` })) as [
      IAutoMovieSurfaceNetwork.ICurveEdge,
      IAutoMovieSurfaceNetwork.ICurveEdge,
      IAutoMovieSurfaceNetwork.ICurveEdge,
      IAutoMovieSurfaceNetwork.ICurveEdge,
    ],
  });
  return {
    sweeps: { bottle },
    nodes,
    curves,
    patches,
    rings: [
      {
        name: "mouth",
        edges: quarters.map(
          ([v0, v1]: [number, number]): IAutoMovieSurfaceNetwork.ISweepEdge => ({
            type: "sweep",
            sweep: "bottle",
            from: { u: 1, v: v0 },
            to: { u: 1, v: v1 },
            segments: QUARTER,
          }),
        ),
      },
    ],
  };
}
