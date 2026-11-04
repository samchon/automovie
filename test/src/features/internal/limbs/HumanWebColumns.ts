import { AutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanConstructionPath } from "../../../../../packages/human/src/generation/IAutoMovieHumanConstructionPath";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyVector } from "../HumanAnatomyVector";

type V3 = [number, number, number];
type IRow = HumanAnatomyAudit.IRow;
const V: typeof HumanAnatomyVector = HumanAnatomyVector;

/**
 * The webs between a parent and its digits (registry seams "foot to toes,
 * toe webs" and "hand to fingers, finger webs"), read on the columns the web
 * mesh publishes (`<child>/web-column-<v>`, from the parent's end ring to the
 * child's first own section, one point per row).
 *
 * A web is a ruled surface between two rings: its columns keep the cyclic
 * order of their arrivals round the child's axis at every row, and no two
 * neighbours close up to a fold (WEB-1); each column arrives on the child's
 * own section, the seam's G0 the child owns (WEB-2).
 */
export namespace HumanWebColumns {
  /** Least share of its arrival spacing two neighbouring columns keep at any row (modeler 3's declared fold limit). */
  export const SPACING: number = 0.05;

  /** Largest distance of a column's arrival from the child's section, mm: the section is copied, so only rounding remains. */
  export const ARRIVAL: number = 0.01;

  /** One child's columns, in path order. */
  export interface IWeb {
    /** The child chain. */
    child: string;

    /** Each column's points, parent ring first. */
    columns: V3[][];
  }

  /** Every web of a construction, grouped by child. */
  export function webs(paths: readonly IAutoMovieHumanConstructionPath[]): IWeb[] {
    const by: Map<string, V3[][]> = new Map();
    for (const p of paths) {
      const m: RegExpMatchArray | null = p.id.match(/^(.+)\/web-column-\d+$/);
      if (m === null) continue;
      by.set(m[1]!, [...(by.get(m[1]!) ?? []), p.points]);
    }
    return [...by].map(([child, columns]: [string, V3[][]]): IWeb => ({ child, columns }));
  }

  /**
   * The fold rows of one web: order reversals at any row against the
   * arrivals' cyclic order, and the least neighbour spacing over its arrival.
   */
  export function fold(person: string, web: IWeb): IRow[] {
    const rows: number = Math.min(...web.columns.map((c: V3[]): number => c.length));
    const equal: boolean = web.columns.every((c: V3[]): boolean => c.length === rows);
    const first: V3 = centroid(web.columns.map((c: V3[]): V3 => c[0]!));
    const last: V3 = centroid(web.columns.map((c: V3[]): V3 => c[c.length - 1]!));
    const axis: V3 = V.unit(V.sub(last, first));
    const [u, w]: [V3, V3] = basis(axis);
    const angle: (p: V3, c: V3) => number = (p: V3, c: V3): number => Math.atan2(V.dot(V.sub(p, c), w), V.dot(V.sub(p, c), u));

    // The arrivals' cyclic order.
    const order: number[] = web.columns.map((_: V3[], i: number): number => i).sort((a: number, b: number): number => angle(web.columns[a]![web.columns[a]!.length - 1]!, last) - angle(web.columns[b]![web.columns[b]!.length - 1]!, last));
    let reversals: number = 0;
    let where: string = "";
    let least: number = Infinity;
    for (let r: number = 0; r < rows; r++) {
      const points: V3[] = order.map((i: number): V3 => web.columns[i]![r]!);
      const c: V3 = centroid(points);
      let turn: number = 0;
      for (let k: number = 0; k < points.length; k++) {
        const a: V3 = points[k]!;
        const b: V3 = points[(k + 1) % points.length]!;
        let d: number = angle(b, c) - angle(a, c);
        while (d <= -Math.PI) d += 2 * Math.PI;
        while (d > Math.PI) d -= 2 * Math.PI;
        if (d <= 0) {
          reversals++;
          if (where === "") where = `row ${r} columns ${order[k]} and ${order[(k + 1) % points.length]}`;
        }
        turn += d;
        const arrival: number = V.dist(web.columns[order[k]!]![web.columns[order[k]!]!.length - 1]!, web.columns[order[(k + 1) % points.length]!]![web.columns[order[(k + 1) % points.length]!]!.length - 1]!);
        if (arrival > 0) least = Math.min(least, V.dist(a, b) / arrival);
      }
      if (Math.abs(turn - 2 * Math.PI) > 1e-6 && where === "") where = `row ${r} winds ${(turn / (2 * Math.PI)).toFixed(2)} times`;
      if (Math.abs(turn - 2 * Math.PI) > 1e-6) reversals++;
    }
    return [
      { person, site: `${web.child} web columns (WEB-1): order reversals against the arrivals' order${equal ? "" : ", unequal row counts"}${where === "" ? "" : `, first at ${where}`}`, value: reversals + (equal ? 0 : 1), low: 0, high: 0, unit: "count" },
      { person, site: `${web.child} web columns (WEB-1): least neighbour spacing over its arrival spacing`, value: least, low: SPACING, high: Infinity, unit: "ratio" },
    ];
  }

  /**
   * The arrival row of one web: the largest distance of a column's last point
   * from the child's nearer end section (`AutoMovieHumanLoftChain.sampler`).
   */
  export function arrival(person: string, web: IWeb, child: IAutoMovieHumanLoftChain): IRow {
    const ends: number[] = [child.layers[0]!.y, child.layers[child.layers.length - 1]!.y];
    const sections: V3[][] = ends.map((y: number): V3[] => {
      const f: (t: number) => V3 = AutoMovieHumanLoftChain.sampler(child, y);
      return Array.from({ length: 1440 }, (_: unknown, i: number): V3 => f(i / 1440));
    });
    let worst: number = 0;
    for (const c of web.columns) {
      const p: V3 = c[c.length - 1]!;
      worst = Math.max(worst, Math.min(...sections.map((s: V3[]): number => polyline(p, s))));
    }
    return { person, site: `${web.child} web columns (WEB-2): largest distance of an arrival from the child's own section, mm`, value: worst, low: -Infinity, high: ARRIVAL, unit: "mm" };
  }

  /** Distance from a point to a closed polyline. */
  function polyline(p: V3, s: readonly V3[]): number {
    let best: number = Infinity;
    for (let i: number = 0; i < s.length; i++) {
      const a: V3 = s[i]!;
      const b: V3 = s[(i + 1) % s.length]!;
      const e: V3 = V.sub(b, a);
      const L: number = V.dot(e, e);
      const t: number = L === 0 ? 0 : Math.max(0, Math.min(1, V.dot(V.sub(p, a), e) / L));
      best = Math.min(best, V.dist(p, V.add(a, V.scale(e, t))));
    }
    return best;
  }

  /** The mean of points. */
  function centroid(points: readonly V3[]): V3 {
    const c: V3 = [0, 0, 0];
    for (const p of points) for (let k: number = 0; k < 3; k++) c[k] += p[k]! / points.length;
    return c;
  }

  /** Two unit vectors normal to an axis and to each other. */
  function basis(axis: V3): [V3, V3] {
    const seed: V3 = Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    const u: V3 = V.unit(V.sub(seed, V.scale(axis, V.dot(seed, axis))));
    return [u, V.cross(axis, u)];
  }
}
