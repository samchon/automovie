
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSplit,
} from "@automovie/interface";

import { ConstructionShapes } from "./ConstructionShapes";

/**
 * The fan-split fixture (metres, the `DOWN` frame: chart u = +x, v = +y,
 * stations advancing along -z): the host `trunk` is the body of revolution of
 * radius 0.025 sqrt(1 - (s / 0.08)^2) over the stations [-0.06, 0.03], open at
 * both ends, its top end at z = -0.03 a circle of radius R = 25 sqrt(1 - (30 /
 * 80)^2) mm; seam 0 is the chord x = +8 mm, host phases [-t, t] with t = acos(8
 * / R), and seam 1 the chord x = -8 mm, phases [t - pi, pi - t], enclosing it;
 * the children `f.0` (x > 8), `f.1` (between) and `f.2` (x < -8) hang from z =
 * -0.03 at x = +0.0165, 0 and -0.0165, each of radius 0.007 over [0, 0.06],
 * their rails 0.02 m into them; 32 columns, 4 rows.
 */
export namespace ConstructionSplitFan {
  /** The columns of every band. */
  export const COLUMNS: number = 32;

  /** The turn. */
  export const TURN: number = 2 * Math.PI;

  /** The host's end circle radius, mm. */
  export const R: number = 25 * Math.sqrt(1 - (30 / 80) ** 2);

  /** The host phase where seam 0 meets the end circle. */
  export const T: number = Math.acos(8 / R);

  /** Half of seam 0's chord, mm. */
  export const HALF: number = Math.sqrt(R * R - 64);

  /** The further seam enclosing seam 0. */
  export const OUTER: IAutoMovieConstructionSplit.ISeam[] = [
    { seam: [T - Math.PI, Math.PI - T] },
  ];

  /** The host. */
  export function host(): IAutoMovieConstructionNode {
    return ConstructionShapes.part(
      "trunk",
      ConstructionShapes.DOWN,
      ConstructionShapes.uniform(-0.06, 0.03, 13),
      (s: number): [number, number, number, number] => {
        const r: number = 0.025 * Math.sqrt(1 - (s / 0.08) ** 2);
        return [r, r, r, r];
      },
      "open",
    );
  }

  /** A finger of radius 0.007 hung from the end plane at x. */
  export function finger(name: string, x: number): IAutoMovieConstructionNode {
    return ConstructionShapes.part(
      name,
      { ...ConstructionShapes.DOWN, origin: { x, y: 0, z: -0.03 } },
      ConstructionShapes.uniform(0, 0.06, 7),
      (): [number, number, number, number] => [0.007, 0.007, 0.007, 0.007],
      "open",
    );
  }

  /** A child at x. */
  export function child(
    name: string,
    x: number,
    correspondence?: "angle" | "length",
  ): IAutoMovieConstructionSplit.IChild {
    return {
      band: "band." + name,
      part: finger(name, x),
      partFace: name,
      partEnd: "bottom",
      rail: 0.02,
      ...(correspondence === undefined ? {} : { correspondence }),
    };
  }

  /** The three children, matched by arclength share when asked. */
  export function three(
    correspondence?: "angle" | "length",
  ): [
    IAutoMovieConstructionSplit.IChild,
    IAutoMovieConstructionSplit.IChild,
    IAutoMovieConstructionSplit.IChild,
  ] {
    return [
      child("f.0", 0.0165, correspondence),
      child("f.1", 0, correspondence),
      child("f.2", -0.0165, correspondence),
    ];
  }

  /** The split node of a fixture call. */
  export function split(options: {
    outer?: IAutoMovieConstructionSplit.ISeam[];
    children?: IAutoMovieConstructionSplit["children"];
    host?: IAutoMovieConstructionNode;
    profile?: IAutoMovieConstructionSplit.IProfile;
    count?: number;
  }): IAutoMovieConstructionSplit {
    return {
      type: "split",
      name: "split.fan",
      host: options.host ?? host(),
      hostFace: "trunk",
      hostEnd: "top",
      seam: [-T, T],
      ...(options.outer === undefined ? {} : { outer: options.outer }),
      ...(options.profile === undefined ? {} : { profile: options.profile }),
      count: options.count ?? COLUMNS,
      rows: 4,
      children: options.children ?? three(),
    };
  }

  /** A curved seam 0 of one knot 4 mm deep under the heading (0.6, 0, -0.8). */
  export function headed(reach?: number): IAutoMovieConstructionSplit.IProfile {
    return {
      knots: [[HALF / 1000, 0.004]],
      corner: 0.3,
      heading: [0.6, 0, -0.8],
      ...(reach === undefined ? {} : { reach }),
    };
  }

  /** Realize, with the skin when asked (the chord matters only then). */
  export function realize(
    root: IAutoMovieConstructionNode,
    skin: boolean = false,
  ): IAutoMovieConstructionRealization.IRealization {
    const result = AutoMovieEngineConstruction.realize(
      { name: "made", root },
      { chord: skin ? 1e-4 : 1e-2, skin },
    );
    return {
      ...result,
      mesh: result.mesh ?? {
        positions: [],
        indices: [],
        coordinates: [],
        owners: [],
      },
    };
  }
}
