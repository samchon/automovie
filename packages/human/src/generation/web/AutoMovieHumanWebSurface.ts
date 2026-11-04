import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";
import type { IAutoMovieHumanWebChild } from "./IAutoMovieHumanWebChild";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";
import type { IAutoMovieHumanWebSurface } from "./IAutoMovieHumanWebSurface";
import { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";
import { AutoMovieHumanSeam } from "../../lofting/AutoMovieHumanSeam";
import { AutoMovieHumanWebCurve } from "./AutoMovieHumanWebCurve";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, plus: add, scale, dot, norm }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { sampled }: typeof AutoMovieHumanWebCurve = AutoMovieHumanWebCurve;

/**
 * The third stage of a web's build: the surface's laws. Near a web a column's
 * level and its distance along the ring from the pinch are the chart `z = x +
 * i y` of the saddle at the crest, the branch point `w = sqrt(z)`; the column
 * there is the translational surface of the web's separatrices, `F(u, v) =
 * D(u) + lip(v) - S`. Away from the webs a column is the quintic Hermite of
 * the parent's and child's copied station jets, G2 with both. The rows' levels
 * close on the crest as the square of the row.
 */
export namespace AutoMovieHumanWebSurface {
  /** Rows below a crest over which its levels close as the square of the row. */
  const CREST_ROWS: number = 2;

  /** The surface's laws for a count of rows.
   *
   * @param rows Rows from the parent's ring to the children's sections.
   * @param crestRow The row of the crests. */
  export function of(rows: number, crestRow: number): IAutoMovieHumanWebSurface {
    // A row's level in the chart: -1 at the ring, 0 at the crests, and a
    // child's own column's depth over the margin's radius at its section.
    // The levels close on the crest as the square of the row, so the rows run
    // evenly in the chart's `w = sqrt(z)` along the separatrices, where even
    // levels would stretch the cells about the crest by the square root. Below
    // the crest's first rows they run on evenly in depth, or the last row
    // before a child's section would span a fifth of the web.
    const levelOf = (r: number, own: IAutoMovieHumanWebChild, web: IAutoMovieHumanWeb): number =>
      r <= crestRow ? -((1 - r / crestRow) ** 2) : (own.depth / web.rho) * lower(r);
    const ramp: number = CREST_ROWS / (rows - crestRow);
    const lower = (r: number): number => {
      const t: number = (r - crestRow) / (rows - crestRow);
      return (Math.hypot(t, ramp) - ramp) / (Math.hypot(1, ramp) - ramp);
    };

    // The row at a level, the inverse of `levelOf`: above the crest from the
    // square law, below it from the hyperbolic spacing.
    const rowOf = (x: number, own: IAutoMovieHumanWebChild, web: IAutoMovieHumanWeb): number => {
      if (x <= 0) return crestRow * (1 - Math.sqrt(Math.min(1, -x)));
      const top: number = Math.hypot(1, ramp) - ramp;
      const reach: number = ((x * web.rho) / own.depth) * top + ramp;

      return crestRow + (rows - crestRow) * Math.sqrt(Math.max(0, reach * reach - ramp * ramp));
    };

    // A margin's lip at a depth past the ring, as a share of its radius; past
    // the pinch above the ring for a share below zero.
    const lip = (web: IAutoMovieHumanWeb, side: number, share: number): Vec3 => {
      const theta: number = Math.asin(Math.min(1, Math.max(-1, share)));
      return add(
        scale(add(web.A, web.B), 0.5),
        add(scale(web.xi, side * web.rho * Math.cos(theta)), scale(web.ea, web.rho * Math.sin(theta))),
      );
    };

    // A column near a web: the translational surface of the web's two
    // separatrices met at its crest, `F(u, v) = D(u) + lip(v) - S`, at
    // `w = u + i v = sqrt(x + i y)`. Near the crest that is the saddle
    // `S + alpha u E_eta + beta v E_xi + rho (u^2 - v^2) E_a`, and on its axes
    // it is the separatrices themselves; its ends are moved onto the column's
    // own ring vertex and arrival in proportion to the level.
    // A column's end levels and their points are the same for every row, so
    // they are read once per column and child.
    const ends: WeakMap<object, WeakMap<object, IEnds>> = new WeakMap();
    const chart = (col: Extract<IAutoMovieHumanWebColumn, { kind: "plain" }>, own: IAutoMovieHumanWebChild, r: number): Vec3 => {
      const at = (x: number): Vec3 => {
        const h: number = Math.hypot(x, col.y);
        const u: number = Math.sqrt(Math.max(0, (h + x) / 2));
        const v: number = Math.sign(col.side) * Math.sqrt(Math.max(0, (h - x) / 2));
        return add(sub(own.own(col.web.rho * u * u), col.web.S), lip(col.web, Math.sign(v) || col.side, 1 - v * v));
      };
      let byChild: WeakMap<object, IEnds> | undefined = ends.get(col);
      if (byChild === undefined) ends.set(col, (byChild = new WeakMap()));
      let end: IEnds | undefined = byChild.get(own);
      if (end === undefined) {
        const first: number = levelOf(0, own, col.web);
        const last: number = levelOf(rows, own, col.web);
        end = { top: first, bottom: last, atTop: at(first), atBottom: at(last) };
        byChild.set(own, end);
      }
      const { top, bottom, atTop, atBottom }: IEnds = end;
      const x: number = levelOf(r, own, col.web);
      const f: number = (x - top) / (bottom - top);
      return add(
        at(x),
        add(scale(sub(col.p, atTop), 1 - f), scale(sub(col.q, atBottom), f)),
      );
    };

    // A column away from the webs: the Hermite from the parent's surface to
    // the child's, its rows at the same depths as the chart's levels.
    const plainAt = (col: Extract<IAutoMovieHumanWebColumn, { kind: "plain" }>): ((r: number) => Vec3) => {
      const L: number = norm(sub(col.q, col.p));
      // The quintic Hermite between the two pieces' copied jets at the
      // column's own speed L: it meets the parent's ring and the child's
      // section with their station curves' tangent and curvature, so neither
      // end is a crease ring (G2; a cubic matched tangents only).
      const [, o1, o2] = AutoMovieHumanSeam.adopt(col.from, L);
      const [, d1, d2] = AutoMovieHumanSeam.adopt(col.to, L);
      const curve = sampled(
        (u: number): Vec3 => AutoMovieHumanSeam.quintic([col.p, o1, o2], [col.q, d1, d2], 1, u) as Vec3,
        col.o,
      );
      const total: number = dot(sub(col.q, col.p), col.o);
      const crest: number = Math.min(col.rho, (total * crestRow) / rows);
      return (r: number): Vec3 =>
        curve(
          r <= crestRow
            ? crest * (1 - (1 - r / crestRow) ** 2)
            : crest + (total - crest) * lower(r),
        );
    };

    return { levelOf, rowOf, lip, chart, plainAt };
  }
}

/** A web column's end levels and its chart's points there. */
interface IEnds {
  /** Level of the column's first row. */
  top: number;

  /** Level of its last row. */
  bottom: number;

  /** The chart's point at the first row's level. */
  atTop: Vec3;

  /** The chart's point at the last row's level. */
  atBottom: Vec3;
}
