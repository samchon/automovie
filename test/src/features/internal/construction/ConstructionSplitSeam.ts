
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSplit,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { ConstructionRead } from "./ConstructionRead";
import { ConstructionShapes } from "./ConstructionShapes";

/**
 * The curved-seam split fixture (metres, the `DOWN` frame, stations advancing
 * along -z): the host `trunk` is the body of revolution of radius r(s) = 0.025
 * sqrt(1 - (s / 0.08)^2) over the stations [-0.06, 0.03], its top end (z =
 * -0.03) split along [0, pi], so that the forks are A = (R, 0, -30) and B =
 * (-R, 0, -30) mm with R = 25 sqrt(1 - (30 / 80)^2) and the seam plane is y =
 * 0; the children `leg.a` and `leg.b` hang at y = +-0.0105 with rails 0.03 m
 * in; profile knots [0.008, 0.005], [0.0232, 0.006], [0.0383, 0.005] m (along
 * from A, depth below the end), corner pi / 8; 32 columns, 4 rows.
 */
export namespace ConstructionSplitSeam {
  /** A world vector. */
  export type V3 = [number, number, number];

  /** The columns of every band. */
  export const COLUMNS: number = 32;

  /** The turn. */
  export const TURN: number = 2 * Math.PI;

  /** The host's end circle radius, mm. */
  export const R: number = 25 * Math.sqrt(1 - (30 / 80) ** 2);

  /** The radial slope of the host at its top end, per metre of station. */
  export const SLOPE: number =
    (-0.025 * (0.03 / 0.08 ** 2)) / Math.sqrt(1 - (0.03 / 0.08) ** 2);

  /** The profile's knots (along from A, depth below the end), metres. */
  export const KNOTS: [number, number][] = [
    [0.008, 0.005],
    [0.0232, 0.006],
    [0.0383, 0.005],
  ];

  /** The corner of the ribbons, radians. */
  export const CORNER: number = Math.PI / 8;

  /** The clock of column k. */
  export function clock(k: number): number {
    return (TURN * k) / COLUMNS;
  }

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

  /** A leg hung at y. */
  export function leg(name: string, y: number): IAutoMovieConstructionNode {
    return ConstructionShapes.part(
      name,
      { ...ConstructionShapes.DOWN, origin: { x: 0, y, z: -0.03 } },
      ConstructionShapes.uniform(0, 0.08, 9),
      (s: number): [number, number, number, number] => {
        const r: number = 0.008 + 0.002 * (2 * (s / 0.08) - 1) ** 2;
        return [r, r, r, r];
      },
      "open",
    );
  }

  /** The split node, its children matched by arclength share when asked. */
  export function split(
    profile: IAutoMovieConstructionSplit.IProfile | undefined,
    lengthwise: boolean = false,
  ): IAutoMovieConstructionSplit {
    const correspondence: { correspondence?: "length" } = lengthwise
      ? { correspondence: "length" }
      : {};
    return {
      type: "split",
      name: "split.legs",
      host: host(),
      hostFace: "trunk",
      hostEnd: "top",
      seam: [0, Math.PI],
      ...(profile === undefined ? {} : { profile }),
      count: COLUMNS,
      rows: 4,
      children: [
        {
          band: "band.a",
          part: leg("leg.a", 0.0105),
          partFace: "leg.a",
          partEnd: "bottom",
          rail: 0.03,
          ...correspondence,
        },
        {
          band: "band.b",
          part: leg("leg.b", -0.0105),
          partFace: "leg.b",
          partEnd: "bottom",
          rail: 0.03,
          ...correspondence,
        },
      ],
    };
  }

  /** The default profile. */
  export function profile(): IAutoMovieConstructionSplit.IProfile {
    return { knots: KNOTS, corner: CORNER };
  }

  /**
   * Realize a root, with the skin only when asked (surfaces and diagnostics
   * need none).
   */
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

  /** Difference of two vectors. */
  export function sub(a: readonly number[], b: readonly number[]): V3 {
    return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  }

  /** Length of a vector. */
  export function len(a: readonly number[]): number {
    return Math.hypot(a[0]!, a[1]!, a[2]!);
  }

  /** A scaled vector. */
  export function scaled(a: readonly number[], k: number): V3 {
    return [a[0]! * k, a[1]! * k, a[2]! * k];
  }

  /** The unit vector. */
  export function unit(a: readonly number[]): V3 {
    return scaled(a, 1 / len(a));
  }

  /** The distance between two directions' unit vectors. */
  export function off(a: readonly number[], b: readonly number[]): number {
    return len(sub(unit(a), unit(b)));
  }

  /** The cross product. */
  export function cross(a: readonly number[], b: readonly number[]): V3 {
    return [
      a[1]! * b[2]! - a[2]! * b[1]!,
      a[2]! * b[0]! - a[0]! * b[2]!,
      a[0]! * b[1]! - a[1]! * b[0]!,
    ];
  }

  /** The angle between two vectors, degrees. */
  export function degrees(a: readonly number[], b: readonly number[]): number {
    const cosine: number =
      (a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!) / (len(a) * len(b));
    return (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
  }

  /** `uu / |u|^2` of a jet, mm^-1. */
  export function bend(j: IAutoMovieSolidSurface.IJet): V3 {
    return scaled(j.uu, 1 / (len(j.u) * len(j.u)));
  }

  /**
   * The angle between the band's and the host's outward normals at a fork
   * column, degrees.
   */
  export function fork(
    r: IAutoMovieConstructionRealization.IRealization,
    name: string,
    k: number,
    phi: number,
  ): number {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(r, name);
    const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(r, "trunk");
    const b: IAutoMovieSolidSurface.IJet = band.jet(0, clock(k));
    const h: IAutoMovieSolidSurface.IJet = trunk.jet(30, phi);
    return degrees(
      scaled(cross(b.u, b.v), band.orientation),
      scaled(cross(h.u, h.v), trunk.orientation),
    );
  }
}
