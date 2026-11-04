import type { AutoMovieHumanLoftContract } from "./AutoMovieHumanLoftContract";
import { AutoMovieHumanSolidBlend } from "./AutoMovieHumanSolidBlend";
import { AutoMovieHumanSolidIntersection } from "./AutoMovieHumanSolidIntersection";
import { AutoMovieHumanSolidRail } from "./AutoMovieHumanSolidRail";
import { AutoMovieHumanSolidRibbon } from "./AutoMovieHumanSolidRibbon";
import { AutoMovieHumanSolidVector } from "./AutoMovieHumanSolidVector";
import type { IAutoMovieHumanSolidSurface } from "./IAutoMovieHumanSolidSurface";

type Vec3 = AutoMovieHumanSolidVector.Vec3;
type IRibbon = AutoMovieHumanSolidRibbon.IRibbon;
const { combine, cross, dot, norm, sub } = AutoMovieHumanSolidVector;

/**
 * The composition the solid merge and the solid diff share: the intersection
 * curve, the two rails on the kept sides and the G2 blend between them, as
 * exact functions of the part's phase.
 *
 * Every evaluation at a part phase `phi` corrects the curve there by Newton
 * (`AutoMovieHumanSolidIntersection.ICurve.at`), solves both rails from it
 * (`AutoMovieHumanSolidRail.at`) and reads both ribbons from the surfaces
 * (`AutoMovieHumanSolidRibbon.of`), so the blend is a smooth function of
 * `phi` wherever the curve and the width laws are; nothing is interpolated
 * between traced points. The host's ribbon starts the blend (`w = 0`) leaving
 * the host past its rail toward the curve; the part's ends it (`w = 1`)
 * arriving along the part's station line on its kept side. Each ribbon's scale
 * is the chord between the rails over its cross derivative's length (as
 * `AutoMovieHumanLimbRootStrip`), so the column runs at chord speed at both
 * ends.
 *
 * The owner publishes the rails once: the host's as a loop in its chart (its
 * trim), the part's as its first station per phase (its untrimmed start), and
 * the blend's edge columns are those same points, so host, blend and part are
 * tessellated from shared points.
 *
 * Checks, each a diagnostic and a null join: the curve traces one closed loop
 * transversally; every traced point has both rails, each inside its surface's
 * declared domain (a chain's layers); the host's rail loop does
 * not cross itself in the chart (a width past the rail's radius of curvature
 * folds it); the blend's normal does not reverse along any column (a fold of
 * the blend between the rails).
 */
export namespace AutoMovieHumanSolidJoin {
  /** A composed join. */
  export interface IJoin {
    /** The intersection curve. */
    curve: AutoMovieHumanSolidIntersection.ICurve;

    /** Which side of the host the part keeps. */
    keep: AutoMovieHumanSolidRail.Keep;

    /**
     * The continuity the merged skin keeps across both rails: G2, because the
     * blend copies each surface's whole parametric 2-jet along its rail
     * (`AutoMovieHumanSolidBlend`).
     */
    continuity: "G2";

    /** The rails at a part phase, or null where a solve fails there. */
    rail(phi: number): AutoMovieHumanSolidRail.IRail | null;

    /** The blend column's two ribbons at a part phase, host first, or null where the rails fail. */
    column(phi: number): IColumn | null;

    /** The host's rail as a chart loop `[y, theta]` at `count` uniform part phases from the seed, or null where a rail fails between the traced points. */
    loop(count: number): [number, number][] | null;
  }

  /** The blend's two edge ribbons at one part phase. */
  export interface IColumn {
    /** The rails it runs between. */
    rail: AutoMovieHumanSolidRail.IRail;

    /** The host's ribbon, `w = 0`. */
    start: IRibbon;

    /** The part's ribbon, `w = 1`. */
    end: IRibbon;
  }

  /** What a join needs. */
  export interface IInput {
    /** The attached part or cutter, `v` periodic. */
    part: IAutoMovieHumanSolidSurface;

    /** The host or base. */
    host: IAutoMovieHumanSolidSurface;

    /** The intersection's seed, from the landmarks that locate the contact. */
    seed: AutoMovieHumanSolidIntersection.IInput["seed"];

    /** Traced points over one turn, at least 8. */
    count: number;

    /** Largest gap accepted on the curve, mm. */
    tolerance: number;

    /** Least angle between the tangent planes along the curve, radians. */
    grazing: number;

    /** Width laws in the part's phase: chords from the curve to each rail, mm, positive. */
    width: {
      /**
       * On the part: a chord per phase, or `{ station }`, the part's rail at
       * one station for every phase, where a lofted part's first own section
       * stands, beyond the curve's farthest reach along the part.
       */
      part: ((phi: number) => number) | { station: number };

      /** On the host. */
      host(phi: number): number;
    };
  }

  /** A join's result. */
  export interface IResult {
    /** The join, or null when a check fails. */
    join: IJoin | null;

    /** Every broken premise. */
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[];
  }

  /** Shares of each column read by the fold check. */
  export const FOLD_SHARES: number = 8;

  /**
   * Compose a join.
   *
   * @param input The surfaces, seed, limits and width laws.
   * @param keep `outside` for a merge, `inside` for a diff.
   * @returns The join and its diagnostics.
   */
  export function create(input: IInput, keep: AutoMovieHumanSolidRail.Keep): IResult {
    const traced: AutoMovieHumanSolidIntersection.IResult = AutoMovieHumanSolidIntersection.trace(input);
    const diagnostics: AutoMovieHumanLoftContract.IDiagnostic[] = [...traced.diagnostics];
    const producer: string = `solid.join.${input.part.name}.${input.host.name}`;
    const fail = (contract: string, detail: string): IResult => {
      diagnostics.push({ producer, level: 6, contract, detail });
      return { join: null, diagnostics };
    };
    if (traced.curve === null) return { join: null, diagnostics };
    if (diagnostics.length !== 0) return { join: null, diagnostics };
    const curve: AutoMovieHumanSolidIntersection.ICurve = traced.curve;
    const period: number = input.part.period!;

    const rail = (phi: number): AutoMovieHumanSolidRail.IRail | null => {
      const p: AutoMovieHumanSolidIntersection.IPoint | null = curve.at(phi);
      return p === null ? null : AutoMovieHumanSolidRail.at(input.part, input.host, p, keep, typeof input.width.part === "function" ? input.width.part(phi) : input.width.part, input.width.host(phi));
    };
    const column = (phi: number): IColumn | null => {
      const r: AutoMovieHumanSolidRail.IRail | null = rail(phi);
      return r === null ? null : ribbons(input, r);
    };
    const loop = (count: number): [number, number][] | null => {
      const out: [number, number][] = [];
      for (let i: number = 0; i < count; i++) {
        const r: AutoMovieHumanSolidRail.IRail | null = rail(input.seed.phi + (period * i) / count);
        if (r === null) return null;
        out.push(r.host);
      }
      return out;
    };

    // Every traced point carries both rails.
    const columns: IColumn[] = [];
    for (const p of curve.points) {
      const c: IColumn | null = column(p.phi);
      if (c === null) return fail("rails", `no rail at phi ${p.phi} (host width ${input.width.host(p.phi)} mm)`);
      const outside: string | null =
        AutoMovieHumanSolidIntersection.beyond(input.part, c.rail.s) ?? AutoMovieHumanSolidIntersection.beyond(input.host, c.rail.host[0]);
      if (outside !== null) return fail("inside the layers", `the rails at phi ${p.phi}: ${outside}`);
      columns.push(c);
    }

    // The host's rail loop must stay simple in the chart.
    const crossing: string | null = crossed(
      columns.map((c: IColumn): [number, number] => c.rail.host),
      curve.winding === 0,
    );
    if (crossing !== null) return fail("simple rail", `the host's rail crosses itself ${crossing}; a width passes the rail's radius of curvature`);

    // The blend's normal must not reverse along a column.
    const step: number = period / (16 * curve.points.length);
    for (const c of columns) {
      const before: IColumn | null = column(c.rail.curve.phi - step);
      const after: IColumn | null = column(c.rail.curve.phi + step);
      if (before === null || after === null) return fail("rails", `no rail beside phi ${c.rail.curve.phi}`);
      let previous: Vec3 | null = null;
      for (let k: number = 0; k <= FOLD_SHARES; k++) {
        const w: number = k / FOLD_SHARES;
        const along: Vec3 = sub(
          AutoMovieHumanSolidBlend.jet(after.start, after.end, w).point,
          AutoMovieHumanSolidBlend.jet(before.start, before.end, w).point,
        );
        const n: Vec3 = cross(along, AutoMovieHumanSolidBlend.jet(c.start, c.end, w).first);
        if (previous !== null && !(dot(previous, n) > 0)) return fail("unfolded blend", `the blend's normal reverses at phi ${c.rail.curve.phi}, share ${w}`);
        previous = n;
      }
    }

    return { join: { curve, keep, continuity: "G2", rail, column, loop }, diagnostics };
  }

  /**
   * The two edge ribbons of a column from its rails.
   *
   * @param input The surfaces.
   * @param rail The rails.
   * @returns The column.
   */
  function ribbons(input: IInput, rail: AutoMovieHumanSolidRail.IRail): IColumn {
    const chord: number = norm(sub(rail.partPoint, rail.hostPoint));
    const b: IAutoMovieHumanSolidSurface.IJet = input.host.jet(rail.host[0], rail.host[1]);
    const hostSpeed: number = norm(
      combine([
        [rail.across[0], b.u],
        [rail.across[1], b.v],
      ]),
    );
    const partSpeed: number = norm(input.part.jet(rail.s, rail.curve.phi).u);
    return {
      rail,
      start: AutoMovieHumanSolidRibbon.of(input.host, rail.host[0], rail.host[1], -rail.across[0], -rail.across[1], chord / hostSpeed),
      end: AutoMovieHumanSolidRibbon.of(input.part, rail.s, rail.curve.phi, rail.sigma, 0, chord / partSpeed),
    };
  }

  /**
   * Where a closed chart polygon crosses itself, if it does: every pair of
   * non-adjacent edges tested by the signs of their orientations. The
   * polygon's points number the traced points, so the quadratic scan is the
   * trace's own size.
   *
   * @param points The polygon, in order.
   * @param closed Whether its last point joins its first: false for a loop
   *   that winds round the host's periodic phase, whose chart points run
   *   once across the period instead of enclosing a region.
   * @returns A description of the first crossing, or null when simple.
   */
  function crossed(points: readonly [number, number][], closed: boolean): string | null {
    const n: number = points.length;
    const edges: number = closed ? n : n - 1;
    const turn = (a: readonly [number, number], b: readonly [number, number], c: readonly [number, number]): number =>
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    for (let i: number = 0; i < edges; i++) {
      const a: [number, number] = points[i]!;
      const b: [number, number] = points[(i + 1) % n]!;
      for (let j: number = i + 2; j < edges; j++) {
        if (closed && i === 0 && j === n - 1) continue;
        const c: [number, number] = points[j]!;
        const d: [number, number] = points[(j + 1) % n]!;
        if (turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0) return `between edges ${i} and ${j}`;
      }
    }
    return null;
  }
}
