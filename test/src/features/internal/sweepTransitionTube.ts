import { type IAutoMovieSurfaceNetwork, type IAutoMovieSweep } from "@automovie/engine";

/** Coarse columns round the tube's first part by tier. */
const COARSE: IAutoMovieSurfaceNetwork.ICounts = { lowest: 4, low: 8, medium: 8, high: 16 };

/** Fine columns round its grooved middle by tier, twice the coarse. */
const FINE: IAutoMovieSurfaceNetwork.ICounts = { lowest: 8, low: 16, medium: 16, high: 32 };

/** Columns round its last part by tier, three quarters of the fine. */
const LAST: IAutoMovieSurfaceNetwork.ICounts = { lowest: 6, low: 12, medium: 12, high: 24 };

/** Rows of a count-changing band by tier, so its middle row is about as tall as a coarse column is wide. */
const BAND: IAutoMovieSurfaceNetwork.ICounts = { lowest: 1, low: 1, medium: 1, high: 2 };

/** Rows of a part of the tube by tier. */
const rows = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({ lowest: n, low: 2 * n, medium: 4 * n, high: 8 * n });

/**
 * A tube whose column count changes along its length, the layout a limb
 * uses to carry a groove: coarse columns from its start, a band doubling them
 * into a fine middle that carries a groove along it, and a band shedding a
 * quarter of them into its last part, with an open ring at either end.
 *
 * The spine runs up `+Y`, bowed `bow` metres in `z` at its middle, 0.01 by
 * default; a bow of 0 makes it the `y` axis. Without `groove`, every
 * section is a circle of 0.05 m and the tube is a slightly bent cylinder, so
 * its limit surface can be measured against the radius; with it, a feature
 * cuts a groove 4 mm deep along the fine middle. `bands` false joins the
 * parts with no change of count, every part at the coarse count, the
 * reference the bands are measured against.
 *
 * @param shape.groove Whether the middle carries its groove, false by default.
 * @param shape.bands Whether the column count changes, true by default.
 * @param shape.bow How far the spine's middle leaves the `y` axis along `z`, metres, 0.01 by default.
 * @returns The network, metres.
 */
export function sweepTransitionTube(shape: { groove?: boolean; bands?: boolean; bow?: number } = {}): IAutoMovieSurfaceNetwork {
  const circle: IAutoMovieSweep.IStation["section"] = { type: "superellipse", right: 0.05, up: 0.05, left: 0.05, down: 0.05, exponents: [2, 2, 2, 2] };
  const tube: IAutoMovieSweep = {
    spine: { points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0.3, z: shape.bow ?? 0.01 }, { x: 0, y: 0.6, z: 0 }], normal: { x: 0, y: 0, z: 1 } },
    stations: [0, 0.5, 1].map((at: number): IAutoMovieSweep.IStation => ({ at, section: circle })),
    ...((shape.groove ?? false)
      ? {
          features: [
            {
              points: [0.42, 0.55, 0.68].map((at: number, k: number): IAutoMovieSweep.IFeaturePoint => ({ at, angle: 0, offset: [0, -0.004, 0][k]! })),
              width: 0.015,
            },
          ],
        }
      : {}),
  };
  const bands: boolean = shape.bands ?? true;
  const part = (name: string, u: [number, number], columns: IAutoMovieSurfaceNetwork.ICounts, n: number): IAutoMovieSurfaceNetwork.ISweepPatch => ({
    type: "sweep",
    name,
    sweep: "tube",
    u,
    v: [0, 1],
    rows: rows(n),
    columns,
  });
  const band = (name: string, u: [number, number], start: IAutoMovieSurfaceNetwork.ICounts, end: IAutoMovieSurfaceNetwork.ICounts): IAutoMovieSurfaceNetwork.IPatch =>
    bands ? { type: "transition", name, sweep: "tube", u, v: [0, 1], start, end, rows: BAND } : { ...part(name, u, COARSE, 1), rows: BAND };
  const ring = (u: number, columns: IAutoMovieSurfaceNetwork.ICounts): IAutoMovieSurfaceNetwork.IRing => ({
    name: `ring.${u}`,
    edges: [{ type: "sweep", sweep: "tube", from: { u, v: 0 }, to: { u, v: 1 }, segments: columns }],
  });
  return {
    sweeps: { tube },
    patches: [
      part("start", [0, 0.3], COARSE, 3),
      band("grow", [0.3, 0.36], COARSE, FINE),
      part("middle", [0.36, 0.74], bands ? FINE : COARSE, 4),
      band("shed", [0.74, 0.8], FINE, LAST),
      part("last", [0.8, 1], bands ? LAST : COARSE, 2),
    ],
    rings: [ring(0, COARSE), ring(1, bands ? LAST : COARSE)],
  };
}
