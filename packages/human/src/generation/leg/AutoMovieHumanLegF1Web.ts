import {
  AutoMovieCurveMath64,
  AutoMovieViewAxis,
  generateAutoMovieContourLoft64,
  tessellateAutoMovieContourStrip64,
  type IAutoMovieContourLoft64,
  type IAutoMovieCurve64,
} from "@automovie/engine";

import { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";
import branches from "../AutoMovieHumanF1NativeBranches.json";
import { AutoMovieHumanFootToes } from "../foot/AutoMovieHumanFootToes";
import { AutoMovieHumanFootWebTrim } from "../foot/AutoMovieHumanFootWebTrim";
import left from "./AutoMovieHumanLegF1Left.json";
import native from "./AutoMovieHumanLegF1Native.json";
import right from "./AutoMovieHumanLegF1Right.json";

type V3 = AutoMovieCurveMath64.V;
type Context = AutoMovieHumanLoftMesh.IContext;
type Section = IAutoMovieContourLoft64.ISection;
type Loop = Section["loops"][number];
type Event = IAutoMovieContourLoft64.IEvent;
type Interval = IAutoMovieContourLoft64.IInterval;
type Face = [number, number, number];
type Skin = { points: V3[]; faces: Face[] };
type Port = { frame: ReturnType<AutoMovieViewAxis.IAxis["at"]>; points: V3[] };

/** Generate the observed forefoot web in its original seed-normal chart. */
export namespace AutoMovieHumanLegF1Web {
  /**
   * Recreate the original 1-to-5 branch before clipping the five actual turned
   * root planes. Its measured nearby events retain separate source ownership.
   */
  export function f1(mesh: Context, side: "left" | "right", points: readonly V3[][]): string[] {
    const original: typeof left | typeof right = side === "left" ? left : right;
    const ports: Port[] = original.ports.map(({ frame }, i: number): Port => ({
      frame: { origin: AutoMovieCurveMath64.clone(frame.origin), u: AutoMovieCurveMath64.clone(frame.u), v: AutoMovieCurveMath64.clone(frame.v) },
      points: points[i]!,
    }));
    if (ports.length !== 6) throw new Error(`The fixed ${side} forefoot needs six observed ports`);
    const seed: Port = ports[0]!;
    const skin: Skin = sectionSkin(side, seed.points);
    const observed = native.patches.find(piece => piece.name === `leg.${side}.toe-web seed.terminal`)?.info.rootTransitions;
    if (observed === undefined) throw new Error("The F1 root transitions have no complete observed authoring table");
    const transitions = ports.slice(1).map((_, i) => observed.find(item => item.digit === i + 1));
    const cuts: Port[] = ports.slice(1).map((port, i) => {
      const transition = transitions[i];
      if (transition === undefined) return port;
      const healthy = transition.rows[0];
      if (healthy === undefined || transition.rows.some(row => row.reversals.length !== 0))
        throw new Error("An observed F1 root transition lacks a regular geometric chart");
      const normal = AutoMovieCurveMath64.clone(AutoMovieViewAxis.normal(port.frame));
      return { frame: { ...port.frame, origin: AutoMovieCurveMath64.add(port.frame.origin as V3,
        AutoMovieCurveMath64.scale(normal, healthy.station)) }, points: healthy.points.map(AutoMovieCurveMath64.clone) };
    });
    const receipts: number[] = [];
    // The native owner cuts in digit order. In particular the fifth oblique
    // plane crosses already removed distal sheets of the other four toes.
    // A cut of the untrimmed whole foot cannot identify that fifth rim.
    for (const [i, port] of cuts.entries()) {
      const { positive, negative } = AutoMovieHumanFootWebTrim.splitSkin(skin, port.frame);
      const components: Face[][] = AutoMovieHumanFootWebTrim.skinComponents(positive);
      const observed = components.flatMap((faces: Face[]) =>
        AutoMovieHumanFootWebTrim.matchingRims(skin.points, faces, port, Infinity));
      const candidates = observed.filter(({ deviation }): boolean => deviation <= 0.5);
      if (candidates.length !== 1)
        throw new Error(`The fixed ${side} toe ${i + 1} has ${candidates.length} cuts within 0.5 mm, prior ${JSON.stringify(receipts)}, current ${JSON.stringify(observed.map(({ deviation }) => deviation))}`);
      const [cut] = candidates;
      receipts.push(cut!.deviation);
      skin.faces = negative.concat(...components.filter((faces: Face[]): boolean => faces !== cut!.faces));
    }
    const rims = cuts.map((port: Port) => {
      const [rim] = AutoMovieHumanFootWebTrim.matchingRims(skin.points, skin.faces, port, 0.5);
      if (rim === undefined) throw new Error(`The fixed ${side} web lost a retained toe cut`);
      return { ring: rim.ring, port };
    });
    // Replace only the final generated tile band at each turned cut. The
    // exact root and the remaining inner rail span a finite physical strip.
    const trims = rims.map(({ ring }, i) => ({ before: transitions[i] === undefined ? withdrawBand(skin, ring) : ring,
      port: ports[i + 1]!, transition: transitions[i] }));
    const seedIds: number[] = existing(seed.points, mesh.positions);
    const seedSign: 1 | -1 = direction(mesh.indices, seedIds);
    const generated: number[] = existing(seed.points, skin.points.flat());
    const flat: number[] = skin.faces.flat();
    const same: boolean = direction(flat, generated) === seedSign;
    const shared: Map<number, number> = new Map(generated.map((id: number, i: number) => [id, seedIds[i]!]));
    const used: Set<number> = new Set(flat);
    for (const id of used) if (!shared.has(id)) shared.set(id, AutoMovieHumanLoftMesh.vertices(mesh, [skin.points[id]!])[0]!);
    for (const [a, b, c] of skin.faces) mesh.indices.push(shared.get(a)!, shared.get(same ? c : b)!, shared.get(same ? b : c)!);
    return trims.map(({ before, port, transition }, i: number): string => {
      const toe: Context = AutoMovieHumanFootToes.f1(side, i + 1, port.points);
      const root: number[] = existing(port.points, toe.positions);
      const off: number = mesh.positions.length / 3;
      for (const coordinate of toe.positions) mesh.positions.push(coordinate);
      for (const index of toe.indices) mesh.indices.push(index + off);
      const a: number[] = before.map((id: number): number => shared.get(id)!);
      const b: number[] = root.map((id: number): number => id + off);
      if (transition === undefined) bridge(mesh, a, b);
      else {
        // Replace the complete root band between genuine transverse curves,
        // not one triangle-adjacency row. The original root itself is unchanged.
        const tiles = AutoMovieHumanFootWebTrim.f1RootLoft(mesh.positions, a, b, port.frame,
          transition.rows.slice(1, -1).map(row => row.points.map(AutoMovieCurveMath64.clone)));
        const directed = (rail: number[]): number[] => {
          const angles = rail.map(id => {
            const d = AutoMovieCurveMath64.sub(AutoMovieHumanLoftMesh.position(mesh, id), port.frame.origin as V3);
            return Math.atan2(dot(d, port.frame.v as V3), dot(d, port.frame.u as V3));
          });
          return rail.map((_, k) => k).sort((x, y) => angles[x]! - angles[y]!).map(k => rail[k]!);
        };
        const first = direction(mesh.indices, directed(a)), last = direction(mesh.indices, directed(b));
        if (first !== -last) throw new Error("The exact F1 root boundaries disagree on their physical winding");
        for (let k = 0; k < tiles.length; k += 3)
          mesh.indices.push(tiles[k]!, tiles[k + (first > 0 ? 1 : 2)]!, tiles[k + (first > 0 ? 2 : 1)]!);
      }
      return `toe.${side}.${i + 1}`;
    });
  }

  /**
   * Generate the complete measured distal sheet before its five rotated cuts.
   * The fixed builder and the offline whole-body comparison read this same
   * input and emission. Coordinates are absolute ISB world millimetres.
   */
  export function sectionSkin(side: "left" | "right", seed: V3[]): Skin {
    const key: string = `leg.${side}.toe-web seed.terminal`;
    const source = native.patches.find((piece): boolean => piece.name === key);
    const observed = branches.records.find((piece): boolean => piece.name === key)?.branches ?? undefined;
    if (source === undefined || observed === undefined) throw new Error(`Missing original ${side} forefoot observations`);
    const axes: V3[] = source.frame.axes.map(AutoMovieCurveMath64.clone);
    const n: V3 = axes[0]!;
    const [u, v] = [axes[1]!, axes[2]!];
    const place = (s: number, [a, b]: readonly number[]): V3 => [
      n[0] * s + u[0] * a! + v[0] * b!, n[1] * s + u[1] * a! + v[1] * b!, n[2] * s + u[2] * a! + v[2] * b!,
    ];
    const seedStation: number = dot(seed[0]!, n);
    const sections: Section[] = [{ coordinateMm: seedStation, loops: [line(key + ".seed", seed, n)] }];
    for (const { station, loops } of source.rows) {
      if (observed.groups.some(({ beforeMm, afterMm }): boolean => station >= beforeMm && station <= afterMm)) continue;
      const closed = loops.filter(({ closed }): boolean => closed);
      if (closed.length !== 0) sections.push({
        coordinateMm: station,
        loops: closed.map(({ points }, i: number): Loop => line(`${key}.${station}.${i}`, points.map((p): V3 => place(station, p)), n)),
      });
    }
    for (const { coordinateMm, loops } of observed.sections)
      sections.push({ coordinateMm, loops: loops.map(({ curve, winding }): Loop => ({
        // All observed branches are exterior. Recovery normalizes point
        // order but retains the reflected source's negative orientation tag.
        winding: exterior(winding),
        curve: {
          type: "cubicBezier", name: curve.name, closed: true, unit: "mm", phaseUnit: "mm",
          phaseIntervals: curve.phaseIntervals,
          spans: curve.spans.map((span): IAutoMovieCurve64.Span => [
            AutoMovieCurveMath64.clone(span[0]!), AutoMovieCurveMath64.clone(span[1]!),
            AutoMovieCurveMath64.clone(span[2]!), AutoMovieCurveMath64.clone(span[3]!),
          ]),
        },
      })) });
    sections.sort((a: Section, b: Section): number => a.coordinateMm - b.coordinateMm);
    const events: Event[] = [];
    for (const { beforeMm, afterMm, groups } of observed.groups)
      for (const group of groups)
        for (const item of group.events) {
          const kind: Event["kind"] = item.lowerComponents === 0 ? "minimum" : item.upperComponents === 0 ? "maximum" : "saddle";
          events.push({ name: item.id, coordinateMm: item.coordinateMm, beforeMm, afterMm, before: group.before, after: group.after,
            kind, regular: item.qualified, terminal: kind === "saddle" ? null : AutoMovieCurveMath64.clone(item.pointMm) });
        }
    const intervals: Interval[] = sections.slice(1).map((after: Section, i: number): Interval => {
      const before: Section = sections[i]!;
      const original = observed.groups.find((row): boolean => row.beforeMm === before.coordinateMm && row.afterMm === after.coordinateMm);
      if (original !== undefined)
        return { beforeMm: before.coordinateMm, afterMm: after.coordinateMm,
          groups: original.groups.map((group): Interval["groups"][number] => ({
            before: group.before, after: group.after, supported: group.qualified, reason: group.qualified ? null : "unsupported observed forefoot source group",
          })) };
      const current: Set<number> = new Set(after.loops.map((_, j: number): number => j));
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
    const output = generateAutoMovieContourLoft64({ sections, intervals, events, chordToleranceMm: 0.1 }, {
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
    const split = observed.groups.find(({ groups }) => groups.some(group => group.before.length === 1 && group.after.length === 2));
    const correspondence = source.info.firstBranchCorrespondence;
    const parentIndex: number = sections.findIndex(section => section.coordinateMm === split?.beforeMm);
    const beforeSection = sections[parentIndex - 1];
    const rawRow = source.rows.find(row => row.station === beforeSection?.coordinateMm);
    const rawLoops = rawRow?.loops.filter(loop => loop.closed);
    const parentSection = observed.sections.find(section => section.coordinateMm === split?.beforeMm);
    const from = rawLoops?.[0]?.points[correspondence?.beforeHostVertex ?? -1];
    const to = parentSection?.loops[0]?.curve.spans[correspondence?.afterToeSpan ?? -1]?.[0];
    if (split === undefined || correspondence === undefined || beforeSection === undefined ||
      rawLoops?.length !== 1 || parentSection?.loops.length !== 1 || from === undefined || to === undefined)
      throw new Error("The original F1 source passage lacks its authored physical curve correspondence");
    const ranges = output.primitiveRanges?.filter(item => item.beforeMm === beforeSection.coordinateMm &&
      item.afterMm === split.beforeMm);
    if (ranges?.length !== 1) throw new Error("The original F1 passage is not a single ordinary source interval");
    const port = (side === "left" ? left : right).ports[5]!.frame;
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
    const key = (a: number, b: number): string => a < b ? `${a},${b}` : `${b},${a}`;
    const edges: Map<string, { a: number; b: number; uses: number }> = new Map();
    for (const face of original)
      for (let i: number = 0; i < 3; ++i) {
        const a: number = face[i]!, b: number = face[(i + 1) % 3]!, k: string = key(a, b);
        const item = edges.get(k) ?? { a, b, uses: 0 };
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
    const parents = cycles.filter(row => row.every(id => Math.abs(dot(skin.points[id]!, n) - before) < 1e-6));
    if (cycles.length !== 2 || parents.length !== 1) throw new Error("The source passage is not one ordinary pair of closed curves");
    const parent: number[] = parents[0]!;
    const after: number[] = cycles.find(row => row !== parent)!.slice().reverse();
    const normal: V3 = AutoMovieCurveMath64.clone(AutoMovieViewAxis.normal(frame));
    const signed = (id: number): number => dot(AutoMovieCurveMath64.sub(skin.points[id]!, frame.origin as V3), normal);
    const partition = (row: number[]): number[][] => {
      const start: number = row.findIndex(id => signed(id) > 0);
      if (start < 0) throw new Error("A source passage has no observed positive arc");
      const negative: number[][] = [];
      let run: number[] = [];
      for (let k: number = 1; k <= row.length; ++k) {
        const i: number = (start + k) % row.length;
        if (signed(row[i]!) <= 0) run.push(i);
        else if (run.length !== 0) { negative.push(run); run = []; }
      }
      if (negative.length !== 2) throw new Error("The actual F1 source curve does not retain its two separated positive arcs");
      const guides: number[] = negative.map(items => items.reduce((best, i): number =>
        signed(row[i]!) < signed(row[best]!) ? i : best));
      if (guides.some(i => signed(row[i]!) >= 0)) throw new Error("A source passage guide is not strictly inside the measured negative arc");
      const [a, b]: number[] = guides.sort((x, y): number => x - y);
      return [row.slice(a!, b! + 1), [...row.slice(b!), ...row.slice(0, a! + 1)]];
    };
    const from: number[][] = partition(parent), to: number[][] = partition(after);
    const physical = (parts: number[][], anchor: V3): number => {
      if (dot(AutoMovieCurveMath64.sub(anchor, frame.origin as V3), normal) <= 0)
        throw new Error("An authored source-edge anchor is outside its actual positive arc");
      const matches: number[] = parts.flatMap((row, i): number[] =>
        row.some(id => skin.points[id]!.every((x, j): boolean => x === anchor[j])) ? [i] : []);
      if (matches.length !== 1) throw new Error("An actual source-edge anchor has no unique measured positive arc");
      return matches[0]!;
    };
    const hostFrom: number = physical(from, host), toeTo: number = physical(to, toe);
    const arcs: number[][] = [from[hostFrom]!, from[1 - hostFrom]!];
    const opened: number[][] = [to[1 - toeTo]!, to[toeTo]!];
    const distance = (a: V3, b: V3): number => Math.hypot(...AutoMovieCurveMath64.sub(a, b));
    const pending: Face[] = [];
    const clock = (row: number[]): number[] => {
      let length: number = 0;
      const result: number[] = [0];
      for (let i: number = 1; i < row.length; ++i) {
        length += distance(skin.points[row[i]!]!, skin.points[row[i - 1]!]!);
        result.push(length);
      }
      return result.map(value => value / length);
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
      const [p, q, r] = face.map(id => skin.points[id]!) as [V3, V3, V3];
      const u: V3 = AutoMovieCurveMath64.sub(q, p), v: V3 = AutoMovieCurveMath64.sub(r, p);
      const area: number = Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]);
      if (!(area > 0)) throw new Error("An observed source passage collapses its ordinary strip");
      for (let i: number = 0; i < 3; ++i) {
        const a: number = face[i]!, b: number = face[(i + 1) % 3]!, k: string = key(a, b);
        const item = admitted.get(k) ?? { a, b, uses: 0, direction: 0 };
        ++item.uses;
        item.direction += a < b ? 1 : -1;
        admitted.set(k, item);
      }
    }
    for (const [k, item] of admitted) {
      const old = edges.get(k);
      if (item.uses === 1) {
        if (old?.uses !== 1 || old.a !== item.a || old.b !== item.b)
          throw new Error("The source passage changed an exact generating boundary direction");
      } else if (item.uses !== 2 || item.direction !== 0) throw new Error("The source passage has a nonreciprocal internal edge");
    }
    if ([...edges].some(([k, item]) => item.uses === 1 && admitted.get(k)?.uses !== 1))
      throw new Error("The source passage lost a measured generating curve edge");
    skin.faces.splice(first, count, ...pending);
  }

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
      phaseIntervals: spans.map(([a, , , b]): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])),
    } };
  }

  function exterior(sign: number): 1 {
    if (sign !== -1) throw new Error("A recorded F1 forefoot section is not an exterior in the reflected seed chart");
    return 1;
  }

  function separation(a: Loop, b: Loop): number {
    const centre = ({ curve }: Loop): V3 => {
      const sum: V3 = [0, 0, 0];
      for (const [p] of curve.spans) for (const c of [0, 1, 2] as const) sum[c] += p[c];
      return AutoMovieCurveMath64.scale(sum, 1 / curve.spans.length);
    };
    const p: V3 = centre(a);
    const q: V3 = centre(b);
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  }

  function dot(a: V3, b: V3): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

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

  function withdrawBand(skin: Skin, trim: readonly number[]): number[] {
    const rim: Set<number> = new Set(trim);
    const removed: Face[] = skin.faces.filter((face: Face): boolean => face.some((id: number): boolean => rim.has(id)));
    skin.faces = skin.faces.filter((face: Face): boolean => face.every((id: number): boolean => !rim.has(id)));
    const wanted: Map<string, [number, number]> = new Map();
    const edge = (a: number, b: number): string => a < b ? `${a},${b}` : `${b},${a}`;
    for (const face of removed)
      for (let i: number = 0; i < 3; ++i) {
        const a: number = face[i]!;
        const b: number = face[(i + 1) % 3]!;
        if (!rim.has(a) && !rim.has(b)) wanted.set(edge(a, b), [a, b]);
      }
    const next: Map<number, number> = new Map();
    for (const face of skin.faces)
      for (let i: number = 0; i < 3; ++i) {
        const a: number = face[i]!;
        const b: number = face[(i + 1) % 3]!;
        if (!wanted.has(edge(a, b))) continue;
        if (next.has(a)) throw new Error("The generated toe band has a branching inner rail");
        next.set(a, b);
      }
    const start: number | undefined = next.keys().next().value;
    if (start === undefined) throw new Error("The generated toe band has no remaining inner rail");
    const ordered: number[] = [start];
    for (let nextId: number | undefined = next.get(start); nextId !== start; nextId = next.get(nextId)) {
      if (nextId === undefined || ordered.length >= next.size) throw new Error("The generated toe band has an open inner rail");
      ordered.push(nextId);
    }
    if (ordered.length !== next.size) throw new Error("The generated toe band has separate inner rails");
    return ordered;
  }

  function direction(indices: readonly number[], rail: readonly number[]): 1 | -1 {
    const edges: Map<number, number> = new Map(rail.map((id: number, i: number) => [id, rail[(i + 1) % rail.length]!]));
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

  function bridge(mesh: Context, lower: number[], upper: number[]): void {
    const before: number[] = direction(mesh.indices, lower) < 0 ? lower : lower.slice().reverse();
    const after: number[] = direction(mesh.indices, upper) > 0 ? upper : upper.slice().reverse();
    const ids: Map<V3, number> = new Map();
    const world = (rail: number[]): V3[] => rail.map((id: number): V3 => {
      const point: V3 = AutoMovieHumanLoftMesh.position(mesh, id);
      ids.set(point, id);
      return point;
    });
    tessellateAutoMovieContourStrip64(world(before), world(after),
      (a: V3, b: V3, c: V3): void => { mesh.indices.push(ids.get(a)!, ids.get(b)!, ids.get(c)!); },
      (point: V3): string => String(ids.get(point)!),
      (observation): void => {
        if (!observation.qualified) throw new Error(observation.diagnostics.join(" | "));
      },
    );
  }
}
