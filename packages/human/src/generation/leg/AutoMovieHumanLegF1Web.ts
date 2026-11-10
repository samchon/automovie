import {
  AutoMovieCurveMath64,
  AutoMovieViewAxis,
  generateAutoMovieContourLoft64,
  type IAutoMovieContourLoft64,
  type IAutoMovieCurve64,
} from "@automovie/engine";

import { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";
import branches from "../AutoMovieHumanF1NativeBranches.json";
import endings from "./AutoMovieHumanLegF1ForefootEnds.json";
import left from "./AutoMovieHumanLegF1Left.json";
import native from "./AutoMovieHumanLegF1Native.json";
import right from "./AutoMovieHumanLegF1Right.json";

/** Absolute ISB world-mm observation or same-chart vector. */
type V3 = AutoMovieCurveMath64.V;
/** Existing indexed output context used by the independent F1 builder. */
type Context = AutoMovieHumanLoftMesh.IContext;
/** Existing ordinary-contour section contract; coordinates are millimetres. */
type Section = IAutoMovieContourLoft64.ISection;
/** One declared closed source component and its orientation. */
type Loop = Section["loops"][number];
/** Recorded original branch event, not an invented station. */
type Event = IAutoMovieContourLoft64.IEvent;
/** Source component correspondence between adjacent measured sections. */
type Interval = IAutoMovieContourLoft64.IInterval;
/** Indexed generated triangle; source triangles are never authored here. */
type Face = [number, number, number];
/** One connected forefoot loft, including its five logical digit domains. */
type Skin = { points: V3[]; faces: Face[] };
/** Immutable original physical root plane and world-mm boundary controls. */
type Port = { frame: ReturnType<AutoMovieViewAxis.IAxis["at"]>; points: V3[] };

/** Authoring packet types preserve original numerical values and declared provenance. */
type Patch = (typeof native.patches)[number];

/** Recorded F1 branch curves, events and declared component incidence. */
type Branch = NonNullable<(typeof branches.records)[number]["branches"]>;

/** Generate the observed forefoot web in its original seed-normal chart. */
export namespace AutoMovieHumanLegF1Web {
  /**
   * Retain the complete measured 1-to-5 ordinary loft as one surface.
   *
   * Cutting this same sheet at five toe-root planes and inserting separate
   * toes created the visible ten-sided comb bands. The complete source already
   * contains those digits and their branch events, so it needs no artificial
   * root joins. Logical toe identities do not require duplicate surfaces.
   */
  export function f1(mesh: Context, side: "left" | "right", points: readonly V3[][]): string[] {
    if (points.length !== 6) throw new Error(`The fixed ${side} forefoot needs its six observed anatomical ports`);
    const seed: V3[] = points[0]!;
    const skin: Skin = sectionSkin(side, seed);
    const seedIds: number[] = existing(seed, mesh.positions);
    const seedSign: 1 | -1 = direction(mesh.indices, seedIds);
    const generated: number[] = existing(seed, skin.points.flat());
    const flat: number[] = skin.faces.flat();
    const same: boolean = direction(flat, generated) === seedSign;
    const shared: Map<number, number> = new Map(generated.map((id: number, i: number): [number, number] => [id, seedIds[i]!]));
    const used: Set<number> = new Set(flat);
    for (const id of used) if (!shared.has(id)) shared.set(id, AutoMovieHumanLoftMesh.vertices(mesh, [skin.points[id]!])[0]!);
    for (const [a, b, c] of skin.faces) mesh.indices.push(shared.get(a)!, shared.get(same ? c : b)!, shared.get(same ? b : c)!);
    return Array.from({ length: 5 }, (_: unknown, i: number): string => `toe.${side}.${i + 1}`);
  }

  /**
   * Generate the complete measured distal sheet without artificial root cuts.
   * The fixed builder and the offline whole-body comparison read this same
   * input and emission. Coordinates are absolute ISB world millimetres.
   */
  export function sectionSkin(side: "left" | "right", seed: V3[]): Skin {
    const key: string = `leg.${side}.toe-web seed.terminal`;
    const source: Patch | undefined = native.patches.find((piece: Patch): boolean => piece.name === key);
    const observed: Branch | undefined = branches.records.find((piece: (typeof branches.records)[number]): boolean => piece.name === key)?.branches ?? undefined;
    if (source === undefined || observed === undefined) throw new Error(`Missing original ${side} forefoot observations`);
    const axes: V3[] = source.frame.axes.map(AutoMovieCurveMath64.clone);
    const n: V3 = axes[0]!;
    const [u, v]: [V3, V3] = [axes[1]!, axes[2]!];

    /** Evaluate the original absolute source frame without re-basing or refitting. */
    const place: (s: number, point: readonly number[]) => V3 = (s: number, [a, b]: readonly number[]): V3 => [
      n[0] * s + u[0] * a! + v[0] * b!, n[1] * s + u[1] * a! + v[1] * b!, n[2] * s + u[2] * a! + v[2] * b!,
    ];
    const seedStation: number = dot(seed[0]!, n);
    const sections: Section[] = [{ coordinateMm: seedStation, loops: [line(key + ".seed", seed, n)] }];
    for (const { station, loops } of source.rows) {
      if (observed.groups.some(({ beforeMm, afterMm }: Branch["groups"][number]): boolean => station >= beforeMm && station <= afterMm)) continue;
      const closed: typeof loops = loops.filter(({ closed }: typeof loops[number]): boolean => closed);
      if (closed.length !== 0) sections.push({
        coordinateMm: station,
        loops: closed.map(({ points }: typeof closed[number], i: number): Loop => line(`${key}.${station}.${i}`, points.map((p: number[]): V3 => place(station, p)), n)),
      });
    }
    for (const { coordinateMm, loops } of observed.sections)
      sections.push({ coordinateMm, loops: loops.map(({ curve, winding }: Branch["sections"][number]["loops"][number]): Loop => ({
        // All observed branches are exterior. Recovery normalizes point
        // order but retains the reflected source's negative orientation tag.
        winding: exterior(winding),
        curve: {
          type: "cubicBezier", name: curve.name, closed: true, unit: "mm", phaseUnit: "mm",
          phaseIntervals: curve.phaseIntervals,
          spans: curve.spans.map((span: typeof curve.spans[number]): IAutoMovieCurve64.Span => [
            AutoMovieCurveMath64.clone(span[0]!), AutoMovieCurveMath64.clone(span[1]!),
            AutoMovieCurveMath64.clone(span[2]!), AutoMovieCurveMath64.clone(span[3]!),
          ]),
        },
      })) });
    const ending: (typeof endings.records)[number] | undefined = endings.records.find(
      (record: (typeof endings.records)[number]): boolean => record.side === side);
    if (ending === undefined || source.rows.at(-1)!.station !== ending.startMm)
      throw new Error("The complete F1 forefoot lost its measured terminal domain");

    // The old web observation stopped 0.368 mm before the hallux maximum.
    // Its 14-edge end is a truncated source domain, not a toe-root crack.
    // Preserve the two additional observed cuts and actual extremal vertex;
    // no centroid, landmark-based cap or original source triangle is used.
    for (const row of ending.sections) sections.push({
      coordinateMm: row.coordinateMm,
      loops: [line(`${key}.terminal.${row.coordinateMm}`, row.points.map(AutoMovieCurveMath64.clone), n)],
    });
    sections.push({ coordinateMm: ending.afterMm, loops: [] });
    sections.sort((a: Section, b: Section): number => a.coordinateMm - b.coordinateMm);
    const last: number = ending.sections.at(-1)!.coordinateMm;
    const events: Event[] = [{
      name: `${key}.hallux.maximum`, coordinateMm: ending.maximumMm,
      beforeMm: last, afterMm: ending.afterMm, before: [0], after: [],
      kind: "maximum", regular: true, terminal: AutoMovieCurveMath64.clone(ending.terminal),
    }];
    for (const { beforeMm, afterMm, groups } of observed.groups)
      for (const group of groups)
        for (const item of group.events) {
          const kind: Event["kind"] = item.lowerComponents === 0 ? "minimum" : item.upperComponents === 0 ? "maximum" : "saddle";
          events.push({ name: item.id, coordinateMm: item.coordinateMm, beforeMm, afterMm, before: group.before, after: group.after,
            kind, regular: item.qualified, terminal: kind === "saddle" ? null : AutoMovieCurveMath64.clone(item.pointMm) });
        }
    const intervals: Interval[] = sections.slice(1).map((after: Section, i: number): Interval => {
      const before: Section = sections[i]!;
      if (before.coordinateMm === last && after.coordinateMm === ending.afterMm)
        return { beforeMm: last, afterMm: ending.afterMm,
          groups: [{ before: [0], after: [], supported: true, reason: null }] };
      const original: Branch["groups"][number] | undefined = observed.groups.find((row: Branch["groups"][number]): boolean => row.beforeMm === before.coordinateMm && row.afterMm === after.coordinateMm);
      if (original !== undefined)
        return { beforeMm: before.coordinateMm, afterMm: after.coordinateMm,
          groups: original.groups.map((group: typeof original.groups[number]): Interval["groups"][number] => ({
            before: group.before, after: group.after, supported: group.qualified, reason: group.qualified ? null : "unsupported observed forefoot source group",
          })) };
      const current: Set<number> = new Set(after.loops.map((_: Loop, j: number): number => j));
      const adjacent: Interval["groups"][number][] = [];
      const unpaired: number[] = [];
      for (const [j, a] of before.loops.entries()) {
        const b: number | undefined = [...current].filter((k: number): boolean => after.loops[k]!.winding === a.winding)
          .sort((m: number, n: number): number => separation(a, after.loops[m]!) - separation(a, after.loops[n]!))[0];
        if (b === undefined) unpaired.push(j);
        else { adjacent.push({ before: [j], after: [b], supported: true, reason: null }); current.delete(b); }
      }
      if (unpaired.length !== 0 || current.size !== 0)
        adjacent.push({ before: unpaired, after: [...current], supported: false, reason: "the measured forefoot has no matching section owner" });
      return { beforeMm: before.coordinateMm, afterMm: after.coordinateMm, groups: adjacent };
    });
    const skin: Skin = { points: [], faces: [] };
    const output: ReturnType<typeof generateAutoMovieContourLoft64> = generateAutoMovieContourLoft64({ sections, intervals, events, chordToleranceMm: 0.1 }, {
      vertex: (i: number, p: IAutoMovieCurve64.Vector): void => { skin.points[i] = AutoMovieCurveMath64.clone(p); },
      triangle: (a: number, b: number, c: number): void => { skin.faces.push([a, b, c]); },
      construction: (): void => {},
    });
    if (output.unresolved.length !== 0)
      throw new Error(`The fixed ${side} measured web has unresolved source groups: ${JSON.stringify(output.unresolved)}`);

    // The complete transition includes the last ordinary raw row, the saved
    // parent cubic and the original declared 1-to-2 event. Both parent curves
    // retain four exact root-plane crossings; the error was correspondence,
    // not loss of the negative notch. Keep the original event surface.
    const split: Branch["groups"][number] | undefined = observed.groups.find(({ groups }: Branch["groups"][number]): boolean => groups.some((group: Branch["groups"][number]["groups"][number]): boolean => group.before.length === 1 && group.after.length === 2));
    const correspondence: typeof source.info.firstBranchCorrespondence = source.info.firstBranchCorrespondence;
    const parentIndex: number = sections.findIndex((section: Section): boolean => section.coordinateMm === split?.beforeMm);
    const beforeSection: Section | undefined = sections[parentIndex - 1];
    const rawRow: typeof source.rows[number] | undefined = source.rows.find((row: typeof source.rows[number]): boolean => row.station === beforeSection?.coordinateMm);
    const rawLoops: NonNullable<typeof rawRow>["loops"] | undefined = rawRow?.loops.filter((loop: NonNullable<typeof rawRow>["loops"][number]): boolean => loop.closed);
    const parentSection: Branch["sections"][number] | undefined = observed.sections.find((section: Branch["sections"][number]): boolean => section.coordinateMm === split?.beforeMm);
    const from: number[] | undefined = rawLoops?.[0]?.points[correspondence?.beforeHostVertex ?? -1];
    const to: number[] | undefined = parentSection?.loops[0]?.curve.spans[correspondence?.afterToeSpan ?? -1]?.[0];
    if (split === undefined || correspondence === undefined || beforeSection === undefined ||
      rawLoops?.length !== 1 || parentSection?.loops.length !== 1 || from === undefined || to === undefined)
      throw new Error("The original F1 source passage lacks its authored physical curve correspondence");
    const ranges: typeof output.primitiveRanges = output.primitiveRanges?.filter((item: NonNullable<typeof output.primitiveRanges>[number]): boolean => item.beforeMm === beforeSection.coordinateMm &&
      item.afterMm === split.beforeMm);
    if (ranges?.length !== 1) throw new Error("The original F1 passage is not a single ordinary source interval");
    const port: typeof left.ports[number]["frame"] = (side === "left" ? left : right).ports[5]!.frame;
    sourcePassage(skin, ranges[0]!.firstTriangle, ranges[0]!.triangleCount, n, beforeSection.coordinateMm,
      { origin: AutoMovieCurveMath64.clone(port.origin), u: AutoMovieCurveMath64.clone(port.u), v: AutoMovieCurveMath64.clone(port.v) },
      place(beforeSection.coordinateMm, from), AutoMovieCurveMath64.clone(to));
    return skin;
  }

  /**
   * Match the original host and toe arcs across the raw-walk/cubic boundary.
   * Both complete source profiles have four actual root-plane crossings.
   * Their negative guides retain two positive sheets; a closest-area tiling
   * can otherwise cross from the host source edge to the toe source span.
   * Exact source indices are authored in Native.info.firstBranchCorrespondence.
   * The offline full dual-graph receipt is codex-leg-toe5-full-lineage.json:
   * original left faces 7292/7293 and right 7442/7443 crossed those owners.
   * Cubic negative controls remain negative; no fit or tolerance is changed.
   */
  function sourcePassage(skin: Skin, first: number, count: number, n: V3, before: number, frame: Port["frame"], host: V3, toe: V3): void {
    const original: Face[] = skin.faces.slice(first, first + count);

    /** Source-boundary ownership is indexed, not nearest-point proximity. */
    const key: (a: number, b: number) => string = (a: number, b: number): string => a < b ? `${a},${b}` : `${b},${a}`;
    const edges: Map<string, { a: number; b: number; uses: number }> = new Map();
    for (const face of original)
      for (let i: number = 0; i < 3; ++i) {
        const a: number = face[i]!, b: number = face[(i + 1) % 3]!, k: string = key(a, b);
        const item: { a: number; b: number; uses: number } = edges.get(k) ?? { a, b, uses: 0 };
        ++item.uses;
        edges.set(k, item);
      }
    const next: Map<number, number> = new Map();
    for (const { a, b, uses } of edges.values())
      if (uses === 1) {
        if (next.has(a)) throw new Error("The measured F1 source passage has a branching generating boundary");
        next.set(a, b);
      }
    const used: Set<number> = new Set(), cycles: number[][] = [];
    for (const start of next.keys()) {
      if (used.has(start)) continue;
      const cycle: number[] = [];
      let id: number | undefined = start;
      while (id !== undefined && !used.has(id)) { cycle.push(id); used.add(id); id = next.get(id); }
      if (id !== start) throw new Error("The measured F1 source passage has an open generating curve");
      cycles.push(cycle);
    }
    const parents: number[][] = cycles.filter((row: number[]): boolean => row.every((id: number): boolean => Math.abs(dot(skin.points[id]!, n) - before) < 1e-6));
    if (cycles.length !== 2 || parents.length !== 1) throw new Error("The source passage is not one ordinary pair of closed curves");
    const parent: number[] = parents[0]!;
    const after: number[] = cycles.find((row: number[]): boolean => row !== parent)!.slice().reverse();
    const normal: V3 = AutoMovieCurveMath64.clone(AutoMovieViewAxis.normal(frame));

    /** Read the unchanged exact original root plane sign in world millimetres. */
    const signed: (id: number) => number = (id: number): number => dot(AutoMovieCurveMath64.sub(skin.points[id]!, frame.origin as V3), normal);

    /** Both complete negative source arcs separate the two recorded positive sheets. */
    const partition: (row: number[]) => number[][] = (row: number[]): number[][] => {
      const start: number = row.findIndex((id: number): boolean => signed(id) > 0);
      if (start < 0) throw new Error("A source passage has no observed positive arc");
      const negative: number[][] = [];
      let run: number[] = [];
      for (let k: number = 1; k <= row.length; ++k) {
        const i: number = (start + k) % row.length;
        if (signed(row[i]!) <= 0) run.push(i);
        else if (run.length !== 0) { negative.push(run); run = []; }
      }
      if (negative.length !== 2) throw new Error("The actual F1 source curve does not retain its two separated positive arcs");
      const guides: number[] = negative.map((items: number[]): number => items.reduce((best: number, i: number): number =>
        signed(row[i]!) < signed(row[best]!) ? i : best));
      if (guides.some((i: number): boolean => signed(row[i]!) >= 0)) throw new Error("A source passage guide is not strictly inside the measured negative arc");
      const [a, b]: number[] = guides.sort((x: number, y: number): number => x - y);
      return [row.slice(a!, b! + 1), [...row.slice(b!), ...row.slice(0, a! + 1)]];
    };
    const from: number[][] = partition(parent), to: number[][] = partition(after);

    /** The authored original edge/span point selects its exact physical positive arc. */
    const physical: (parts: number[][], anchor: V3) => number = (parts: number[][], anchor: V3): number => {
      if (dot(AutoMovieCurveMath64.sub(anchor, frame.origin as V3), normal) <= 0)
        throw new Error("An authored source-edge anchor is outside its actual positive arc");
      const matches: number[] = parts.flatMap((row: number[], i: number): number[] =>
        row.some((id: number): boolean => skin.points[id]!.every((x: number, j: number): boolean => x === anchor[j])) ? [i] : []);
      if (matches.length !== 1) throw new Error("An actual source-edge anchor has no unique measured positive arc");
      return matches[0]!;
    };
    const hostFrom: number = physical(from, host), toeTo: number = physical(to, toe);
    const arcs: number[][] = [from[hostFrom]!, from[1 - hostFrom]!];
    const opened: number[][] = [to[1 - toeTo]!, to[toeTo]!];

    /** Geometric arclength parameter within the already source-owned open arc. */
    const distance: (a: V3, b: V3) => number = (a: V3, b: V3): number => Math.hypot(...AutoMovieCurveMath64.sub(a, b));
    const pending: Face[] = [];

    /** Parameterize one complete retained arc without crossing its negative source guide. */
    const clock: (row: number[]) => number[] = (row: number[]): number[] => {
      let length: number = 0;
      const result: number[] = [0];
      for (let i: number = 1; i < row.length; ++i) {
        length += distance(skin.points[row[i]!]!, skin.points[row[i - 1]!]!);
        result.push(length);
      }
      return result.map((value: number): number => value / length);
    };
    for (let k: number = 0; k < 2; ++k) {
      const from: number[] = arcs[k]!, to: number[] = opened[k]!;
      const fa: number[] = clock(from), fb: number[] = clock(to);
      let i: number = 0, j: number = 0;
      while (i + 1 < from.length || j + 1 < to.length) {
        const a: number = from[i]!, b: number = to[j]!;
        if ((fa[i + 1] ?? Infinity) < (fb[j + 1] ?? Infinity)) pending.push([a, from[++i]!, b]);
        else pending.push([a, to[++j]!, b]);
      }
    }
    const admitted: Map<string, { a: number; b: number; uses: number; direction: number }> = new Map();
    for (const face of pending) {
      const [p, q, r]: [V3, V3, V3] = face.map((id: number): V3 => skin.points[id]!) as [V3, V3, V3];
      const u: V3 = AutoMovieCurveMath64.sub(q, p), v: V3 = AutoMovieCurveMath64.sub(r, p);
      const area: number = Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]);
      if (!(area > 0)) throw new Error("An observed source passage collapses its ordinary strip");
      for (let i: number = 0; i < 3; ++i) {
        const a: number = face[i]!, b: number = face[(i + 1) % 3]!, k: string = key(a, b);
        const item: { a: number; b: number; uses: number; direction: number } = admitted.get(k) ?? { a, b, uses: 0, direction: 0 };
        ++item.uses;
        item.direction += a < b ? 1 : -1;
        admitted.set(k, item);
      }
    }
    for (const [k, item] of admitted) {
      const old: { a: number; b: number; uses: number } | undefined = edges.get(k);
      if (item.uses === 1) {
        if (old?.uses !== 1 || old.a !== item.a || old.b !== item.b)
          throw new Error("The source passage changed an exact generating boundary direction");
      } else if (item.uses !== 2 || item.direction !== 0) throw new Error("The source passage has a nonreciprocal internal edge");
    }
    if ([...edges].some(([k, item]: [string, { a: number; b: number; uses: number }]): boolean => item.uses === 1 && admitted.get(k)?.uses !== 1))
      throw new Error("The source passage lost a measured generating curve edge");
    skin.faces.splice(first, count, ...pending);
  }

  /** Original polygon knots become exact straight cubic spans; no authored point is fitted. */
  function line(name: string, raw: V3[], n: V3): Loop {
    const points: V3[] = raw.filter((p: V3, i: number): boolean => p.join(",") !== raw[(i + raw.length - 1) % raw.length]!.join(","));
    const area: number = points.reduce((sum: number, p: V3, i: number): number => {
      const q: V3 = points[(i + 1) % points.length]!;
      return sum + dot([p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]], n);
    }, 0);
    const winding: 1 = exterior(Math.sign(area));
    points.reverse();
    const spans: IAutoMovieCurve64.Span[] = points.map((a: V3, i: number): IAutoMovieCurve64.Span => {
      const b: V3 = points[(i + 1) % points.length]!;
      return [a, AutoMovieCurveMath64.mix(a, b, 1 / 3), AutoMovieCurveMath64.mix(a, b, 2 / 3), b];
    });
    return { winding, curve: {
      type: "cubicBezier", name, closed: true, unit: "mm", phaseUnit: "mm", spans,
      phaseIntervals: spans.map(([a, , , b]: IAutoMovieCurve64.Span): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])),
    } };
  }

  /** Normalize only the original reflected exterior orientation tag. */
  function exterior(sign: number): 1 {
    if (sign !== -1) throw new Error("A recorded F1 forefoot section is not an exterior in the reflected seed chart");
    return 1;
  }

  /** Geometric centroid proximity proposes ordinary component correspondence, not material identity. */
  function separation(a: Loop, b: Loop): number {
    /** Mean of original span starts, used solely for existing candidate ordering. */
    const centre: (loop: Loop) => V3 = ({ curve }: Loop): V3 => {
      const sum: V3 = [0, 0, 0];
      for (const [p] of curve.spans) for (const c of [0, 1, 2] as const) sum[c] += p[c];
      return AutoMovieCurveMath64.scale(sum, 1 / curve.spans.length);
    };
    const p: V3 = centre(a);
    const q: V3 = centre(b);
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  }

  /** Scalar product in the declared unchanged world chart. */
  function dot(a: V3, b: V3): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  /** Locate exact declared port controls only; this is not a coordinate weld. */
  function existing(rail: readonly V3[], positions: readonly number[]): number[] {
    const expected: Set<string> = new Set(rail.map((p: V3): string => p.join(",")));
    const byPoint: Map<string, number> = new Map();
    for (let j: number = 0; j < positions.length; j += 3) {
      const id: string = [positions[j]!, positions[j + 1]!, positions[j + 2]!].join(",");
      if (expected.has(id)) byPoint.set(id, j / 3);
    }
    return rail.map((p: V3): number => {
      const found: number | undefined = byPoint.get(p.join(","));
      if (found === undefined) throw new Error("A measured F1 web or toe port point was not emitted");
      return found;
    });
  }

  /** Read signed rim-edge uses; the assembled-mesh gate separately checks full topology. */
  function direction(indices: readonly number[], rail: readonly number[]): 1 | -1 {
    const edges: Map<number, number> = new Map(rail.map((id: number, i: number): [number, number] => [id, rail[(i + 1) % rail.length]!]));
    let signed: number = 0;
    for (let i: number = 0; i < indices.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = indices[i + j]!;
        const b: number = indices[i + (j + 1) % 3]!;
        if (edges.get(a) === b) ++signed;
        if (edges.get(b) === a) --signed;
      }
    if (Math.abs(signed) !== rail.length) throw new Error("A measured F1 toe or seed rim is not a single directed free boundary");
    return signed > 0 ? 1 : -1;
  }

}
