import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain, AutoMovieViewChain as Q, AutoMovieViewLoft, type IAutoMovieViewPart } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H, AutoMovieHumanConicSection as S, AutoMovieHumanF1 } from "@automovie/human";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicNearest as D } from "./FamilyConicNearest";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * Where a stored piece's fields leave the flow of their own knots, and whether laying them again from their neighbours brings the skin the
 * figure shows of that piece nearer the reference (#3412, wrap-up: "smooth the minor defects by comparing neighbouring coordinates and
 * curves").
 *
 * Every stored piece is read: each family the figure sews (`AutoMovieHumanF1.FAMILIES`) and each cutter it cuts out of the skin
 * (`AutoMovieHumanF1.CUTTERS`). Each field at each interior knot is compared with its leave-one-out value: the natural cubic through the
 * field's other knots evaluated at that knot (`FamilyConicFit.resample`), the law `FamilyConicBody.ts --relay` and `--relay-stored` lay a
 * broken value again by, so a relay reproduces it exactly. A knot is flagged where its difference exceeds both `OUTLIER` times the field's
 * median absolute difference and a floor (`FLOOR`); adjacent flagged knots of a field are one group, laid from the knots outside it.
 *
 * Each group is then judged on the skin the whole-figure gate judges (`FamilyConicDeviation.ts --owners`), by the gate's own measure:
 *
 * - The piece is lofted as the figure lofts it, reliefs and closed ends included, on the stations of the figure's own source of it
 *   (`AutoMovieHumanF1.construction().sources`), and its skin sampled on a chart grid, `STEP_MM` along the station and as finely round.
 * - Each sample's miss is its signed distance to the nearest reference triangle (`FamilyConicNearest`), the gate's distance.
 * - A sample is kept only where the gate's round (`--round=<deviation directory>`, its `owners.json`) lists the piece as an owner of the
 *   sample's cell, and the sample's station and phase lie inside the chart ranges the piece holds there: skin outside every owned cell is
 *   another owner's, a port's, a band's, a cutter's, or nobody's. The twin of a mirrored piece is its reflection, read on the stored side.
 * - Before and after the relay, over the group's span, the kept samples' largest, 99th percentile and mean miss, those past 1 mm, the
 *   stations whose realized ring crosses itself and those the section model refuses; the relay is accepted only when none of them worsens
 *   (`WORSE_MM`).
 *
 * The check proves it reads what the gate reads: `crosscheck.txt` sets each piece's own figures on its owned cells beside the round's, and
 * its lofted chart beside the figure's source. The earlier check, which read the bare wall's sections against the reference's cut in the
 * same planes (`sectionMiss`), is kept beside it in each table so the change of verdict is on file.
 *
 * Run from `test` after bundling: `node <bundle>/FamilyConicFlow.cjs [--round=<deviation directory>]`; it writes
 * `test/.shots/family-conic-flow/<time>/`: per piece its table (`<part>.flow.txt`), the `--relay-stored` argument of its accepted groups
 * (`<part>.relay.txt`) and before, after and reference frames of its worst three accepted and worst three kept groups, `summary.txt` and
 * `crosscheck.txt`.
 */
export namespace FamilyConicFlow {
  /**
   * A knot stands out of its field's flow when its difference from the leave-one-out value exceeds this many times the field's median
   * absolute difference: four median absolute deviations is past the noise of a field whose knots follow one smooth curve, the usual robust
   * outlier bound (about 2.7 standard deviations of a normal spread).
   */
  export const OUTLIER: number = 4;

  /**
   * The least difference that flags a knot, by the field's unit: 0.3 mm for a coordinate, the deviation a reader of the clay can see
   * (campaign 1 judged steps under it invisible), and 0.03 for a share, a shoulder or a turn in radians, a tenth of the span a shoulder
   * ranges over between its model bounds.
   */
  export const FLOOR: { mm: number; other: number } = { mm: 0.3, other: 0.03 };

  /**
   * A relay worsens the skin when its largest or its 99th percentile miss grows by more than this, mm, or its mean miss, its count past
   * 1 mm, its folds or its refusals grow at all. A third of `FLOOR.mm`, the least step a reader of the clay sees: an extreme that grows by
   * less is not seen, while a mean that grows at all is skin drawn away over the whole span.
   */
  export const WORSE_MM: number = 0.1;

  /** Station step of the skin's chart grid, mm, and the largest step round its widest ring: samples about a millimetre apart, the gate's chord. */
  export const STEP_MM: number = 1;

  /** Phases round a ring the fold check reads, the earlier section check's ring. */
  export const FOLD_PHASES: number = 360;

  /** The accepted whole-figure round the check reads its owned cells from when `--round` is absent, relative to the repository. */
  export const ROUND: string = "test/.shots/family-conic-deviation/2026-11-14T03-27-13.931Z";

  /**
   * How closely a piece's own figures on its owned cells must meet the round's: its area-weighted absolute cell mean within this many mm
   * or this share of the round's, whichever is larger. The two read one surface by one distance; they differ in where the samples fall
   * (the round's triangle corners on a 1 mm chord tessellation, these a uniform 1 mm chart grid) and in the chart box keeping samples a
   * trim removed inside an owned cell. A wrong chart mapping (a phase origin, a mirror, a unit) puts the samples on other skin, which shows
   * as no owned cell or a mean millimetres off.
   */
  export const AGREE: { mm: number; share: number } = { mm: 0.05, share: 0.25 };

  /** One flagged group of one piece: the knots laid again and the fields laid at them. */
  export interface IGroup {
    /** The knots laid again from the field's other knots, mm, as stored. */
    knots: number[];

    /** The fields laid at those knots, by index. */
    fields: number[];

    /** The largest difference among them, in each field's unit. */
    worst: number;

    /** The span of stations the relay changes: from the knot before the group to the knot after, mm, as stored. */
    span: [number, number];

    /** The same span on the figure's chart, mm: a cutter spread past its mouth moves its later knots. */
    chart: [number, number];

    /** The owned skin against the reference over the span before the relay. */
    before: IMiss;

    /** The owned skin against the reference over the span after the relay. */
    after: IMiss;

    /** Accepted (the relay worsens none of the figures) or kept. */
    accepted: boolean;

    /** Why it is kept, when it is. */
    reason: string;

    /** The earlier check's verdict: the bare wall's sections against the reference's cut, before and after. */
    old: { before: IMiss; after: IMiss; accepted: boolean };
  }

  /** The skin's miss against the reference over a span. */
  export interface IMiss {
    /** Owned skin samples read. */
    samples: number;

    /** Largest absolute miss, mm. */
    max: number;

    /** 99th percentile of the absolute misses, mm. */
    p99: number;

    /** Area-weighted mean absolute miss, mm. */
    mean: number;

    /** Samples farther than 1 mm. */
    over: number;

    /** Stations whose realized ring crosses itself. */
    folds: number;

    /** Stations the section model refuses. */
    refused: number;
  }

  /** One stored piece as the figure carries it. */
  export interface IPart {
    /** The family as stored. */
    stored: H.IFamily;

    /** Sewn into the skin or cut out of it. */
    kind: "family" | "cutter";

    /** The family the figure lofts from stored fields. */
    figure: (family: H.IFamily) => H.IFamily;

    /** The figure's source of the piece: the view part the construction lofts. */
    source: IAutoMovieViewPart;
  }

  /** The chart ranges one owner holds in each cell of a round, and the round's figures there. */
  export interface IOwned {
    /** Edge of the round's cells, mm. */
    side: number;

    /** By cell key, `i,j,k` of the cell's integer coordinates. */
    cells: Map<string, { stations: [number, number]; phases: [number, number]; area: number; mean: number; farthest: number }>;
  }

  /** The realized skin of a piece sampled on its chart grid, and the samples (grid quads) its owner holds. */
  interface ISkin {
    /** The grid's stations, mm. */
    stations: number[];

    /** Phases round each station, uniform from 0. */
    phases: number;

    /** Each grid point, three numbers per point, station-major, mm. */
    points: Float64Array;

    /** The kept quads by their first corner's index, and each one's area, mm², and cell key. */
    kept: { index: number[]; area: number[]; cell: string[] };
  }

  const f2 = (x: number): string => (Number.isFinite(x) ? x.toFixed(2) : String(x));
  const median = (xs: readonly number[]): number => {
    const s: number[] = [...xs].sort((a: number, b: number): number => a - b);
    return s.length === 0 ? 0 : s.length % 2 === 1 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
  };
  type Chain = NonNullable<AutoMovieViewLoft.IResult["chain"]>;

  /** Each field's leave-one-out value at each interior knot, the natural cubic through its other knots there; NaN at the ends. */
  export function leaveOneOut(family: H.IFamily): number[][] {
    return family.values.map((field: number[]): number[] =>
      field.map((_: number, k: number): number => {
        if (k === 0 || k === family.knots.length - 1) return NaN;
        const keep: number[] = family.knots.map((__: number, j: number): number => j).filter((j: number): boolean => j !== k);
        return F.resample([keep.map((j: number): number => field[j]!)], keep.map((j: number): number => family.knots[j]!), [family.knots[k]!])[0]![0]!;
      }),
    );
  }

  /** The family with the listed knots of the listed fields laid again from the field's other knots, as `--relay-stored` lays them. */
  export function relayed(family: H.IFamily, groups: readonly Pick<IGroup, "knots" | "fields">[]): H.IFamily {
    const values: number[][] = family.values.map((field: number[]): number[] => [...field]);
    for (const group of groups) {
      const keep: number[] = family.knots.map((_: number, k: number): number => k).filter((k: number): boolean => !group.knots.includes(family.knots[k]!));
      for (const f of group.fields) {
        const laid: number[] = F.resample([keep.map((k: number): number => values[f]![k]!)], keep.map((k: number): number => family.knots[k]!), family.knots)[0]!;
        values[f] = values[f]!.map((x: number, k: number): number => (group.knots.includes(family.knots[k]!) ? laid[k]! : x));
      }
    }
    return { ...family, values };
  }

  /**
   * Every stored piece as the figure carries it, with the figure's own source of it.
   *
   * A family's ends are the construction's (`AutoMovieHumanF1.construction`, `limb`): it opens an end the source does not close (the arm's
   * and the leg's top, both of the hand's) and closes the thumb's root inside the hand, at the source's first station, as a covered end. A
   * cutter is lofted through its own `cut`. Phase spacing (`turn`, `phase`, `pitch`) only places the mesh's rings and leaves the surface.
   *
   * @param sources The construction's view parts by name.
   * @returns The pieces, and the stored pieces the figure does not carry.
   */
  export function parts(sources: Map<string, IAutoMovieViewPart>): { parts: IPart[]; absent: string[] } {
    const out: IPart[] = [];
    const absent: string[] = [];
    const ends = (family: H.IFamily, source: IAutoMovieViewPart): H.IFamily => {
      const closes: { bottom: boolean; top: boolean } = { bottom: source.pole === "bottom" || source.pole === "both", top: source.pole === "top" || source.pole === "both" };
      const [bottom, top]: [H.ITip | null, H.ITip | null] = family.tips ?? [null, null];
      if (closes.top && top === null) throw new Error(family.name + ": the figure closes the top end, which the stored family leaves open");
      return { ...family, tips: [closes.bottom ? (bottom ?? { from: family.knots[0]!, tip: source.stations[0]!, covered: true }) : null, closes.top ? top : null] };
    };
    const seen: Set<string> = new Set();
    for (const [kind, members] of [
      ["family", AutoMovieHumanF1.FAMILIES.map((member: AutoMovieHumanF1.IMember): { family: H.IFamily; cut: (family: H.IFamily) => H.IFamily } => ({ family: member.family, cut: (family: H.IFamily): H.IFamily => family }))],
      ["cutter", AutoMovieHumanF1.CUTTERS],
    ] as const)
      for (const member of members) {
        if (seen.has(member.family.name)) continue;
        seen.add(member.family.name);
        const source: IAutoMovieViewPart | undefined = sources.get(member.family.name);
        if (source === undefined) {
          absent.push(member.family.name);
          continue;
        }
        out.push({ stored: member.family, kind, figure: (family: H.IFamily): H.IFamily => ends(member.cut(family), source), source });
      }
    return { parts: out, absent };
  }

  /**
   * The chart ranges an owner holds in a round's `owners.json`, with the round's area, signed mean and farthest there.
   *
   * @param round The round's parsed `owners.json`.
   * @param owner The owner's name.
   */
  export function owned(round: { cellMm: number; cells: { centreMm: number[]; owners: { owner: string; areaMm2: number; meanMm: number | null; farthestMm: number; stations: number[] | null; phases: number[] | null }[] }[] }, owner: string): IOwned {
    const cells: IOwned["cells"] = new Map();
    for (const cell of round.cells)
      for (const row of cell.owners) {
        if (row.owner !== owner || row.stations === null || row.phases === null) continue;
        const key: string = cell.centreMm.map((c: number): number => Math.floor(c / round.cellMm)).join(",");
        cells.set(key, { stations: [row.stations[0]!, row.stations[1]!], phases: [row.phases[0]!, row.phases[1]!], area: row.areaMm2, mean: row.meanMm ?? 0, farthest: row.farthestMm });
      }
    return { side: round.cellMm, cells };
  }

  /** Whether a phase lies in a range that may be unwrapped past a turn. */
  function within(phase: number, range: readonly [number, number]): boolean {
    const k: number = Math.ceil((range[0] - phase) / (2 * Math.PI) - 1e-12);
    return phase + 2 * Math.PI * k <= range[1] + 1e-12;
  }

  /** The chain's points on a grid: every station, `phases` uniform phases round it. */
  function grid(chain: Chain, stations: readonly number[], phases: number): Float64Array {
    const points: Float64Array = new Float64Array(stations.length * phases * 3);
    stations.forEach((s: number, i: number): void => {
      for (let j: number = 0; j < phases; ++j) {
        const p: number[] = AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / phases);
        points.set([p[0]!, p[1]!, p[2]!], (i * phases + j) * 3);
      }
    });
    return points;
  }

  /**
   * The piece's realized skin sampled on its chart grid over its owned stations, and the grid quads its owner holds: a quad is kept when
   * its centre's cell is an owned cell and its centre's station and phase lie inside the owner's ranges there.
   *
   * @param chain The piece lofted as the figure lofts it.
   * @param domain The stations the chain spans, mm.
   * @param own The owner's cells.
   */
  function skin(chain: Chain, domain: readonly [number, number], own: IOwned): ISkin | null {
    const ranges = [...own.cells.values()];
    if (ranges.length === 0) return null;
    const lo: number = Math.max(domain[0], Math.min(...ranges.map((r): number => r.stations[0])));
    const hi: number = Math.min(domain[1], Math.max(...ranges.map((r): number => r.stations[1])));
    const stations: number[] = [];
    for (let s: number = Math.ceil(lo / STEP_MM) * STEP_MM; s <= hi + 1e-9; s += STEP_MM) stations.push(s);
    if (stations.length < 2) return null;
    // Phases round: the widest ring's length over the step, read on 256 phases at every tenth station.
    let widest: number = 0;
    for (let i: number = 0; i < stations.length; i += 10) {
      const ring: Float64Array = grid(chain, [stations[i]!], 256);
      let length: number = 0;
      for (let j: number = 0; j < 256; ++j) {
        const k: number = ((j + 1) % 256) * 3;
        length += Math.hypot(ring[k]! - ring[j * 3]!, ring[k + 1]! - ring[j * 3 + 1]!, ring[k + 2]! - ring[j * 3 + 2]!);
      }
      widest = Math.max(widest, length);
    }
    const phases: number = Math.max(64, 8 * Math.ceil(widest / STEP_MM / 8));
    const points: Float64Array = grid(chain, stations, phases);
    const kept: ISkin["kept"] = { index: [], area: [], cell: [] };
    const at = (i: number, j: number): D.V3 => {
      const k: number = (i * phases + (j % phases)) * 3;
      return [points[k]!, points[k + 1]!, points[k + 2]!];
    };
    for (let i: number = 0; i + 1 < stations.length; ++i)
      for (let j: number = 0; j < phases; ++j) {
        const [a, b, c, d]: D.V3[] = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)];
        const centre: D.V3 = [0, 1, 2].map((q: number): number => (a[q]! + b[q]! + c[q]! + d[q]!) / 4) as D.V3;
        const cell: string = centre.map((x: number): number => Math.floor(x / own.side)).join(",");
        const range = own.cells.get(cell);
        if (range === undefined) continue;
        const s: number = (stations[i]! + stations[i + 1]!) / 2;
        if (s < range.stations[0] || s > range.stations[1] || !within((2 * Math.PI * (j + 0.5)) / phases, range.phases)) continue;
        const n: D.V3 = D.cross(D.sub(c, a), D.sub(b, d));
        kept.index.push(i * phases + j);
        kept.area.push(Math.hypot(n[0], n[1], n[2]) / 2);
        kept.cell.push(cell);
      }
    return { stations, phases, points, kept };
  }

  /**
   * Each kept quad's miss: the mean of its four corners' signed distances to the reference, as the gate reads a triangle by its corners'
   * mean; a corner with no reference triangle within reach takes the gate's stand-in, four cells.
   *
   * @param points The grid's points, from the skin's grid or another chain's on the same grid.
   * @param phases Phases round each station.
   * @param quads The quads by their first corner's index.
   * @param reference The reference triangles.
   * @param cache Each grid point's distance once read, NaN before.
   */
  function misses(points: Float64Array, phases: number, quads: readonly number[], reference: D.IGrid, cache: Float64Array): number[] {
    const read = (v: number): number => {
      if (Number.isNaN(cache[v]!)) cache[v] = D.distance(reference, [points[v * 3]!, points[v * 3 + 1]!, points[v * 3 + 2]!]) ?? 4 * D.CELL_MM;
      return cache[v]!;
    };
    return quads.map((q: number): number => {
      const [i, j]: number[] = [Math.floor(q / phases), q % phases];
      const next: number = (j! + 1) % phases;
      return (read(i! * phases + j!) + read((i! + 1) * phases + j!) + read((i! + 1) * phases + next) + read(i! * phases + next)) / 4;
    });
  }

  /** Largest, 99th percentile, area-weighted mean and count past 1 mm of a set of misses. */
  function figures(values: readonly number[], areas: readonly number[]): Pick<IMiss, "samples" | "max" | "p99" | "mean" | "over"> {
    const sorted: number[] = values.map(Math.abs).sort((a: number, b: number): number => a - b);
    const area: number = areas.reduce((a: number, b: number): number => a + b, 0);
    return {
      samples: sorted.length,
      max: sorted.at(-1) ?? NaN,
      p99: sorted[Math.min(sorted.length - 1, Math.floor(0.99 * sorted.length))] ?? NaN,
      mean: values.reduce((sum: number, v: number, k: number): number => sum + Math.abs(v) * areas[k]!, 0) / Math.max(1e-12, area),
      over: sorted.filter((d: number): boolean => d > 1).length,
    };
  }

  /** Whether a closed polygon crosses itself. */
  function crosses(ring: readonly C.P[]): boolean {
    const n: number = ring.length;
    const side = (a: C.P, b: C.P, c: C.P): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    for (let i: number = 0; i < n; ++i)
      for (let j: number = i + 2; j < n; ++j) {
        if (i === 0 && j === n - 1) continue;
        const a: C.P = ring[i]!, b: C.P = ring[(i + 1) % n]!, c: C.P = ring[j]!, d: C.P = ring[(j + 1) % n]!;
        if (side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0) return true;
      }
    return false;
  }

  /**
   * The stations of a span whose realized ring, wall and reliefs, crosses itself in its station's plane, and those whose fields the section
   * model refuses.
   *
   * @param family The piece as the figure lofts it.
   * @param chain Its loft.
   * @param stations The grid's stations in the span, mm.
   */
  function faults(family: H.IFamily, chain: Chain, stations: readonly number[]): { folds: number; refused: number } {
    const read: (s: number) => number[] = H.reader(family);
    const axis = H.axis(family);
    let folds: number = 0, refused: number = 0;
    for (const s of stations) {
      if (s >= family.knots[0]! && s <= family.knots.at(-1)! && S.chain(read(s), family.layout).fault !== null) ++refused;
      const frame = axis.at(s);
      const ring: C.P[] = Array.from({ length: FOLD_PHASES }, (_: unknown, j: number): C.P => {
        const p: number[] = AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / FOLD_PHASES);
        const r: number[] = [0, 1, 2].map((k: number): number => p[k]! - frame.origin[k]!);
        return [r[0]! * frame.u[0] + r[1]! * frame.u[1] + r[2]! * frame.u[2], r[0]! * frame.v[0] + r[1]! * frame.v[1] + r[2]! * frame.v[2]];
      });
      if (crosses(ring)) ++folds;
    }
    return { folds, refused };
  }

  /** A field vector's section as a polygon: each conic arc of the model's chain sampled `per` times. */
  function polygon(values: readonly number[], layout: S.ILayout, per: number = 16): C.P[] {
    const input = S.resolve(values, layout).input;
    const n: number = input.points.length;
    const out: C.P[] = [];
    for (let k: number = 0; k < n; ++k) {
      const p0 = input.points[k]!, p2 = input.points[(k + 1) % n]!;
      const a: C.P = S.meet([p0[0]!, p0[1]!], [input.tangents[k]![0]!, input.tangents[k]![1]!], [p2[0]!, p2[1]!], [input.tangents[(k + 1) % n]![0]!, input.tangents[(k + 1) % n]![1]!]);
      const w: number = input.shoulders[k]! / (1 - input.shoulders[k]!);
      for (let i: number = 0; i < per; ++i) {
        const t: number = i / per;
        const b0: number = (1 - t) ** 2, b1: number = 2 * t * (1 - t) * w, b2: number = t * t;
        const d: number = b0 + b1 + b2;
        out.push([(b0 * p0[0]! + b1 * a[0] + b2 * p2[0]!) / d, (b0 * p0[1]! + b1 * a[1] + b2 * p2[1]!) / d]);
      }
    }
    return out;
  }

  /** Distance from a point to a closed polyline. */
  function nearest(p: C.P, ring: readonly C.P[]): number {
    let best: number = Infinity;
    for (let k: number = 0; k < ring.length; ++k) {
      const a: C.P = ring[k]!, b: C.P = ring[(k + 1) % ring.length]!;
      const d: C.P = [b[0] - a[0], b[1] - a[1]];
      const t: number = Math.max(0, Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1] || 1)));
      best = Math.min(best, Math.hypot(p[0] - a[0] - t * d[0], p[1] - a[1] - t * d[1]));
    }
    return best;
  }

  /**
   * The earlier check, kept to set its verdict beside the skin's: at every `STEP_MM` station, the reference cut in the station's plane (the
   * loop nearest the wall's section) against the bare wall's section, reliefs left out; its samples are the reference loop's points.
   */
  export function sectionMiss(family: H.IFamily, span: readonly [number, number], source: R.ISource): IMiss {
    const read: (s: number) => number[] = H.reader(family);
    const axis = H.axis(family);
    const distances: number[] = [];
    let folds: number = 0, refused: number = 0;
    for (let s: number = span[0]; s <= span[1] + 1e-9; s += STEP_MM) {
      const values: number[] = read(s);
      if (S.chain(values, family.layout).fault !== null) {
        ++refused;
        continue;
      }
      const section: C.P[] = polygon(values, family.layout);
      if (crosses(section)) ++folds;
      const ring: C.P[] = Array.from({ length: 360 }, (_: unknown, k: number): C.P => {
        const phi: number = (2 * Math.PI * k) / 360;
        const r: number = Q.radius(S.chain(values, family.layout), phi);
        return [r * Math.cos(phi), r * Math.sin(phi)];
      });
      const loops: C.P[][] = R.loops(source.all, axis.at(s));
      if (loops.length === 0) continue;
      const loop: C.P[] = loops.reduce((a: C.P[], b: C.P[]): C.P[] => (median(b.map((p: C.P): number => nearest(p, ring))) < median(a.map((p: C.P): number => nearest(p, ring))) ? b : a));
      for (const p of loop) distances.push(nearest(p, ring));
    }
    return { ...figures(distances, distances.map((): number => 1)), folds, refused };
  }

  /** Each field's flagged knots, grouped into runs of adjacent flagged knots, merged across fields that flag the same knots. */
  export function groups(family: H.IFamily, loo: readonly (readonly number[])[]): { knots: number[]; fields: number[]; worst: number }[] {
    const units: S.Unit[] = S.units(family.layout);
    const byKnots: Map<string, { knots: number[]; fields: number[]; worst: number }> = new Map();
    family.values.forEach((field: number[], f: number): void => {
      const diff: number[] = field.map((x: number, k: number): number => x - loo[f]![k]!);
      const interior: number[] = diff.filter((d: number): boolean => Number.isFinite(d)).map(Math.abs);
      const bound: number = Math.max(OUTLIER * median(interior), units[f] === "mm" ? FLOOR.mm : FLOOR.other);
      const flagged: boolean[] = diff.map((d: number): boolean => Number.isFinite(d) && Math.abs(d) > bound);
      for (let k: number = 0; k < flagged.length; ) {
        if (!flagged[k]) {
          ++k;
          continue;
        }
        let j: number = k;
        while (j + 1 < flagged.length && flagged[j + 1]) ++j;
        const knots: number[] = family.knots.slice(k, j + 1);
        const key: string = knots.join(",");
        const entry = byKnots.get(key) ?? { knots, fields: [], worst: 0 };
        entry.fields.push(f);
        entry.worst = Math.max(entry.worst, ...diff.slice(k, j + 1).map(Math.abs));
        byKnots.set(key, entry);
        k = j + 1;
      }
    });
    return [...byKnots.values()];
  }

  /** The realized skin over a span as a mesh in metres, read on the chain, its stations inside `marked` in their own colour. */
  function mesh(chain: Chain, span: readonly [number, number], marked: readonly [number, number], id: string): N.Mesh[] {
    const stations: number[] = [];
    for (let s: number = span[0]; s <= span[1] + 1e-9; s += 0.5) stations.push(s);
    const about: number = 192;
    const positions: number[] = Array.from(grid(chain, stations, about), (x: number): number => x / 1000);
    const plain: number[] = [], inside: number[] = [];
    for (let i: number = 0; i + 1 < stations.length; ++i)
      for (let j: number = 0; j < about; ++j) {
        const a: number = i * about + j, b: number = i * about + ((j + 1) % about);
        const into: number[] = stations[i]! >= marked[0] - 1e-9 && stations[i + 1]! <= marked[1] + 1e-9 ? inside : plain;
        into.push(a, a + about, b, b, a + about, b + about);
      }
    return [
      { id, positions, indices: plain, colour: [0.64, 0.65, 0.67] },
      { id: id + ".relayed", positions, indices: inside, colour: [0.86, 0.55, 0.32] },
    ];
  }

  const missText = (m: IMiss): string => `${m.samples}:${f2(m.max)}/${f2(m.p99)}/${f2(m.mean)}/${m.over}/${m.folds}/${m.refused}`;

  /** Read every piece, flag, check on its owned skin, write the tables, relays, frames, the cross-check and the summary. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const roundDir: string = path.resolve(root, process.argv.find((argument: string): boolean => argument.startsWith("--round="))?.slice("--round=".length) ?? ROUND);
    const round = JSON.parse(await fs.readFile(path.join(roundDir, "owners.json"), "utf8"));
    const out: string = path.join(root, "test/.shots/family-conic-flow", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const source: R.ISource = await R.load(root);
    const reference: D.IGrid = D.grid([source.body, source.head]);
    const shown: N.Mesh[] = [source.body, source.head].map((m, i: number): N.Mesh => ({ id: "reference." + i, positions: Array.from(m.positions, (x: number): number => x / 1000), indices: Array.from(m.indices), colour: [0.64, 0.65, 0.67] }));
    NodeCanvasRaster.initialize();
    const declared: AutoMovieHumanF1.IConstruction = AutoMovieHumanF1.construction();
    const found: { parts: IPart[]; absent: string[] } = parts(declared.sources);
    const summary: string[] = [
      "# FamilyConicFlow: every stored piece's fields against their leave-one-out flow, each group judged on the piece's realized skin (wall and reliefs) on the cells it owns in the round",
      `# round: ${path.relative(root, roundDir).replaceAll("\\", "/")}`,
      ...found.absent.map((name: string): string => `# ${name}: stored, but not in the figure (no source of that name in AutoMovieHumanF1.construction()), so not read`),
      "part       kind     knots  fields  groups  accepted  kept  relay",
    ];
    const crosscheck: string[] = [
      "# FamilyConicFlow cross-check: each piece's own figures on its owned cells (before any relay) beside the round's owners.json",
      `# round: ${path.relative(root, roundDir).replaceAll("\\", "/")}; agreement: |mine - round| of the area-weighted absolute cell mean within ${AGREE.mm} mm or ${AGREE.share * 100} % of the round's`,
      "# chart: the largest distance between this check's loft and the figure's own source of the piece (AutoMovieViewLoft.create(source)) at every fourth grid point, mm",
      "# area: the owned cells' area (round) / the kept samples' area (mine), mm2; |mean|: area-weighted absolute cell mean, mm; far: farthest, mm",
      "# worst cell: the owned cell (area over 20 mm2 in the round) whose signed mean differs most: centre mm, round -> mine",
      "part           cells  area round/mine      |mean| round/mine  far round/mine   chart mm  verdict   worst cell",
    ];
    const verdicts: string[] = ["", "# old check (bare wall's sections against the reference cut) beside the new one, every group: old -> new"];
    for (const part of found.parts) {
      const family: H.IFamily = part.stored;
      const figured: H.IFamily = part.figure(family);
      const stations: number[] = part.source.stations;
      const domain: [number, number] = [stations[0]!, stations.at(-1)!];
      const loft: AutoMovieViewLoft.IResult = H.create(figured, stations);
      const figure: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part.source);
      const own: IOwned = owned(round, family.name);
      if (loft.chain === null || figure.chain === null) {
        summary.push(`${family.name.padEnd(11)}${part.kind.padEnd(9)}  does not loft: ${JSON.stringify(loft.diagnostics).slice(0, 200)}`);
        continue;
      }
      const chain: Chain = loft.chain;
      const sampled: ISkin | null = skin(chain, domain, own);
      if (sampled === null) {
        summary.push(`${family.name.padEnd(11)}${part.kind.padEnd(9)}  owns no cell in the round`);
        continue;
      }
      const cache: Float64Array = new Float64Array(sampled.points.length / 3).fill(NaN);
      const values: number[] = misses(sampled.points, sampled.phases, sampled.kept.index, reference, cache);

      // The cross-check: per owned cell, the kept samples' area, signed mean and farthest beside the round's.
      const mine: Map<string, { area: number; sum: number; farthest: number }> = new Map();
      values.forEach((v: number, k: number): void => {
        const cell = mine.get(sampled.kept.cell[k]!) ?? { area: 0, sum: 0, farthest: 0 };
        cell.area += sampled.kept.area[k]!;
        cell.sum += v * sampled.kept.area[k]!;
        if (Math.abs(v) > Math.abs(cell.farthest)) cell.farthest = v;
        mine.set(sampled.kept.cell[k]!, cell);
      });
      const roundArea: number = [...own.cells.values()].reduce((a: number, c): number => a + c.area, 0);
      const roundMean: number = [...own.cells.values()].reduce((a: number, c): number => a + Math.abs(c.mean) * c.area, 0) / Math.max(1e-12, roundArea);
      const roundFar: number = Math.max(0, ...[...own.cells.values()].map((c): number => Math.abs(c.farthest)));
      const mineArea: number = [...mine.values()].reduce((a: number, c): number => a + c.area, 0);
      const mineMean: number = [...mine.values()].reduce((a: number, c): number => a + Math.abs(c.sum), 0) / Math.max(1e-12, mineArea);
      const mineFar: number = Math.max(0, ...[...mine.values()].map((c): number => Math.abs(c.farthest)));
      let chart: number = 0;
      for (let i: number = 0; i < sampled.stations.length; i += 4)
        for (let j: number = 0; j < sampled.phases; j += 4) {
          const p: number[] = AutoMovieLoftChain.point(figure.chain, sampled.stations[i]!, (2 * Math.PI * j) / sampled.phases);
          const k: number = (i * sampled.phases + j) * 3;
          chart = Math.max(chart, Math.hypot(p[0]! - sampled.points[k]!, p[1]! - sampled.points[k + 1]!, p[2]! - sampled.points[k + 2]!));
        }
      let worstCell: string = "-";
      let worstGap: number = -1;
      for (const [key, cell] of own.cells) {
        if (cell.area <= 20) continue;
        const m = mine.get(key);
        const mean: number = m === undefined ? NaN : m.sum / m.area;
        const gap: number = Number.isFinite(mean) ? Math.abs(mean - cell.mean) : Infinity;
        if (gap > worstGap) {
          worstGap = gap;
          worstCell = `[${key.split(",").map((i: string): number => (Number(i) + 0.5) * own.side).join(",")}] ${f2(cell.mean)} -> ${f2(mean)} (area ${Math.round(cell.area)}/${Math.round(m?.area ?? 0)})`;
        }
      }
      const agrees: boolean = Math.abs(mineMean - roundMean) <= Math.max(AGREE.mm, AGREE.share * roundMean);
      crosscheck.push(
        [family.name.padEnd(15), String(own.cells.size).padStart(5), `  ${String(Math.round(roundArea)).padStart(7)}/${String(Math.round(mineArea)).padEnd(8)}`, `  ${f2(roundMean).padStart(6)}/${f2(mineMean).padEnd(9)}`, `  ${f2(roundFar).padStart(6)}/${f2(mineFar).padEnd(7)}`, `  ${chart.toFixed(4).padStart(8)}`, `  ${(agrees ? "agree" : "DISAGREE").padEnd(8)}`, `  ${worstCell}`].join(""),
      );

      // The groups, each judged before and after on the kept samples of its span.
      const units: S.Unit[] = S.units(family.layout);
      const loo: number[][] = leaveOneOut(family);
      const judged: IGroup[] = groups(family, loo).map((g): IGroup => {
        const first: number = family.knots.indexOf(g.knots[0]!), last: number = family.knots.indexOf(g.knots.at(-1)!);
        const [a, b]: number[] = [Math.max(0, first - 1), Math.min(family.knots.length - 1, last + 1)];
        const span: [number, number] = [family.knots[a!]!, family.knots[b!]!];
        const chartSpan: [number, number] = [figured.knots[a!]!, figured.knots[b!]!];
        const rows: number[] = sampled.stations.map((_: number, i: number): number => i).filter((i: number): boolean => sampled.stations[i]! >= chartSpan[0] - 1e-9 && sampled.stations[i]! <= chartSpan[1] + 1e-9);
        const inside: number[] = sampled.kept.index.map((_: number, k: number): number => k).filter((k: number): boolean => {
          const i: number = Math.floor(sampled.kept.index[k]! / sampled.phases);
          return sampled.stations[i]! >= chartSpan[0] - 1e-9 && sampled.stations[i + 1]! <= chartSpan[1] + 1e-9;
        });
        const areas: number[] = inside.map((k: number): number => sampled.kept.area[k]!);
        const spanStations: number[] = rows.map((i: number): number => sampled.stations[i]!);
        const before: IMiss = { ...figures(inside.map((k: number): number => values[k]!), areas), ...faults(figured, chain, spanStations) };
        const after: IMiss = ((): IMiss => {
          const moved: H.IFamily = part.figure(relayed(family, [g]));
          const relaid: AutoMovieViewLoft.IResult = H.create(moved, stations);
          if (relaid.chain === null) return { samples: 0, max: NaN, p99: NaN, mean: NaN, over: 0, folds: 0, refused: spanStations.length };
          // The relay changes only the span's rows; the grid's other rows keep their points, so only those are read again.
          const points: Float64Array = new Float64Array(sampled.points);
          const fresh: Float64Array = new Float64Array(cache.length).fill(NaN);
          if (rows.length > 0) {
            const lo: number = Math.max(0, rows[0]! - 1), hi: number = Math.min(sampled.stations.length - 1, rows.at(-1)! + 1);
            points.set(grid(relaid.chain, sampled.stations.slice(lo, hi + 1), sampled.phases), lo * sampled.phases * 3);
          }
          return { ...figures(misses(points, sampled.phases, inside.map((k: number): number => sampled.kept.index[k]!), reference, fresh), areas), ...faults(moved, relaid.chain, spanStations) };
        })();
        const reason: string =
          before.samples === 0
            ? "kept: owns no skin in its span"
            : after.refused > before.refused
              ? "kept: refusals"
              : after.folds > before.folds
                ? "kept: folds"
                : after.max > before.max + WORSE_MM
                  ? "kept: max"
                  : after.p99 > before.p99 + WORSE_MM
                    ? "kept: p99"
                    : after.mean > before.mean
                      ? "kept: mean"
                      : after.over > before.over
                        ? "kept: over 1 mm"
                        : "";
        const oldBefore: IMiss = sectionMiss(family, span, source);
        const oldAfter: IMiss = sectionMiss(relayed(family, [g]), span, source);
        const oldAccepted: boolean = oldAfter.refused <= oldBefore.refused && oldAfter.folds <= oldBefore.folds && oldAfter.max <= oldBefore.max + WORSE_MM && oldAfter.mean <= oldBefore.mean;
        return { ...g, span, chart: chartSpan, before, after, accepted: reason === "", reason, old: { before: oldBefore, after: oldAfter, accepted: oldAccepted } };
      });
      const table: string[] = [
        `# ${family.name} (${part.kind}): ${family.knots.length} knots, ${family.values.length} fields; leave-one-out difference (stored - laid) at each interior knot, flagged past ${OUTLIER} x the field's median absolute difference and ${FLOOR.mm} mm / ${FLOOR.other}`,
        `# skin: ${sampled.stations.length} stations ${f2(sampled.stations[0]!)}..${f2(sampled.stations.at(-1)!)} mm x ${sampled.phases} phases; ${sampled.kept.index.length} samples on ${own.cells.size} owned cells`,
        "field  unit   " + family.knots.slice(1, -1).map((k: number): string => String(k).padStart(9)).join(""),
      ];
      family.values.forEach((field: number[], f: number): void => {
        table.push(String(f).padStart(5) + "  " + units[f]!.padEnd(5) + "  " + field.slice(1, -1).map((x: number, k: number): string => (x - loo[f]![k + 1]!).toFixed(units[f] === "mm" ? 2 : 3).padStart(9)).join(""));
      });
      table.push("", "## groups (knots : fields), worst difference, span (stored; chart), owned skin before -> after (samples:max / p99 / mean / over 1 mm / folds / refused), verdict; old check before -> after, verdict");
      for (const g of judged) {
        table.push(`${g.knots.join(",")} : ${g.fields.join(",")}  worst ${g.worst.toFixed(3)}  span ${g.span.join("-")}; ${g.chart.join("-")}  ${missText(g.before)} -> ${missText(g.after)}  ${g.accepted ? "relay" : g.reason}  | old ${missText(g.old.before)} -> ${missText(g.old.after)}  ${g.old.accepted ? "relay" : "kept"}`);
        verdicts.push(`${family.name} ${g.knots.join(",")}:${g.fields.join(",")}  old ${g.old.accepted ? "relay" : "kept"} -> new ${g.accepted ? "relay" : g.reason}`);
      }
      const accepted: IGroup[] = judged.filter((g: IGroup): boolean => g.accepted);
      const relay: string = accepted.length === 0 ? "" : "--relay-stored=" + accepted.map((g: IGroup): string => `${g.knots.join(",")}:${g.fields.join(",")}`).join(";");
      await fs.writeFile(path.join(out, family.name + ".flow.txt"), table.join("\n") + "\n");
      await fs.writeFile(path.join(out, family.name + ".relay.txt"), relay + "\n");

      // Before, after and reference frames of the worst three accepted groups and the worst three kept, the realized skin framed on the group's span.
      const frames: string[] = [];
      const shot = async (label: string, g: IGroup): Promise<void> => {
        const wide: [number, number] = [Math.max(domain[0], g.chart[0] - 10), Math.min(domain[1], g.chart[1] + 10)];
        const relaid: AutoMovieViewLoft.IResult = H.create(part.figure(relayed(family, [g])), stations);
        if (relaid.chain === null) return;
        const before: N.Mesh[] = mesh(chain, wide, g.chart, family.name + ".before");
        const after: N.Mesh[] = mesh(relaid.chain, wide, g.chart, family.name + ".after");
        const near: N.Point[] = [];
        for (const m of before) for (let k: number = 0; k < m.positions.length; k += 3 * 7) near.push([m.positions[k]!, m.positions[k + 1]!, m.positions[k + 2]!]);
        if (near.length === 0) return;
        for (const view of ["front", "left"]) {
          const camera: N.Camera = NodeCanvasCamera.fit(view, near, 900, 900);
          for (const [stage, meshes] of [["reference", shown], ["before", before], ["after", after]] as [string, N.Mesh[]][]) {
            const file: string = `${family.name}.${label}.${view}.${stage}.png`;
            const png: Buffer = NodeCanvasRaster.render(camera, meshes, [], "depth", `f1 | ${family.name} ${label} ${g.knots.join(",")}:${g.fields.join(",")} | ${stage} | ${view}`).png;
            await fs.writeFile(path.join(out, file), png);
            frames.push(file + " " + createHash("sha256").update(png).digest("hex").slice(0, 12));
          }
        }
      };
      const byWorst = (a: IGroup, b: IGroup): number => b.worst - a.worst;
      for (const [i, g] of [...accepted].sort(byWorst).slice(0, 3).entries()) await shot("accepted" + (i + 1), g);
      for (const [i, g] of judged.filter((g: IGroup): boolean => !g.accepted && g.before.samples > 0).sort(byWorst).slice(0, 3).entries()) await shot("kept" + (i + 1), g);
      if (frames.length > 0) await fs.appendFile(path.join(out, family.name + ".flow.txt"), ["", "## frames (the realized skin, the group's span in orange)", ...frames].join("\n") + "\n");
      summary.push([family.name.padEnd(11), part.kind.padEnd(9), String(family.knots.length).padStart(5), String(family.values.length).padStart(8), String(judged.length).padStart(8), String(accepted.length).padStart(10), String(judged.length - accepted.length).padStart(6), "  " + (relay || "-")].join(""));
      process.stdout.write(JSON.stringify({ event: "flow-part", part: family.name, groups: judged.length, accepted: accepted.length, agrees }) + "\n");
      await fs.writeFile(path.join(out, "crosscheck.txt"), crosscheck.join("\n") + "\n");
    }
    await fs.writeFile(path.join(out, "summary.txt"), [...summary, ...verdicts].join("\n") + "\n");
    await fs.writeFile(path.join(out, "crosscheck.txt"), crosscheck.join("\n") + "\n");
    process.stdout.write(JSON.stringify({ event: "flow-complete", out }) + "\n");
  }
}

if (/FamilyConicFlow\.c?[jt]s$/.test(process.argv[1] ?? ""))
  FamilyConicFlow.main().catch((error: unknown): void => {
    process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
    process.exitCode = 1;
  });
