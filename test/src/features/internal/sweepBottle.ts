import {
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSweep,
  type IAutoMovieSweepSection,
} from "@automovie/engine";

/** Columns per quarter turn by tier. */
const QUARTER: IAutoMovieSurfaceNetwork.ICounts = { lowest: 1, low: 2, medium: 4, high: 8 };

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
 * through a shoulder into a round neck with a lip, its base closed by one
 * Coons patch over the four quarters of the bottom loop and its mouth left
 * open as a ring. The heel turns the wall inward before the base, as a
 * moulded bottle's does, so the base meets the wall at an obtuse angle.
 *
 * The spine runs up `+Y`; the body is wider along the section's `x` axis
 * (`+Z`) than along `y` (`-X`), and two guides hold the body's depth flat
 * between the base and shoulder stations, so the flat faces come from the
 * guides rather than from extra stations. The four tube patches are the
 * quarters of the turn, so the base patch's sides weld onto their bottom
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
  // seen from below the bottom loop runs counterclockwise with v decreasing
  patches.push({
    type: "coons",
    name: "base",
    sides: [bottom(1, 0.75), bottom(0.75, 0.5), bottom(0.5, 0.25), bottom(0.25, 0)],
  });
  return {
    sweeps: { bottle },
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
