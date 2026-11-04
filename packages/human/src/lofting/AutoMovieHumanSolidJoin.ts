import type { AutoMovieHumanLoftContract } from "./AutoMovieHumanLoftContract";
import { AutoMovieHumanSolidBlend } from "./AutoMovieHumanSolidBlend";
import { AutoMovieHumanSolidIntersection } from "./AutoMovieHumanSolidIntersection";
import { AutoMovieHumanSolidRail } from "./AutoMovieHumanSolidRail";
import { AutoMovieHumanSolidRibbon } from "./AutoMovieHumanSolidRibbon";
import { AutoMovieHumanSolidVector } from "./AutoMovieHumanSolidVector";
import type { IAutoMovieHumanSolidAtlas } from "./IAutoMovieHumanSolidAtlas";
import type { IAutoMovieHumanSolidSurface } from "./IAutoMovieHumanSolidSurface";

type Vec3 = AutoMovieHumanSolidVector.Vec3;
type IRibbon = AutoMovieHumanSolidRibbon.IRibbon;
const { combine, cross, dot, norm, sub } = AutoMovieHumanSolidVector;

/**
 * The composition the solid merge and the solid diff share: the intersection
 * curve, the two rails on the kept sides and the G2 blend between them, as
 * exact functions of the curve's parameter.
 *
 * Every evaluation at a curve parameter `t` (the part's phase, or the angle
 * about the footprint's axis; `AutoMovieHumanSolidIntersection.Parameter`)
 * corrects the curve there by Newton
 * (`AutoMovieHumanSolidIntersection.ICurve.at`), solves both rails from it
 * (`AutoMovieHumanSolidRail.at`) and reads both ribbons from the surfaces
 * (`AutoMovieHumanSolidRibbon.of`), so the blend is a smooth function of
 * `t` wherever the curve and the width laws are; nothing is interpolated
 * between traced points. The host's ribbon starts the blend (`w = 0`) leaving
 * the host past its rail toward the curve; the part's ends it (`w = 1`)
 * arriving along the part's offset direction on its kept side (its station
 * line under the phase parameter). Each ribbon's scale
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
    rail(t: number): AutoMovieHumanSolidRail.IRail | null;

    /** The blend column's two ribbons at a part phase, host first, or null where the rails fail. */
    column(t: number): IColumn | null;

    /** The host's rail as a chart loop `[y, theta]` at `count` uniform parameters from the seed's, or null where a rail fails between the traced points. */
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

    /** The host or base: one surface, or an atlas of the faces of a solid already merged (`IAutoMovieHumanSolidAtlas`). */
    host: IAutoMovieHumanSolidSurface | IAutoMovieHumanSolidAtlas;

    /** The intersection's seed, from the landmarks that locate the contact. */
    seed: AutoMovieHumanSolidIntersection.IInput["seed"];

    /**
     * The curve's parameter; absent, the part's phase. Under the angle
     * parameter the part's rail leaves the curve square to it in the part's
     * chart (`AutoMovieHumanSolidRail` mode `square`), so a part lying along
     * its host is trimmed round its footprint; the widths are then laws of the
     * angle.
     */
    parameter?: AutoMovieHumanSolidIntersection.Parameter;

    /** Traced points over one turn, at least 8. */
    count: number;

    /** Largest gap accepted on the curve, mm. */
    tolerance: number;

    /** Least angle between the tangent planes along the curve, radians. */
    grazing: number;

    /** Width laws in the curve's parameter: chords from the curve to each rail, mm, positive. */
    width: {
      /**
       * On the part: a chord per parameter, or `{ station }` (phase parameter only), the part's rail at
       * one station for every phase, where a lofted part's first own section
       * stands, beyond the curve's farthest reach along the part.
       */
      part: ((t: number) => number) | { station: number };

      /** On the host. */
      host(t: number): number;
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
    const host: IAutoMovieHumanSolidAtlas = AutoMovieHumanSolidIntersection.atlas(input.host);
    const fail = (contract: string, detail: string): IResult => {
      diagnostics.push({ producer, level: 6, contract, detail });
      return { join: null, diagnostics };
    };
    if (traced.curve === null) return { join: null, diagnostics };
    if (diagnostics.length !== 0) return { join: null, diagnostics };
    const curve: AutoMovieHumanSolidIntersection.ICurve = traced.curve;
    const period: number = 2 * Math.PI;
    const t0: number = curve.points[0]!.t;
    const mode: AutoMovieHumanSolidRail.Mode = input.parameter?.kind === "angle" ? "square" : "station";

    const rail = (t: number): AutoMovieHumanSolidRail.IRail | null => {
      const p: AutoMovieHumanSolidIntersection.IPoint | null = curve.at(t);
      return p === null ? null : AutoMovieHumanSolidRail.at(input.part, host, p, keep, typeof input.width.part === "function" ? input.width.part(t) : input.width.part, input.width.host(t), mode);
    };
    const column = (t: number): IColumn | null => {
      const r: AutoMovieHumanSolidRail.IRail | null = rail(t);
      return r === null ? null : ribbons(input.part, host.faces[r.hostFace]!, r);
    };
    const loop = (count: number): [number, number][] | null => {
      const out: [number, number][] = [];
      for (let i: number = 0; i < count; i++) {
        const r: AutoMovieHumanSolidRail.IRail | null = rail(t0 + (period * i) / count);
        if (r === null) return null;
        out.push(r.host);
      }
      return out;
    };

    // Every traced point carries both rails.
    const columns: IColumn[] = [];
    for (const p of curve.points) {
      const c: IColumn | null = column(p.t);
      if (c === null) return fail("rails", `no rail at t ${p.t} (host width ${input.width.host(p.t)} mm)`);
      const outside: string | null =
        AutoMovieHumanSolidIntersection.beyond(input.part, c.rail.s) ?? AutoMovieHumanSolidIntersection.beyond(host.faces[c.rail.hostFace]!, c.rail.host[0]);
      if (outside !== null) return fail("inside the layers", `the rails at t ${p.t}: ${outside}`);
      columns.push(c);
    }

    // The host's rail loop must stay simple in the chart (read where it
    // lies on one face; across faces each piece is clipped into its face).
    const single: boolean = columns.every((c: IColumn): boolean => c.rail.hostFace === columns[0]!.rail.hostFace);
    const crossing: string | null = !single ? null : crossed(
      columns.map((c: IColumn): [number, number] => c.rail.host),
      curve.winding === 0,
    );
    if (crossing !== null) return fail("simple rail", `the host's rail crosses itself ${crossing}; a width passes the rail's radius of curvature`);

    // The blend's normal must not reverse along a column.
    const step: number = period / (16 * curve.points.length);
    for (const c of columns) {
      const before: IColumn | null = column(c.rail.curve.t - step);
      const after: IColumn | null = column(c.rail.curve.t + step);
      if (before === null || after === null) return fail("rails", `no rail beside t ${c.rail.curve.t}`);
      let previous: Vec3 | null = null;
      for (let k: number = 0; k <= FOLD_SHARES; k++) {
        const w: number = k / FOLD_SHARES;
        const along: Vec3 = sub(
          AutoMovieHumanSolidBlend.jet(after.start, after.end, w).point,
          AutoMovieHumanSolidBlend.jet(before.start, before.end, w).point,
        );
        const n: Vec3 = cross(along, AutoMovieHumanSolidBlend.jet(c.start, c.end, w).first);
        if (previous !== null && !(dot(previous, n) > 0)) return fail("unfolded blend", `the blend's normal reverses at t ${c.rail.curve.t}, share ${w}`);
        previous = n;
      }
    }

    return { join: { curve, keep, continuity: "G2", rail, column, loop }, diagnostics };
  }

  /**
   * The two edge ribbons of a column from its rails.
   *
   * @param part The part.
   * @param host The host face the rail lies on.
   * @param rail The rails.
   * @returns The column.
   */
  function ribbons(part: IAutoMovieHumanSolidSurface, host: IAutoMovieHumanSolidSurface, rail: AutoMovieHumanSolidRail.IRail): IColumn {
    const chord: number = norm(sub(rail.partPoint, rail.hostPoint));
    const b: IAutoMovieHumanSolidSurface.IJet = host.jet(rail.host[0], rail.host[1]);
    const hostSpeed: number = norm(
      combine([
        [rail.across[0], b.u],
        [rail.across[1], b.v],
      ]),
    );
    const a: IAutoMovieHumanSolidSurface.IJet = part.jet(rail.s, rail.phi);
    const partSpeed: number = norm(
      combine([
        [rail.partAcross[0], a.u],
        [rail.partAcross[1], a.v],
      ]),
    );
    return {
      rail,
      start: AutoMovieHumanSolidRibbon.of(host, rail.host[0], rail.host[1], -rail.across[0], -rail.across[1], chord / hostSpeed),
      end: AutoMovieHumanSolidRibbon.of(part, rail.s, rail.phi, rail.partAcross[0], rail.partAcross[1], chord / partSpeed),
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
