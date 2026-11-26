
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSplit,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { ConstructionRead } from "./ConstructionRead";
import { ConstructionShapes } from "./ConstructionShapes";

/**
 * The composed-split fixture (metres, the `DOWN` frame, stations advancing
 * along -z): cylinders of radius 0.009 over the stations [-0.012, 0.06]
 * crossing the plane z = -0.03 at their station 0: `f.0` about (0.015, 0,
 * -0.03) leaning by `lean` toward +x, `f.1` straight down about (0, 0, -0.03),
 * `f.2` the mirror of `f.0`, under a host `trunk` whose open top end is an
 * ellipse; with the closed forms the composition must meet, in millimetres.
 */
export namespace ConstructionSplitCompose {
  /** A world vector. */
  export type V3 = [number, number, number];

  /**
   * The columns of every band: the fewest a split admits (a multiple of 4 of at
   * least 8). The forks and seams the fixture asserts stand at the columns of
   * clocks 0, pi / 2, pi and 3 pi / 2, so a finer ring decides nothing more.
   */
  export const COLUMNS: number = 8;

  /** The turn. */
  export const TURN: number = 2 * Math.PI;

  /** The rail's distance along a child, millimetres. */
  export const RAIL: number = 6;

  /** The lean of the fixture's side children, radians. */
  export const LEAN: number = 0.3;

  /** What a fixture call varies. */
  export interface IOptions {
    /** The side children's lean, radians. */
    lean: number;

    /** Their distance from the middle child's axis, metres. */
    spacing?: number;

    /** Where the children's stations start, metres. */
    from?: number;

    /** The host, `through(lean)` by default. */
    host?: IAutoMovieConstructionNode;

    /** A split in two (no middle child). */
    two?: boolean;

    /** The composition; null for the authored station rails. */
    compose?: IAutoMovieConstructionSplit.ICompose | null;

    /** An authored profile. */
    profile?: IAutoMovieConstructionSplit.IProfile;

    /** A declared cut on `f.1`. */
    cut?: IAutoMovieConstructionSplit.ICut;
  }

  /** The abscissa x* where the end sections of `f.0` and `f.1` cross, mm. */
  export function fork(lean: number): number {
    return (15 * Math.cos(lean)) / (1 + Math.cos(lean));
  }

  /**
   * A host whose top end, at station 0.03, is the ellipse of these half
   * extents, mm.
   */
  export function trunk(rx: number, ry: number): IAutoMovieConstructionNode {
    return ConstructionShapes.part(
      "trunk",
      ConstructionShapes.DOWN,
      ConstructionShapes.uniform(-0.06, 0.03, 13),
      (s: number): [number, number, number, number] => {
        const q: number =
          Math.sqrt(1 - (s / 0.08) ** 2) /
          Math.sqrt(1 - (0.03 / 0.08) ** 2) /
          1000;
        return [rx * q, ry * q, rx * q, ry * q];
      },
      "open",
    );
  }

  /** The host through the three-way composition's four forks. */
  export function through(lean: number): IAutoMovieConstructionNode {
    return trunk(
      24.5,
      Math.sqrt(81 - fork(lean) ** 2) / Math.sqrt(1 - (fork(lean) / 24.5) ** 2),
    );
  }

  /**
   * A host of half extents 27.8 and 12.5 mm, roomy enough for the authored
   * station rings.
   */
  export function roomy(): IAutoMovieConstructionNode {
    return trunk(27.8, 12.5);
  }

  /** A finger: a cylinder of radius 9 mm about (x, 0, -0.03) leaning by `lean`. */
  export function finger(
    name: string,
    x: number,
    lean: number,
    from: number,
  ): IAutoMovieConstructionNode {
    return ConstructionShapes.part(
      name,
      {
        origin: { x, y: 0, z: -0.03 },
        u: { x: Math.cos(lean), y: 0, z: Math.sin(lean) },
        v: { x: 0, y: 1, z: 0 },
      },
      ConstructionShapes.uniform(from, 0.06, 10),
      (): [number, number, number, number] => [0.009, 0.009, 0.009, 0.009],
      "open",
    );
  }

  /** The split node of a fixture call. */
  export function split(o: IOptions): IAutoMovieConstructionSplit {
    const spacing: number = o.spacing ?? (o.two === true ? 0.0075 : 0.015);
    const child = (
      name: string,
      x: number,
      lean: number,
    ): IAutoMovieConstructionSplit.IChild => ({
      band: "band." + name,
      part: finger(name, x, lean, o.from ?? -0.012),
      partFace: name,
      partEnd: "bottom",
      rail: (o.compose === null ? 12 + RAIL : RAIL) / 1000,
      correspondence: "length",
      ...(o.cut !== undefined && name === "f.1" ? { cut: o.cut } : {}),
    });
    return {
      type: "split",
      name: "split.composed",
      host: o.host ?? through(o.lean),
      hostFace: "trunk",
      hostEnd: "top",
      seam: [-1, 1],
      ...(o.profile === undefined ? {} : { profile: o.profile }),
      ...(o.two === true ? {} : { outer: [{ seam: [-2.4, 2.4] }] }),
      count: COLUMNS,
      rows: 4,
      children:
        o.two === true
          ? [child("f.0", spacing, o.lean), child("f.2", -spacing, -o.lean)]
          : [
              child("f.0", spacing, o.lean),
              child("f.1", 0, 0),
              child("f.2", -spacing, -o.lean),
            ],
      ...(o.compose === null
        ? {}
        : {
            compose: o.compose ?? {
              frame: "host",
              plane: { point: [0, 0, 0], normal: [0, 0, 1] },
              round: 0.001,
            },
          }),
    };
  }

  /**
   * Realize a root; without its skin unless asked, since only the surfaces and
   * faces are read, and at a coarse chord, which only the skin depends on.
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

  /** The dot product. */
  export function dot(a: readonly number[], c: readonly number[]): number {
    return a[0]! * c[0]! + a[1]! * c[1]! + a[2]! * c[2]!;
  }

  /**
   * The minimum, smooth with the rounding 1 mm or plain, of plane distances at
   * a point; each plane a point and a kept normal, moved RAIL along an axis.
   */
  export function minimum(
    planes: [V3, V3][],
    axis: V3,
    p: readonly number[],
    smooth: boolean,
  ): number {
    const g: number[] = planes.map(([q, normal]: [V3, V3]): number =>
      dot(normal, [
        p[0]! - q[0] - RAIL * axis[0],
        p[1]! - q[1] - RAIL * axis[1],
        p[2]! - q[2] - RAIL * axis[2],
      ]),
    );
    return smooth
      ? -Math.log(
          g.reduce((sum: number, x: number): number => sum + Math.exp(-x), 0),
        )
      : Math.min(...g);
  }

  /** A child's residual in the three-way composition: `f.0` (0) or `f.1` (1). */
  export function residual(
    which: 0 | 1,
    lean: number,
    p: readonly number[],
    smooth: boolean = true,
  ): number {
    const [c2, s2]: [number, number] = [Math.cos(lean / 2), Math.sin(lean / 2)];
    const end: [V3, V3] = [
      [0, 0, -30],
      [0, 0, -1],
    ];
    return which === 0
      ? minimum(
          [
            end,
            [
              [fork(lean), 0, -30],
              [c2, 0, s2],
            ],
          ],
          [Math.sin(lean), 0, -Math.cos(lean)],
          p,
          smooth,
        )
      : minimum(
          [
            end,
            [
              [fork(lean), 0, -30],
              [-c2, 0, -s2],
            ],
            [
              [-fork(lean), 0, -30],
              [c2, 0, -s2],
            ],
          ],
          [0, 0, -1],
          p,
          smooth,
        );
  }

  /** Clocks at every column and midway between. */
  export function clocks(): number[] {
    return Array.from(
      { length: 2 * COLUMNS },
      (_: unknown, k: number): number => (TURN * k) / (2 * COLUMNS),
    );
  }

  /** A band's end edge at a clock, mm. */
  export function end(
    r: IAutoMovieConstructionRealization.IRealization,
    name: string,
    c: number,
  ): readonly number[] {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(r, name);
    return band.jet(band.domain![1], c).p;
  }

  /** A band's loop at its column k, mm. */
  export function loop(
    r: IAutoMovieConstructionRealization.IRealization,
    name: string,
    k: number,
  ): IAutoMovieSolidSurface.IJet {
    return ConstructionRead.surface(r, name).jet(0, (TURN * k) / COLUMNS);
  }
}
