import {
  AutoMovieCurveMath64,
  generateAutoMovieContourLoft64,
  tessellateAutoMovieContourStrip64,
  type IAutoMovieContourLoft64,
  type IAutoMovieCurve64,
} from "@automovie/engine";

import { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";
import branches from "../AutoMovieHumanF1NativeBranches.json";
import { AutoMovieHumanHeadEyeParts } from "./AutoMovieHumanHeadEyeParts";
import { AutoMovieHumanHeadF1Junctions } from "./AutoMovieHumanHeadF1Junctions";
import localIncidence from "./AutoMovieHumanHeadF1LocalIncidence.json";
import native from "./AutoMovieHumanHeadF1Native.json";

type V3 = AutoMovieCurveMath64.V;
type Section = IAutoMovieContourLoft64.ISection;
type Event = IAutoMovieContourLoft64.IEvent;
type Interval = IAutoMovieContourLoft64.IInterval;
type Loop = Section["loops"][number];
type Capture = (typeof native.patches)[number];
type Branch = NonNullable<(typeof branches.records)[number]["branches"]>;
type Context = AutoMovieHumanLoftMesh.IContext;

const MOUTH_START: number = 1518.1841659545898;
const MOUTH_END: number = 1525.7013702392578;
const FACE_RIM: number = 1548.9590644836426;

/**
 * Rebuild the selected F1 exterior charts from their original world cuts.
 * These cuts replace the source-triangle clips used by the earlier capture.
 * Source surface connectivity is owned by the separately observed critical
 * brackets. The cuts and their brackets do not retain original mesh indices.
 */
export namespace AutoMovieHumanHeadF1Skin {
  /** Fixed outer skin, the two original eye charts and local contour receipts. */
  export function f1(neck: readonly V3[]): { mesh: AutoMovieHumanLoftMesh.IContext; diagnostics: string[] } {
    const name: string = "head.fixed exterior";
    const sections: Section[] = [{ coordinateMm: 1458, loops: [linear(name + ".neck", neck, 1)] }];
    const bracket: Map<number, Interval> = new Map();
    const events: Event[] = [];
    const diagnostics: string[] = [];

    // The two short oral exterior continuations own the true shared mouth
    // rims. The longer patches own neck, midface, nose, cheek and upper head.
    for (const key of [
      "head.neck.native", "head.exterior.1517.5642395019531", "head.mouth.native",
      "head.exterior.1525.7013702392578", "head.midface.native", "head.nose.native",
      "head.cheek.native", "head.exterior.1584.1547393798828",
    ]) {
      const piece: Capture | undefined = native.patches.find((row: Capture): boolean => row.name === key);
      if (piece === undefined) throw new Error(`The fixed F1 head lacks measured sections for ${key}`);
      const source: Branch | undefined = key === "head.mouth.native" ? localIncidence
        : branches.records.find((row): boolean => row.name === key)?.branches ?? undefined;
      const retained: Section[] = rows(piece, source);
      for (const section of retained) {
        if (section.coordinateMm > sections.at(-1)!.coordinateMm) sections.push(section);
        else if (key === "head.mouth.native" && section.coordinateMm === MOUTH_START)
          sections[sections.length - 1] = section;
      }
      if (source !== undefined)
        for (const { beforeMm, afterMm, groups } of source.groups) {
          bracket.set(beforeMm, {
            beforeMm, afterMm, groups: groups.map((group): Interval["groups"][number] => ({
              before: group.before, after: group.after, supported: group.qualified,
              reason: group.qualified ? null : "The original slab did not establish a supported closed branch",
            })),
          });
          for (const group of groups) for (const point of group.events) {
            const kind: Event["kind"] = point.lowerComponents === 0 ? "minimum" : point.upperComponents === 0 ? "maximum" : "saddle";
            events.push({
              name: `${key}.${point.id}`, coordinateMm: point.coordinateMm, beforeMm, afterMm,
              before: group.before, after: group.after, kind, regular: point.qualified,
              terminal: kind === "saddle" ? null : AutoMovieCurveMath64.clone(point.pointMm),
            });
          }
        }
    }
    const intervals: Interval[] = sections.slice(1).map((after: Section, i: number): Interval => {
      const before: Section = sections[i]!;
      const exact: Interval | undefined = bracket.get(before.coordinateMm);
      if (exact?.afterMm === after.coordinateMm) return exact;
      return { beforeMm: before.coordinateMm, afterMm: after.coordinateMm, groups: continuation(before, after) };
    });
    const mesh: AutoMovieHumanLoftMesh.IContext = AutoMovieHumanLoftMesh.create();
    const indices: Map<IAutoMovieCurve64.Vector, number> = new Map();
    let crown: number[] = [];
    const mouth: Map<number, number[]> = new Map();
    const generatedRims: Map<string, number[]> = new Map();
    const output: ReturnType<typeof generateAutoMovieContourLoft64> = generateAutoMovieContourLoft64(
      { sections, intervals, events, chordToleranceMm: 0.1 },
      {
        vertex: (index: number, point: IAutoMovieCurve64.Vector): void => { indices.set(point, index); mesh.positions.push(...point); },
        triangle: (a: number, b: number, c: number): void => { mesh.indices.push(a, b, c); },
        construction: (id: string, points: readonly IAutoMovieCurve64.Vector[]): void => {
          const address: RegExpExecArray | null = /\.section\.(\d+)\.loop\.(\d+)$/.exec(id);
          if (address !== null) generatedRims.set(`${sections[Number(address[1])]!.coordinateMm}:${address[2]}`,
            points.map((point: IAutoMovieCurve64.Vector): number => indices.get(point)!));
          if (id.startsWith(`${sections.at(-1)!.loops[0]!.curve.name}.section.`)) {
            crown = points.map((point: IAutoMovieCurve64.Vector): number => indices.get(point)!);
          }
          for (const y of [MOUTH_START, MOUTH_END])
            if (id.startsWith(`head.mouth.native.section.${y}.loop.1.section.`))
              mouth.set(y, points.map((point: IAutoMovieCurve64.Vector): number => indices.get(point)!));
        },
      },
    );
    const repairs: [string, () => void][] = [
      ["crown", (): void => {
        if (crown.length < 3 || crown.some((id: number): boolean => id === undefined))
          throw new Error("The measured fixed F1 crown rail was not emitted");
        const reverse: boolean = railDirection(mesh.indices, crown, "crown") > 0;
        // Actual F1 crown critical.1379 above the last ordinary source ring.
        const apex: number = AutoMovieHumanLoftMesh.vertices(mesh, [[15.341168642044067, 1699.6932983398438, 0.3223508596420288]])[0]!;
        AutoMovieHumanLoftMesh.cap(mesh, crown, apex, reverse);
      }],
      ["lower oral wall", (): void => oralWall(mesh, mouth.get(MOUTH_START), "lower original oral wall", "85:0")],
      ["upper oral wall", (): void => oralWall(mesh, mouth.get(MOUTH_END), "upper original oral wall", "0:0")],
      ["right ear terminal", (): void => terminalEar(mesh, intervals, generatedRims)],
      ...localIncidence.eyes.map(({ bounds, owners }, i: number): [string, () => void] => [
        `orbital continuation ${i + 1}`, (): void => {
          if (!owners.every(({ cycles, issueCodes }): boolean =>
            cycles.length === 2 && issueCodes.length === 0 && cycles[0]!.side !== cycles[1]!.side))
            throw new Error("The 6ed source does not establish the observed orbital sheet continuation");
          const pair = missing(intervals, bounds, 1, 1);
          const a: number[] = generatedRims.get(`${bounds[0]}:${pair.before[0]}`)!;
          const b: number[] = generatedRims.get(`${bounds[1]}:${pair.after[0]}`)!;
          joinEye(mesh, a, b, `orbital continuation ${i + 1}`);
        },
      ]),
    ];
    const refused: string[] = [];
    for (const [name, repair] of repairs)
      try {
        repair();
      } catch (error) {
        refused.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    if (refused.length !== 0) throw new Error(`Fixed F1 head boundary qualification failed:\n${refused.join("\n")}`);
    const globe: AutoMovieHumanLoftMesh.IContext = AutoMovieHumanHeadEyeParts.f1();
    const offset: number = mesh.positions.length / 3;
    for (const coordinate of globe.positions) mesh.positions.push(coordinate);
    for (const index of globe.indices) mesh.indices.push(offset + index);
    diagnostics.push(`Fixed head: ${sections.length} measured sections, ${events.length} observed source events`);
    const repaired: Set<string> = new Set([localIncidence.ear.bounds, ...localIncidence.eyes.map(({ bounds }) => bounds)]
      .map(([a, b]): string => `${a}:${b}`));
    for (const group of output.unresolved) {
      if ((group.afterMm === MOUTH_START && group.incoming === 0 && group.outgoing === 1)
        || (group.beforeMm === MOUTH_END && group.incoming === 1 && group.outgoing === 0)
        || repaired.has(`${group.beforeMm}:${group.afterMm}`)) continue;
      diagnostics.push(`${group.beforeMm}–${group.afterMm} mm, ${group.incoming} to ${group.outgoing}: ${group.reason ?? "unresolved measured incidence"}`);
    }
    return { mesh, diagnostics };
  }

  function rows(piece: Capture, branch: Branch | undefined): Section[] {
    const cut: Map<number, Section> = new Map();
    const insert = (coordinateMm: number, loops: readonly (readonly V3[])[], signs?: readonly (1 | -1)[]): void => {
      cut.set(coordinateMm, {
        coordinateMm,
        loops: loops.map((ring, i: number): Loop => linear(`${piece.name}.section.${coordinateMm}.loop.${i}`, ring, signs?.[i])),
      });
    };
    for (const { station, loops } of piece.rows) {
      if (branch?.groups.some(({ beforeMm, afterMm }): boolean => station >= beforeMm && station <= afterMm)) continue;
      const rings: V3[][] = loops.filter(({ closed }): boolean => closed).map(({ points }): V3[] =>
        points.map(([u, v]): V3 => [u!, station, -v!]),
      );
      if (rings.length !== 0) insert(station, rings);
    }
    if (piece.info.nativeRails !== undefined)
      for (const rail of piece.info.nativeRails) {
        const points: V3[] = rail.map(AutoMovieCurveMath64.clone);
        insert(points[0]![1], [points], [1]);
      }
    else {
      const nativeRims = (piece.info.rails ?? []).filter(({ id }): boolean => id.includes(".physical.native."));
      for (const { points } of nativeRims) {
        const coordinate: number = points[0]![1]!;
        if (cut.has(coordinate)) continue;
        const matched = nativeRims.filter((rim): boolean => rim.points[0]![1] === coordinate);
        // These are directed free boundaries of a source slab. Its two ends
        // walk in opposite directions. The recorded exterior and cavity
        // ownership is constant when each end is used as a loft section.
        const signs: (1 | -1)[] = matched.map((rim): 1 | -1 =>
          rim.id === "mouth.physical.native.1" || rim.id === "mouth.physical.native.3" ? -1 : 1,
        );
        insert(coordinate, matched.map((rim): V3[] => rim.points.map(AutoMovieCurveMath64.clone)), signs);
      }
      // At the only gap between the separate native nasal and midface bands,
      // retain the exact 512-point regular loft rail used by both 6ed adapters.
      if (piece.name === "head.midface.native") {
        const rim = piece.info.rails?.find(({ id }): boolean => id === "midface.physical.retained.1");
        if (rim === undefined) throw new Error("The accepted fixed F1 regular face seam is absent");
        insert(FACE_RIM, [rim.points.map(AutoMovieCurveMath64.clone)], [1]);
      }
    }
    for (const section of branch?.sections ?? []) {
      const { coordinateMm } = section;
      cut.set(coordinateMm, {
        coordinateMm,
        loops: section.loops.map(({ winding, curve }, i: number): Loop => ({
          winding: winding === -1 ? -1 : 1,
          curve: {
            type: "cubicBezier", name: `${piece.name}.section.${coordinateMm}.loop.${i}`, closed: true, unit: "mm", phaseUnit: "mm",
            phaseIntervals: curve.phaseIntervals,
            spans: curve.spans.map((span): IAutoMovieCurve64.Span => [
              AutoMovieCurveMath64.clone(span[0]!), AutoMovieCurveMath64.clone(span[1]!),
              AutoMovieCurveMath64.clone(span[2]!), AutoMovieCurveMath64.clone(span[3]!),
            ]),
          },
        })),
      });
    }
    return [...cut.values()].sort((a: Section, b: Section): number => a.coordinateMm - b.coordinateMm);
  }

  function linear(name: string, input: readonly V3[], side?: 1 | -1): Loop {
    const points: V3[] = input.filter((p: V3, i: number): boolean => {
      const previous: V3 = input[(i + input.length - 1) % input.length]!;
      return p[0] !== previous[0] || p[1] !== previous[1] || p[2] !== previous[2];
    });
    const area: number = points.reduce((sum: number, a: V3, i: number): number => {
      const b: V3 = points[(i + 1) % points.length]!;
      return sum + a[2] * b[0] - a[0] * b[2];
    }, 0);
    const winding: 1 | -1 = side ?? (area < 0 ? -1 : 1);
    if (area < 0) points.reverse();
    const spans: IAutoMovieCurve64.Span[] = points.map((a: V3, i: number): IAutoMovieCurve64.Span => {
      const b: V3 = points[(i + 1) % points.length]!;
      const t = (k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1], a[2] + (b[2] - a[2]) * k];
      return [a, t(1 / 3), t(2 / 3), b];
    });
    const phaseIntervals: number[] = spans.map(([a, , , b]): number =>
      Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
    );
    return { winding, curve: { type: "cubicBezier", name, closed: true, unit: "mm", phaseUnit: "mm", spans, phaseIntervals } };
  }

  /** Continue established curves only. An unmatched lane cannot invent a cap or saddle. */
  function continuation(before: Section, after: Section): Interval["groups"] {
    const centre = ({ curve }: Loop): V3 => {
      const sum: V3 = [0, 0, 0];
      for (const [p] of curve.spans) for (const c of [0, 1, 2] as const) sum[c] += p[c];
      return AutoMovieCurveMath64.scale(sum, 1 / curve.spans.length);
    };
    const below: V3[] = before.loops.map(centre);
    const above: V3[] = after.loops.map(centre);
    const free: Set<number> = new Set(after.loops.map((_, i: number): number => i));
    const groups: Interval["groups"][number][] = [];
    const incoming: number[] = [];
    for (const [i, loop] of before.loops.entries()) {
      const candidate: number | undefined = [...free].filter((j: number): boolean => after.loops[j]!.winding === loop.winding)
        .sort((a: number, b: number): number => distance(below[i]!, above[a]!) - distance(below[i]!, above[b]!))[0];
      if (candidate === undefined) incoming.push(i);
      else {
        groups.push({ before: [i], after: [candidate], supported: true, reason: null });
        free.delete(candidate);
      }
    }
    if (incoming.length !== 0 || free.size !== 0)
      groups.push({ before: incoming, after: [...free], supported: false, reason: "The recorded cuts do not establish the remaining sheet continuation" });
    return groups;
  }

  function distance(a: V3, b: V3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  function missing(intervals: readonly Interval[], bounds: readonly number[], before: number, after: number): Interval["groups"][number] {
    const interval: Interval | undefined = intervals.find((row: Interval): boolean => row.beforeMm === bounds[0] && row.afterMm === bounds[1]);
    const groups = interval?.groups.filter((group): boolean =>
      !group.supported && group.before.length === before && group.after.length === after);
    if (groups?.length !== 1) throw new Error(`The known source gap at ${bounds.join("–")} mm has no unique fixed rim owner`);
    return groups[0]!;
  }

  /** Close only the measured right-ear birth and keep its distinct source pole. */
  function terminalEar(mesh: Context, intervals: readonly Interval[], rims: ReadonlyMap<string, number[]>): void {
    const bounds: readonly number[] = localIncidence.ear.bounds;
    const pair = missing(intervals, bounds, 0, 1);
    const upper: number[] | undefined = rims.get(`${bounds[1]}:${pair.after[0]}`);
    const terminal = native.patches.find(({ name }): boolean => name === "head.right ear terminal.terminal")?.info;
    if (upper === undefined || terminal?.rail === undefined || terminal.terminal === undefined)
      throw new Error("The actual right ear birth has no recorded rim or pole");
    const lower: number[] = AutoMovieHumanLoftMesh.vertices(mesh, terminal.rail.map(AutoMovieCurveMath64.clone));
    const b: number[] = railDirection(mesh.indices, upper, "right ear") > 0 ? upper : upper.slice().reverse();
    const a: number[] = area(mesh, lower) * area(mesh, b) > 0 ? lower : lower.slice().reverse();
    appendStrip(mesh, a, b);
    const apex: number = AutoMovieHumanLoftMesh.vertices(mesh, [AutoMovieCurveMath64.clone(terminal.terminal)])[0]!;
    AutoMovieHumanLoftMesh.cap(mesh, a, apex, true);
  }

  /** Join the same source eyelid sheet through a short change of section sense. */
  function joinEye(mesh: Context, lower: number[], upper: number[], name: string): void {
    if (lower === undefined || upper === undefined) throw new Error(`The measured ${name} has a missing generated boundary`);
    const a: number[] = railDirection(mesh.indices, lower, name) < 0 ? lower : lower.slice().reverse();
    let b: number[] = railDirection(mesh.indices, upper, name) > 0 ? upper : upper.slice().reverse();
    if (area(mesh, a) * area(mesh, b) < 0) {
      reverseSeparateSheet(mesh, lower[0]!, upper[0]!);
      b = b.slice().reverse();
    }
    appendStrip(mesh, a, b);
  }

  function area(mesh: Context, rail: readonly number[]): number {
    return rail.reduce((total: number, id: number, i: number): number => {
      const a: V3 = AutoMovieHumanLoftMesh.position(mesh, id);
      const b: V3 = AutoMovieHumanLoftMesh.position(mesh, rail[(i + 1) % rail.length]!);
      return total + a[2] * b[0] - a[0] * b[2];
    }, 0);
  }

  function reverseSeparateSheet(mesh: Context, lower: number, upper: number): void {
    const parents: Int32Array = Int32Array.from({ length: mesh.positions.length / 3 }, (_, i: number): number => i);
    const root = (id: number): number => {
      while (parents[id] !== id) { parents[id] = parents[parents[id]!]!; id = parents[id]!; }
      return id;
    };
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const a: number = root(mesh.indices[i]!);
      parents[root(mesh.indices[i + 1]!)] = a;
      parents[root(mesh.indices[i + 2]!)] = a;
    }
    const selected: number = root(upper);
    if (selected === root(lower)) throw new Error("The measured orbit is already one component with incompatible boundary senses");
    // The generated branch ends in an isolated lid sheet. Orient that sheet
    // as a whole before reconnecting it. The exterior and eyeballs stay put.
    for (let i: number = 0; i < mesh.indices.length; i += 3)
      if (root(mesh.indices[i]!) === selected)
        [mesh.indices[i + 1], mesh.indices[i + 2]] = [mesh.indices[i + 2]!, mesh.indices[i + 1]!];
  }

  /** Reuse the original signed oral-wall loft on each exact native mouth rim. */
  function oralWall(mesh: Context, rim: number[] | undefined, name: string, wallRim: string): void {
    if (rim === undefined || rim.some((id: number): boolean => id === undefined))
      throw new Error(`The retained native oral rim for ${name} was not emitted`);
    const wall: AutoMovieHumanHeadF1Junctions.IOutput = AutoMovieHumanHeadF1Junctions.of(name);
    const authored: number[] | undefined = wall.rails.get(wallRim);
    if (authored === undefined) throw new Error(`The measured ordinary ${name} boundary is absent`);
    const low: number = railDirection(mesh.indices, rim, `${name}, native mouth`);
    const high: number = railDirection(wall.mesh.indices, authored, `${name}, ordinary wall`);
    const lower: number[] = low < 0 ? rim : rim.slice().reverse();
    const upper: number[] = high > 0 ? authored : authored.slice().reverse();
    const offset: number = mesh.positions.length / 3;
    for (const value of wall.mesh.positions) mesh.positions.push(value);
    for (const id of wall.mesh.indices) mesh.indices.push(offset + id);
    appendStrip(mesh, lower, upper.map((id: number): number => offset + id));
  }

  function appendStrip(mesh: Context, lower: number[], upper: number[]): void {
    const ids: Map<V3, number> = new Map();
    const point = (id: number): V3 => {
      const p: V3 = AutoMovieHumanLoftMesh.position(mesh, id);
      ids.set(p, id);
      return p;
    };
    tessellateAutoMovieContourStrip64(lower.map(point), upper.map(point),
      (a: V3, b: V3, c: V3): void => { mesh.indices.push(ids.get(a)!, ids.get(b)!, ids.get(c)!); },
      (p: V3): string => String(ids.get(p)!),
      (observation): void => { if (!observation.qualified) throw new Error(observation.diagnostics.join(" | ")); },
    );
  }

  function railDirection(faces: readonly number[], rail: readonly number[], name: string): 1 | -1 {
    const walk: Map<number, { next: number; forward: number; backward: number }> = new Map(
      rail.map((id: number, i: number) => [id, { next: rail[(i + 1) % rail.length]!, forward: 0, backward: 0 }]),
    );
    for (let i: number = 0; i < faces.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = faces[i + j]!;
        const b: number = faces[i + (j + 1) % 3]!;
        const forward = walk.get(a);
        const backward = walk.get(b);
        if (forward?.next === b) ++forward.forward;
        if (backward?.next === a) ++backward.backward;
      }
    let positive: number = 0;
    let negative: number = 0;
    let unused: number = 0;
    let multiple: number = 0;
    for (const { forward, backward } of walk.values())
      if (forward === 1 && backward === 0) ++positive;
      else if (forward === 0 && backward === 1) ++negative;
      else if (forward + backward === 0) ++unused;
      else ++multiple;
    if (positive === rail.length) return 1;
    if (negative === rail.length) return -1;
    throw new Error(`${name}: ${rail.length} expected free edges, ${positive} forward, ${negative} reverse, ${unused} unused, ${multiple} multiply used`);
  }
}
