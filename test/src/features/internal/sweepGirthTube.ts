import {
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSweep,
} from "@automovie/engine";

/** Rows along the tube by tier, even, so its middle is a row at every tier. */
const ROWS: IAutoMovieSurfaceNetwork.ICounts = {
  lowest: 4,
  low: 8,
  medium: 8,
  high: 16,
};

/** Columns round it by tier: 8, 12 and 16 at the three coarser tiers. */
const COLUMNS: IAutoMovieSurfaceNetwork.ICounts = {
  lowest: 8,
  low: 12,
  medium: 16,
  high: 16,
};

/**
 * A straight tube shaped like a trunk's lower half, the fixture a measured
 * girth is held on: 0.6 m long up `+Y`, its section swelling from 0.12 by
 * 0.08 m half-axes at either end to 0.16 by 0.11 m at its middle, where a
 * girth ring runs round it. The section is an ellipse, or with `exponent` a
 * superellipse, 4 for a rounded rectangle whose sides flatten and whose
 * corners turn tightly, the shape that loses the most perimeter between
 * columns. The ends are open rings that stay as sampled. With `beside`, two
 * more girth rings run an eighth of the tube below and above the middle, a
 * row apart at the low and medium tiers, so their factors couple as a
 * trunk's waist, underbust and chest do.
 *
 * @param shape.exponent The superellipse exponent of every section, 2 for an ellipse.
 * @param shape.perimeter The middle ring's declared perimeter, metres; omitted, the ring is only reported.
 * @param shape.beside The declared perimeters of the rings at `u` 0.375 and 0.625, metres; omitted, there are none.
 * @returns The network, metres.
 */
export function sweepGirthTube(shape: {
  exponent: number;
  perimeter?: number;
  beside?: [number, number];
}): IAutoMovieSurfaceNetwork {
  const section = (
    right: number,
    up: number,
  ): IAutoMovieSweep.IStation["section"] => ({
    type: "superellipse",
    right,
    up,
    left: right,
    down: up,
    exponents: [shape.exponent, shape.exponent, shape.exponent, shape.exponent],
  });
  const ring = (name: string, u: number): IAutoMovieSurfaceNetwork.IRing => ({
    name,
    edges: [
      {
        type: "sweep",
        sweep: "tube",
        from: { u, v: 0 },
        to: { u, v: 1 },
        segments: COLUMNS,
      },
    ],
  });
  return {
    sweeps: {
      tube: {
        spine: {
          points: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0.6, z: 0 },
          ],
          normal: { x: 0, y: 0, z: 1 },
        },
        stations: [
          { at: 0, section: section(0.12, 0.08) },
          { at: 0.5, section: section(0.16, 0.11) },
          { at: 1, section: section(0.12, 0.08) },
        ],
      },
    },
    patches: [
      {
        type: "sweep",
        name: "tube",
        sweep: "tube",
        u: [0, 1],
        v: [0, 1],
        rows: ROWS,
        columns: COLUMNS,
      },
    ],
    rings: [
      ring("start", 0),
      {
        ...ring("girth", 0.5),
        ...(shape.perimeter !== undefined
          ? { perimeter: shape.perimeter }
          : {}),
      },
      ring("end", 1),
      ...(shape.beside !== undefined
        ? [
            { ...ring("below", 0.375), perimeter: shape.beside[0] },
            { ...ring("above", 0.625), perimeter: shape.beside[1] },
          ]
        : []),
    ],
  };
}
