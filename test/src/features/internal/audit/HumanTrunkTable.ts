import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanAnatomyVector } from "../HumanAnatomyVector";

type IRow = HumanAnatomyAudit.IRow;
type P2 = [number, number];

/**
 * The anatomy table's trunk rows, read on the finished curves: the trunk's
 * base chain together with every part and blend merged onto it (the breasts,
 * the gluteal masses), cut by horizontal planes at the trunk's landmark
 * levels. Each row names its source; a reading is a function of the cut's
 * points only, so a made trunk proves every row.
 *
 * Depth is a section's extent along `x` (forward), breadth along `z`; a
 * girth is the taut tape, the perimeter of the section's convex hull, which
 * the inner, trimmed-away parts of a merged base cannot change.
 */
export namespace HumanTrunkTable {
  /** What the rows read of one trunk, in the input's millimetres. */
  export interface IReading {
    /** Landmark heights above the floor, mm. */
    levels: { buttock: number; waist: number; fold: number; bust: number; cervicale: number };

    /**
     * The section's points `[x, z]` at a height: of the whole merged trunk,
     * or of its base alone (the chest wall without the breasts).
     */
    cut: (y: number, base: boolean) => P2[];

    /** Whether the trunk carries merged breasts. */
    breasts: boolean;
  }

  /** The profiles' height step, mm. */
  export const STEP: number = 2;

  /** Half-width of the median strip the back profile is read in, mm. */
  export const STRIP: number = 5;

  /**
   * Least sagitta of a spinal curve, mm: the profile's 2 mm station step, the
   * smallest curve the reading resolves (`HumanAnatomySpine.FLOOR`).
   */
  export const SPINE: number = 2;

  /** Every trunk row of one trunk. */
  export function rows(person: string, t: IReading): IRow[] {
    const out: IRow[] = [];
    const row: (site: string, value: number, low: number, high: number, unit: string) => void = (site: string, value: number, low: number, high: number, unit: string): void => {
      out.push({ person, site: `trunk ${site}`, value, low, high, unit });
    };
    const box: (points: P2[]) => [number, number, number, number] = (points: P2[]): [number, number, number, number] => [
      Math.max(...points.map((p: P2): number => p[0])),
      Math.min(...points.map((p: P2): number => p[0])),
      Math.max(...points.map((p: P2): number => p[1])),
      Math.min(...points.map((p: P2): number => p[1])),
    ];
    const ratio: (y: number) => number = (y: number): number => {
      const b: [number, number, number, number] = box(t.cut(y, false));
      return (b[0] - b[1]) / (b[2] - b[3]);
    };

    // ANSUR II shape ratios, each sex's mean plus and minus 2.326 SD, both sexes' union (`ansur-ii-trunk-ratios.md`).
    row("chest depth over breadth at the chest point's level, ANSUR II (TR-1)", ratio(t.levels.bust), 0.702, 1.095, "");
    row("waist depth over breadth at the natural waist, ANSUR II (TR-2)", ratio(t.levels.waist), 0.576, 0.853, "");
    row("buttock depth over hip breadth at the buttocks' level, ANSUR II (TR-3)", ratio(t.levels.buttock), 0.548, 0.827, "");

    // The breasts stand on the chest wall: the bust projects forward of the chest wall's front.
    if (t.breasts) row("bust's forward reach past the chest wall at the chest point's level (TR-4)", box(t.cut(t.levels.bust, false))[0] - box(t.cut(t.levels.bust, true))[0], 1e-9, Infinity, "mm");

    // The natural waist is by definition the least girth between the lowest rib and the iliac crest (consistency.md T3 to T5).
    const girth: (y: number) => number = (y: number): number => HumanAnatomyVector.hull(t.cut(y, false));
    let least: number = Infinity;
    for (let y: number = t.levels.buttock; y <= t.levels.fold; y += STEP) least = Math.min(least, girth(y));
    row("least girth between the hip and the underbust less the natural waist's girth (TR-5)", least - girth(t.levels.waist), -HumanAnatomyShared.LARGE, Infinity, "mm");

    // The lumbar curve is convex forward and the thoracic concave forward (Gray 1918, `gray-1918-vertebral-curves.md`), the median back skin following them.
    const back: (y: number) => number = (y: number): number => {
      const xs: number[] = t.cut(y, false).filter((p: P2): boolean => Math.abs(p[1]) <= STRIP).map((p: P2): number => p[0]);
      return xs.length === 0 ? NaN : Math.min(...xs);
    };
    const thoracic: { y: number; x: number } = extreme(back, t.levels.waist, t.levels.cervicale, -1);
    const sacrum: { y: number; x: number } = { y: t.levels.buttock, x: back(t.levels.buttock) };
    const lumbar: { y: number; x: number } = extreme(back, t.levels.buttock, thoracic.y, 1);
    const cervicale: { y: number; x: number } = { y: t.levels.cervicale, x: back(t.levels.cervicale) };
    row("lumbar apex in front of the chord from the sacrum to the thoracic apex, lordosis (TR-6)", lumbar.x - chord(sacrum, thoracic, lumbar.y), SPINE, Infinity, "mm");
    row("thoracic apex behind the chord from the lumbar apex to cervicale, kyphosis (TR-7)", chord(lumbar, cervicale, thoracic.y) - thoracic.x, SPINE, Infinity, "mm");
    return out;
  }

  /**
   * The finished trunk of a body as a reading: its `trunk` chain and every
   * part and blend merged onto it (`IAutoMovieHumanBodyCalibration.merges`),
   * each sampled on a 1 mm by 96-phase grid in the input's millimetres and
   * cut at a height where its grid edges cross the plane.
   *
   * @throws {Error} When the body carries no trunk chain or no trunk landmarks.
   */
  export function reading(body: IAutoMovieHumanBodyCalibration, k: number): IReading {
    const base: IAutoMovieHumanLoftChain | undefined = body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk");
    if (base === undefined || body.trunk === undefined) throw new Error("the body carries no trunk chain or trunk landmarks");
    const names: Set<string> = new Set(["trunk"]);
    for (const m of body.merges ?? []) if (m.host === "trunk" || (m.hostChains ?? []).includes("trunk")) [m.part, m.blend].forEach((n: string): void => void names.add(n));
    const grids: { base: boolean; grid: [number, number, number][][] }[] = body.chains
      .filter((c: IAutoMovieHumanLoftChain): boolean => names.has(c.name))
      .map((c: IAutoMovieHumanLoftChain): { base: boolean; grid: [number, number, number][][] } => ({ base: c === base, grid: grid(c, k) }));
    const l: NonNullable<IAutoMovieHumanBodyCalibration["trunk"]> = body.trunk;
    return {
      levels: { buttock: l.buttock * k, waist: l.waist * k, fold: l.fold * k, bust: l.bust * k, cervicale: l.cervicale * k },
      breasts: [...names].some((n: string): boolean => n.startsWith("breast.")),
      cut: (y: number, onlyBase: boolean): P2[] => grids.filter((g: { base: boolean }): boolean => !onlyBase || g.base).flatMap((g: { grid: [number, number, number][][] }): P2[] => march(g.grid, y)),
    };
  }

  /** A chain's points on a 1 mm station by 96-phase grid, in the input's millimetres. */
  function grid(c: IAutoMovieHumanLoftChain, k: number): [number, number, number][][] {
    const first: number = c.layers[0]!.y;
    const last: number = c.layers[c.layers.length - 1]!.y;
    const count: number = Math.max(1, Math.round((last - first) * k));
    const phases: number[] = Array.from({ length: 96 }, (_: unknown, j: number): number => (2 * Math.PI * j) / 96);
    return Array.from({ length: count + 1 }, (_: unknown, i: number): [number, number, number][] =>
      AutoMovieHumanLoftChain.ring(c, first + ((last - first) * i) / count, phases).map((p: [number, number, number]): [number, number, number] => [p[0] * k, p[1] * k, p[2] * k]),
    );
  }

  /** Where a grid's edges cross the level `y`, each crossing interpolated along its edge, as `[x, z]`. */
  function march(g: [number, number, number][][], y: number): P2[] {
    const out: P2[] = [];
    const edge: (a: [number, number, number], b: [number, number, number]) => void = (a: [number, number, number], b: [number, number, number]): void => {
      if ((a[1] - y) * (b[1] - y) > 0 || a[1] === b[1]) return;
      const f: number = (y - a[1]) / (b[1] - a[1]);
      out.push([a[0] + f * (b[0] - a[0]), a[2] + f * (b[2] - a[2])]);
    };
    for (let i: number = 0; i < g.length; i++)
      for (let j: number = 0; j < g[i]!.length; j++) {
        if (i + 1 < g.length) edge(g[i]![j]!, g[i + 1]![j]!);
        edge(g[i]![j]!, g[i]![(j + 1) % g[i]!.length]!);
      }
    return out;
  }

  /** The most anterior (`sign` 1) or posterior (`sign` -1) back point between two heights. */
  function extreme(back: (y: number) => number, lo: number, hi: number, sign: 1 | -1): { y: number; x: number } {
    let best: { y: number; x: number } = { y: NaN, x: NaN };
    for (let y: number = Math.min(lo, hi); y <= Math.max(lo, hi); y += STEP) {
      const x: number = back(y);
      if (Number.isFinite(x) && (!Number.isFinite(best.x) || sign * x > sign * best.x)) best = { y, x };
    }
    return best;
  }

  /** The chord's `x` at a height between two back points. */
  function chord(a: { y: number; x: number }, b: { y: number; x: number }, y: number): number {
    return a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
  }
}
