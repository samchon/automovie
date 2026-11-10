import {
  AutoMovieCurveMath64, generateAutoMovieContourLoft64, tessellateAutoMovieContourStrip64,
  type IAutoMovieContourLoft64, type IAutoMovieCurve64,
} from "@automovie/engine";

import { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanHeadEyeParts } from "./AutoMovieHumanHeadEyeParts";
import { AutoMovieHumanHeadF1Junctions } from "./AutoMovieHumanHeadF1Junctions";
import observed from "./AutoMovieHumanHeadF1Observed.json";
import floorInputs from "./AutoMovieHumanHeadF1Floor.json";

/** Absolute world-mm vector. */
type V3 = AutoMovieCurveMath64.V;
/** One fixed generating section. */
type Section = IAutoMovieContourLoft64.ISection;
/** Existing source-owned interval partition. */
type Interval = IAutoMovieContourLoft64.IInterval;
/** Physical branch or terminal declaration. */
type Event = IAutoMovieContourLoft64.IEvent;
/** Actual indexed construction buffers, world mm. */
type Context = AutoMovieHumanLoftMesh.IContext;
/** Previously observed one-to-one PL transport. */
type Clock = (typeof observed.clocks)[number];
/** Saved source component ownership. */
type Group = (typeof observed.intervals)[number]["groups"][number];

/** One original PL curve's positive chart, independently of its signed sheet. */
interface Chart {
  /** Raw observed point ordinal at each positive-chart knot. */
  order: number[];
  /** Physical chord prefix in mm, including the closing edge. */
  prefix: number[];
  /** Raw cutter visit sense relative to the positive chart, not material side. */
  rawSense: 1 | -1;
  /** Actual material-side winding from the original source publication. */
  sheetWinding: 1 | -1;
}

/** A kernel-emitted boundary and the original curve parameter at each vertex. */
interface Rim {
  /** Shared generated indices, never coordinate-welded across sheets. */
  indices: number[];
  /** Parameters in the generating curve's physical-mm chart. */
  phases: number[];
  /** Same generating curve's original positive chart. */
  chart: Chart;
}

/**
 * Fixed F1 head from offline world-mm outlines and measured sheet incidence.
 * The observation frame is n=+Y, u=+Z, v=+X; stored points are already world
 * triples and are not interpreted as a different two-dimensional chart.
 * No original model, archive, acquisition API or original triangles are read
 * at runtime. The 6ed source identities document offline measurements only.
 */
export namespace AutoMovieHumanHeadF1Skin {
  /** Generate the complete exterior, retained original oral lofts and eyes. */
  export function f1(neck: readonly V3[]): { mesh: Context; diagnostics: string[] } {
    const local: ReturnType<typeof mouth> = mouth();
    const charts: Map<string, Chart> = new Map();
    const sections: Section[] = [{
      coordinateMm: 1458, loops: [line("head.fixed.neck", neck, 1, charts)],
    }, ...local.sections.map(({ coordinateMm, loops }: (typeof observed.sections)[number], i: number): Section => ({
      coordinateMm, loops: loops.map(({ points, winding }: (typeof loops)[number], j: number): Section["loops"][number] =>
        line(`head.fixed.source.${i}.${j}`, points, winding === -1 ? -1 : 1, charts)),
    }))];
    // The 192-point caller rail is the exact shared trunk boundary. Only this
    // already-established short boundary strip precedes the recorded source.
    const intervals: Interval[] = [{ beforeMm: 1458, afterMm: sections[1]!.coordinateMm,
      groups: [{ before: [0], after: [0], supported: true, reason: null }] }, ...local.intervals];
    const events: Event[] = local.events;
    const mesh: Context = AutoMovieHumanLoftMesh.create();
    const eyeReceipts: string[] = [];
    const vertex: Map<IAutoMovieCurve64.Vector, number> = new Map();
    const rims: Map<string, Rim> = new Map();
    const result: ReturnType<typeof generateAutoMovieContourLoft64> = generateAutoMovieContourLoft64(
      { sections, intervals, events, chordToleranceMm: 0.1 },
      {
        vertex: (id: number, point: IAutoMovieCurve64.Vector): void => {
          vertex.set(point, id);
          mesh.positions.push(...point);
        },
        triangle: (a: number, b: number, c: number): void => { mesh.indices.push(a, b, c); },
        construction: (id: string, points: readonly IAutoMovieCurve64.Vector[], phase: (point: IAutoMovieCurve64.Vector) => number): void => {
          const address: RegExpExecArray | null = /\.section\.(\d+)\.loop\.(\d+)$/.exec(id);
          if (address === null) throw new Error(`Missing generated F1 ring address: ${id}`);
          const section: Section = sections[Number(address[1])]!;
          const loop: number = Number(address[2]);
          const chart: Chart | undefined = charts.get(section.loops[loop]!.curve.name!);
          if (chart === undefined) throw new Error(`Missing original F1 curve chart: ${id}`);
          // Construction can contain a finite boundary that has no incident
          // primitive yet (the known flat ear birth). It retains its own IDs.
          const indices: number[] = points.map((point: IAutoMovieCurve64.Vector): number => {
            const found: number | undefined = vertex.get(point);
            if (found !== undefined) return found;
            const index: number = mesh.positions.length / 3;
            mesh.positions.push(...point);
            vertex.set(point, index);
            return index;
          });
          rims.set(key(section.coordinateMm, loop), { indices, phases: points.map(phase), chart });
        },
      },
    );
    // Only the separately owned eye annuli replace their neighboring strips.
    const localBounds: readonly (readonly [number, number])[] = [
      [1598.398551940918, 1599.391746520996],
    ];
    const inLocal: (clock: Clock) => boolean = (clock: Clock): boolean => localBounds.some(
      ([a, b]: readonly [number, number]): boolean => clock.afterMm > a && clock.beforeMm < b);
    const ranges: NonNullable<typeof result.primitiveRanges> = [];
    // These are existing healthy source curves outside the under-chin birth/
    // merge. Only their intervening surface is replaced by the turned guide.
    const floorLow: number = floorInputs.boundsMm[0]!;
    const floorHigh: number = floorInputs.boundsMm[1]!;
    const inFloor: (before: number, after: number) => boolean = (before: number, after: number): boolean =>
      before >= floorLow && after <= floorHigh;
    const sides: Map<Clock, { lower: 1 | -1; upper: 1 | -1 }> = new Map();
    for (const clock of observed.clocks) {
      if (inLocal(clock)) continue;
      const range: NonNullable<typeof result.primitiveRanges>[number] | undefined = result.primitiveRanges?.find((item: NonNullable<typeof result.primitiveRanges>[number]): boolean => item.kind === "strip"
        && item.beforeMm === clock.beforeMm && item.afterMm === clock.afterMm && item.group === clock.group);
      if (range === undefined || range.triangleCount === 0)
        throw new Error(`The observed ordinary F1 strip was not emitted: ${clock.beforeMm}–${clock.afterMm}`);
      const faces: number[] = mesh.indices.slice(3 * range.firstTriangle, 3 * (range.firstTriangle + range.triangleCount));
      sides.set(clock, {
        lower: direction(faces, required(rims, clock.beforeMm, clock.before).indices, "original ordinary lower"),
        upper: direction(faces, required(rims, clock.afterMm, clock.after).indices, "original ordinary upper"),
      });
      ranges.push(range);
    }
    for (const eye of floorInputs.eyes) for (const strip of eye.strips) {
      const range: NonNullable<typeof result.primitiveRanges>[number] | undefined = result.primitiveRanges?.find(
        (item: NonNullable<typeof result.primitiveRanges>[number]): boolean => item.beforeMm === strip.beforeMm
          && item.afterMm === strip.afterMm && item.group === strip.group);
      if (range === undefined) throw new Error("The local eye's actual neighboring primitive is absent");
      ranges.push(range);
    }
    ranges.push(...(result.primitiveRanges ?? []).filter((range: NonNullable<typeof result.primitiveRanges>[number]): boolean =>
      inFloor(range.beforeMm, range.afterMm)));
    const removed: Set<number> = new Set(ranges.flatMap(({ firstTriangle, triangleCount }: NonNullable<typeof result.primitiveRanges>[number]): number[] =>
      Array.from({ length: triangleCount }, (_: unknown, i: number): number => firstTriangle + i)));
    const retained: number[] = [];
    for (let i: number = 0; i < mesh.indices.length; i += 3)
      if (!removed.has(i / 3)) retained.push(mesh.indices[i]!, mesh.indices[i + 1]!, mesh.indices[i + 2]!);
    mesh.indices = retained;
    // Only an actual sourceSlabs one-before/one-after component with no
    // critical event receives this clock. All persistent edge anchors were
    // retained offline. Between anchors this is inferred PL parameter
    // transport, not a material correspondence or a longitudinal guide.
    const localReceipts: string[] = [
      "Original mouth sections, source events and their tight physical brackets restored; ordinary mouth strips consume their recorded source-component clocks",
    ];
    for (const clock of observed.clocks)
      if (!inFloor(clock.beforeMm, clock.afterMm) && !inLocal(clock)) ordinary(mesh, rims, clock, sides.get(clock)!);
    const floorA: number[] = required(rims, floorLow, 0).indices;
    const floorB: number[] = required(rims, floorHigh, 0).indices;
    const floorSense: { lower: 1 | -1; upper: 1 | -1 } = {
      lower: direction(mesh.indices, floorA, "floor lower") === 1 ? -1 : 1,
      upper: direction(mesh.indices, floorB, "floor upper") === 1 ? -1 : 1,
    };
    const floorStart: number = mesh.indices.length;
    try { localReceipts.push(AutoMovieHumanHeadF1Junctions.floor(mesh, floorA, floorB)); }
    catch (error: unknown) { throw new Error("The local turned floor could not expose its actual shared ports", {
      cause: { kind: "incomplete-local-head-loft", mesh, result, error },
    }); }
    orient(mesh, floorStart, floorA, floorB, floorSense);
    for (const interval of observed.intervals)
      for (const group of interval.groups)
        if (group.ear !== null) ear(mesh, rims, interval.afterMm, group);
    for (const wall of observed.walls) {
      const [y, raw]: number[] = wall.rim.split(":").map(Number);
      const row: (typeof observed.sections)[number] | undefined = observed.sections.find((section: (typeof observed.sections)[number]): boolean => section.coordinateMm === y);
      const loop: number | undefined = row?.loops.findIndex(({ rawOrdinal }: NonNullable<typeof row>["loops"][number]): boolean => rawOrdinal === raw);
      if (loop === undefined || loop < 0) throw new Error(`The exact original oral port is absent: ${wall.name}`);
      oral(mesh, required(rims, y!, loop).indices, wall.name,
        wall.name === "lower original oral wall" ? "85:0" : "0:0");
    }
    const last: Section = sections.at(-1)!;
    const crown: number[] = required(rims, last.coordinateMm, 0).indices;
    const top: boolean = direction(mesh.indices, crown, "crown") > 0;
    const apex: number = AutoMovieHumanLoftMesh.vertices(mesh, [AutoMovieCurveMath64.clone(observed.crown)])[0]!;
    AutoMovieHumanLoftMesh.cap(mesh, crown, apex, top);
    for (const [i, join] of observed.eyeJoins.entries()) {
      if (join.before.length !== 1 || join.after.length !== 1 || !join.proof.sourceSubsetVerified)
        throw new Error("A known eye join lacks its exact source annulus subset");
      const ends: typeof floorInputs.eyes[number] = floorInputs.eyes[i]!;
      eyeReceipts.push(eye(mesh, required(rims, ends.beforeMm, ends.before).indices,
        required(rims, ends.afterMm, ends.after).indices, `${ends.beforeMm}–${ends.afterMm}`));
    }
    // Only the already recorded flat ear refusal remains authorized.
    const earBounds: Set<string> = new Set();
    for (const interval of observed.intervals)
      for (const group of interval.groups)
        if (group.ear !== null) earBounds.add(`${interval.beforeMm}:${interval.afterMm}`);
    const unresolved: typeof result.unresolved = result.unresolved.filter(({ beforeMm, afterMm, incoming, outgoing }: (typeof result.unresolved)[number]): boolean =>
      !(earBounds.has(`${beforeMm}:${afterMm}`) && incoming === 0 && outgoing === 1)
      && !observed.externalPorts.some((port: (typeof observed.externalPorts)[number]): boolean => port.beforeMm === beforeMm && port.afterMm === afterMm
        && port.before.length === incoming && port.after.length === outgoing)
      && !observed.eyeJoins.some((join: (typeof observed.eyeJoins)[number]): boolean => join.beforeMm === beforeMm && join.afterMm === afterMm
        && join.before.length === incoming && join.after.length === outgoing));
    if (unresolved.length !== 0)
      throw new Error(`Fixed F1 source ownership remains unresolved: ${JSON.stringify(unresolved)}`);
    // The two globe owners stay last, byte-for-byte in their published order.
    const eyes: Context = AutoMovieHumanHeadEyeParts.f1();
    const offset: number = mesh.positions.length / 3;
    for (const value of eyes.positions) mesh.positions.push(value);
    for (const index of eyes.indices) mesh.indices.push(offset + index);
    return { mesh, diagnostics: [
      `Fixed head: ${sections.length} world-mm sections, ${events.length} source events; ${observed.clocks.length} recorded ordinary source-component clocks; local repairs use their explicit source graph`,
      "Original oral-wall403 section inputs retained; exact source-terminal/port ownership separates those sheets from the exterior",
      ...eyeReceipts,
      ...localReceipts,
      `Offline source ${observed.sourceIdentity}; selection ${observed.sourceSelectionIdentity}; clock interiors remain inferred PL`,
    ] };
  }


  /**
   * Restore the original mouth sections and tightly bracketed source events.
   *
   * The former contraction removed eighteen observed sections and six events.
   * It expanded real sub-micron event brackets into broad strips, whose
   * generated faces account for the two large intersecting oral fragments.
   * Keep the complete original source graph before assessing or fairing it;
   * preserving transitive incidence alone does not preserve branch geometry.
   */
  function mouth(): { sections: typeof observed.sections; intervals: Interval[]; events: Event[] } {
    const events: Event[] = observed.events.map((event: typeof observed.events[number]): Event => {
      if (event.kind !== "minimum" && event.kind !== "maximum" && event.kind !== "saddle")
        throw new Error("Invalid recorded mouth event kind");
      return { ...event, kind: event.kind, terminal: event.terminal === null ? null : AutoMovieCurveMath64.clone(event.terminal) };
    });
    return { sections: observed.sections, intervals: observed.intervals, events };
  }

  /** Record a positive PL cubic chart while preserving the actual sheet sense. */
  function line(name: string, input: readonly (readonly number[])[], winding: 1 | -1, charts: Map<string, Chart>): Section["loops"][number] {
    const points: V3[] = input.map(AutoMovieCurveMath64.clone);
    const area: number = points.reduce((sum: number, a: V3, i: number): number => {
      const b: V3 = points[(i + 1) % points.length]!;
      return sum + a[2] * b[0] - a[0] * b[2];
    }, 0);
    const order: number[] = points.map((_: V3, i: number): number => i);
    if (area < 0) order.reverse();
    const ordered: V3[] = order.map((i: number): V3 => points[i]!);
    const spans: IAutoMovieCurve64.Span[] = ordered.map((a: V3, i: number): IAutoMovieCurve64.Span => {
      const b: V3 = ordered[(i + 1) % ordered.length]!;
      const mix: (t: number) => V3 = (t: number): V3 => [
        a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t,
      ];
      return [a, mix(1 / 3), mix(2 / 3), b];
    });
    const prefix: number[] = [0];
    const phaseIntervals: number[] = spans.map(([a, , , b]: IAutoMovieCurve64.Span): number => {
      const length: number = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      if (!(length > 0)) throw new Error(`The original F1 outline has a collapsed edge: ${name}`);
      prefix.push(prefix.at(-1)! + length);
      return length;
    });
    charts.set(name, { order, prefix, rawSense: area > 0 ? 1 : -1, sheetWinding: winding });
    return { winding, curve: { type: "cubicBezier", name, closed: true, unit: "mm", phaseUnit: "mm", spans, phaseIntervals } };
  }

  /** Identify a source-owned generating boundary by physical height and loop. */
  function key(y: number, loop: number): string { return `${y}:${loop}`; }

  /** Require the exact generated port; an absent boundary never gets a cap. */
  function required(rims: ReadonlyMap<string, Rim>, y: number, loop: number): Rim {
    const rim: Rim | undefined = rims.get(key(y, loop));
    if (rim === undefined) throw new Error(`Missing actual F1 port: ${key(y, loop)}`);
    return rim;
  }

  /** Evaluate an inferred saved clock only on its original observed PL edge. */
  function phase(value: number, chart: Chart, values: readonly number[], sense: number): number {
    const period: number = chart.prefix.at(-1)!;
    const p: number = value - Math.floor(value / period) * period;
    let low: number = 0, high: number = chart.order.length;
    while (low + 1 < high) {
      const middle: number = (low + high) >>> 1;
      if (chart.prefix[middle]! <= p) low = middle; else high = middle;
    }
    const a: number = values[chart.order[low]!]!;
    const b: number = values[chart.order[(low + 1) % chart.order.length]!]!;
    let delta: number = b - a;
    if (chart.rawSense * sense > 0 && delta < 0) delta += 1;
    if (chart.rawSense * sense < 0 && delta > 0) delta -= 1;
    const t: number = (p - chart.prefix[low]!) / (chart.prefix[low + 1]! - chart.prefix[low]!);
    return 2 * Math.PI * (a + delta * t);
  }

  /** Rotate or reverse a whole observed cycle; never sort its individual points. */
  function ordered(rim: Rim, phases: number[], sense: number): { indices: number[]; phases: number[] } {
    const indices: number[] = sense < 0 ? rim.indices.slice().reverse() : rim.indices.slice();
    const values: number[] = (sense < 0 ? phases.slice().reverse() : phases.slice())
      .map((value: number): number => value - 2 * Math.PI * Math.floor(value / (2 * Math.PI)));
    const first: number = values.reduce((best: number, value: number, i: number): number => value < values[best]! ? i : best, 0);
    const rotated: number[] = values.slice(first).concat(values.slice(0, first));
    if (rotated.some((value: number, i: number): boolean =>
      !Number.isFinite(value) || (i > 0 && value <= rotated[i - 1]!)))
      throw new Error("An observed F1 clock is not monotone by cycle rotation or whole reversal");
    return { indices: indices.slice(first).concat(indices.slice(0, first)), phases: rotated };
  }

  /** Preserve the original kernel strip's material orientation at both rims. */
  function ordinary(mesh: Context, rims: ReadonlyMap<string, Rim>, clock: Clock, expected: { lower: 1 | -1; upper: 1 | -1 }): void {
    const a: Rim = required(rims, clock.beforeMm, clock.before);
    const b: Rim = required(rims, clock.afterMm, clock.after);
    const lower: number[] = a.phases.map((p: number): number => phase(p, a.chart, clock.lower, 1));
    const upper: number[] = b.phases.map((p: number): number => phase(p, b.chart, clock.upper, clock.direction));
    // Retain material winding, raw visit sense and measured transport sense.
    const lo: ReturnType<typeof ordered> = ordered(a, lower, a.chart.rawSense * a.chart.sheetWinding);
    const hi: ReturnType<typeof ordered> = ordered(b, upper, b.chart.rawSense * b.chart.sheetWinding * clock.direction);
    const first: number = mesh.indices.length;
    if (clock.afterMm <= floorInputs.boundsMm[0]!) {
      // The neck front/left/back ab98127fa5 frames show shallow horizontal
      // facets. Keep every sound ring; use its normal predecessor/successor
      // curves together to replace the straight intervening panels.
      const before: typeof observed.sections[number] | undefined = observed.sections.filter((row: typeof observed.sections[number]): boolean => row.coordinateMm < clock.beforeMm).at(-1);
      const after: typeof observed.sections[number] | undefined = observed.sections.find((row: typeof observed.sections[number]): boolean => row.coordinateMm > clock.afterMm);
      const nearest: (p: V3, row: typeof before) => V3 = (p: V3, row: typeof before): V3 => {
        let result: V3 = p, distance: number = Infinity;
        for (const loop of row?.loops ?? []) for (let i: number = 0; i < loop.points.length; ++i) {
          const x: V3 = AutoMovieCurveMath64.clone(loop.points[i]!), d: V3 = AutoMovieCurveMath64.sub(AutoMovieCurveMath64.clone(loop.points[(i + 1) % loop.points.length]!), x);
          const length2: number = d.reduce((sum: number, value: number): number => sum + value * value, 0);
          const t: number = length2 === 0 ? 0 : Math.max(0, Math.min(1, AutoMovieCurveMath64.sub(p, x).reduce((sum: number, value: number, k: number): number => sum + value * d[k]!, 0) / length2));
          const q: V3 = AutoMovieCurveMath64.add(x, AutoMovieCurveMath64.scale(d, t)), gap: number = Math.hypot(...AutoMovieCurveMath64.sub(q, p));
          if (gap < distance) { distance = gap; result = q; }
        }
        return result;
      };
      const sample: (row: typeof lo, phase: number) => V3 = (row: typeof lo, phase: number): V3 => {
        const u: number = phase < row.phases[0]! ? phase + 2 * Math.PI : phase, ends: number[] = [...row.phases.slice(1), row.phases[0]! + 2 * Math.PI];
        const i: number = ends.findIndex((end: number): boolean => u <= end);
        return AutoMovieCurveMath64.mix(AutoMovieHumanLoftMesh.position(mesh, row.indices[i]!), AutoMovieHumanLoftMesh.position(mesh, row.indices[(i + 1) % row.indices.length]!), (u - row.phases[i]!) / (ends[i]! - row.phases[i]!));
      };
      const phases: number[] = [...new Set([...lo.phases, ...hi.phases])].sort((x: number, y: number): number => x - y);
      const spans: AutoMovieCurveMath64.Span[] = phases.map((phase: number): AutoMovieCurveMath64.Span => {
        const p: V3 = sample(lo, phase), q: V3 = sample(hi, phase), chord: V3 = AutoMovieCurveMath64.sub(q, p);
        const incoming: V3 = AutoMovieCurveMath64.sub(p, nearest(p, before)), outgoing: V3 = AutoMovieCurveMath64.sub(nearest(q, after), q), width: number = Math.hypot(...chord);
        return AutoMovieCurveMath64.hermite(p, q, Math.hypot(...incoming) === 0 ? chord : AutoMovieCurveMath64.scale(incoming, width / Math.hypot(...incoming)), Math.hypot(...outgoing) === 0 ? chord : AutoMovieCurveMath64.scale(outgoing, width / Math.hypot(...outgoing)), 1);
      });
      let previous: typeof lo = lo;
      for (const t of [0.25, 0.5, 0.75]) {
        const row: typeof lo = { indices: AutoMovieHumanLoftMesh.vertices(mesh, spans.map((span: AutoMovieCurveMath64.Span): V3 => AutoMovieCurveMath64.cubic(span, t))), phases };
        AutoMovieHumanLoftMesh.zipper(mesh, previous.indices, previous.phases, row.indices, row.phases); previous = row;
      }
      AutoMovieHumanLoftMesh.zipper(mesh, previous.indices, previous.phases, hi.indices, hi.phases);
    } else AutoMovieHumanLoftMesh.zipper(mesh, lo.indices, lo.phases, hi.indices, hi.phases);
    const faces: number[] = mesh.indices.slice(first);
    const low: 1 | -1 = direction(faces, a.indices, "clock lower");
    const high: 1 | -1 = direction(faces, b.indices, "clock upper");
    if (low === -expected.lower && high === -expected.upper)
      for (let i: number = first; i < mesh.indices.length; i += 3)
        [mesh.indices[i + 1], mesh.indices[i + 2]] = [mesh.indices[i + 2]!, mesh.indices[i + 1]!];
    else if (low !== expected.lower || high !== expected.upper)
      throw new Error("The actual source clock reverses only one original kernel boundary: " + JSON.stringify({ beforeMm: clock.beforeMm, afterMm: clock.afterMm, group: clock.group, low, high, expected }));
    const oriented: number[] = mesh.indices.slice(first);
    if (direction(oriented, a.indices, "oriented lower") !== expected.lower
      || direction(oriented, b.indices, "oriented upper") !== expected.upper)
      throw new Error("The ordinary F1 replacement did not preserve both original indexed rim directions");
  }

  /** Preserve both unchanged boundary directions after one local replacement. */
  function orient(mesh: Context, start: number, a: number[], b: number[], expected: { lower: 1 | -1; upper: 1 | -1 }): void {
    const faces: number[] = mesh.indices.slice(start);
    const lower: 1 | -1 = direction(faces, a, "local lower");
    const upper: 1 | -1 = direction(faces, b, "local upper");
    if (lower === -expected.lower && upper === -expected.upper)
      for (let i: number = start; i < mesh.indices.length; i += 3)
        [mesh.indices[i + 1], mesh.indices[i + 2]] = [mesh.indices[i + 2]!, mesh.indices[i + 1]!];
    else if (lower !== expected.lower || upper !== expected.upper)
      throw new Error("A local head loft reverses only one fixed outer boundary");
  }


  /** Preserve the exact known flat source ear pole and its original short rail. */
  function ear(mesh: Context, rims: ReadonlyMap<string, Rim>, y: number, group: Group): void {
    if (group.ear === null || group.after.length !== 1) throw new Error("Invalid original F1 ear refusal");
    const upper: number[] = required(rims, y, group.after[0]!).indices;
    const lower: number[] = AutoMovieHumanLoftMesh.vertices(mesh, group.ear.rail.map(AutoMovieCurveMath64.clone));
    const b: number[] = direction(mesh.indices, upper, "ear") > 0 ? upper : upper.slice().reverse();
    const a: number[] = signedArea(mesh, lower) * signedArea(mesh, b) > 0 ? lower : lower.slice().reverse();
    strip(mesh, a, b);
    const apex: number = AutoMovieHumanLoftMesh.vertices(mesh, [AutoMovieCurveMath64.clone(group.ear.terminal)])[0]!;
    AutoMovieHumanLoftMesh.cap(mesh, a, apex, true);
  }

  /**
   * Span the two normal eye-rim curves; keep both original indexed boundaries
   * and orient an independent upper sheet from their actual free-rim senses.
   */
  function eye(mesh: Context, lower: number[], upper: number[], name: string): string {
    const first: number = mesh.indices.length;
    const a: number[] = direction(mesh.indices, lower, "eye lower") < 0 ? lower : lower.slice().reverse();
    let b: number[] = direction(mesh.indices, upper, "eye upper") > 0 ? upper : upper.slice().reverse();
    let reversed: number = 0;
    if (signedArea(mesh, a) * signedArea(mesh, b) < 0) {
      reversed = reverseSeparateSheet(mesh, lower[0]!, upper[0]!);
      b = b.slice().reverse();
    }
    // The inner lower-rim wedge in the ab98127fa5 front frame is a flat
    // annulus artifact. Span both sound neighboring curves together, using
    // their unchanged face normals, instead of one long triangular band.
    const normals: number[] = AutoMovieHumanLoftMesh.normals(mesh);
    const nearest: number = b.reduce((best: number, id: number, i: number): number =>
      Math.hypot(...AutoMovieCurveMath64.sub(AutoMovieHumanLoftMesh.position(mesh, id), AutoMovieHumanLoftMesh.position(mesh, a[0]!)))
      < Math.hypot(...AutoMovieCurveMath64.sub(AutoMovieHumanLoftMesh.position(mesh, b[best]!), AutoMovieHumanLoftMesh.position(mesh, a[0]!))) ? i : best, 0);
    b = [...b.slice(nearest), ...b.slice(0, nearest)];
    const rows: { ids: number[]; phases: number[] }[] = [a, b].map((ids: number[]): { ids: number[]; phases: number[] } => {
      const prefix: number[] = [0];
      for (let i: number = 1; i <= ids.length; ++i) prefix.push(prefix[i - 1]! + Math.hypot(...AutoMovieCurveMath64.sub(AutoMovieHumanLoftMesh.position(mesh, ids[i % ids.length]!), AutoMovieHumanLoftMesh.position(mesh, ids[i - 1]!))));
      return { ids, phases: prefix.slice(0, -1).map((p: number): number => p / prefix.at(-1)!) };
    });
    const phases: number[] = [...new Set(rows.flatMap((row: typeof rows[number]): number[] => row.phases))].sort((x: number, y: number): number => x - y);
    const evaluate: (row: typeof rows[number], u: number) => { p: V3; n: V3 } = (row: typeof rows[number], u: number): { p: V3; n: V3 } => {
      const ends: number[] = [...row.phases.slice(1), 1], i: number = ends.findIndex((end: number): boolean => u <= end), j: number = (i + 1) % row.ids.length;
      const t: number = (u - row.phases[i]!) / (ends[i]! - row.phases[i]!), x: number = row.ids[i]!, y: number = row.ids[j]!;
      return { p: AutoMovieCurveMath64.mix(AutoMovieHumanLoftMesh.position(mesh, x), AutoMovieHumanLoftMesh.position(mesh, y), t), n: AutoMovieCurveMath64.mix([normals[3 * x]!, normals[3 * x + 1]!, normals[3 * x + 2]!], [normals[3 * y]!, normals[3 * y + 1]!, normals[3 * y + 2]!], t) };
    };
    const columns: AutoMovieCurveMath64.Span[] = phases.map((u: number): AutoMovieCurveMath64.Span => {
      const x: ReturnType<typeof evaluate> = evaluate(rows[0]!, u), y: ReturnType<typeof evaluate> = evaluate(rows[1]!, u), chord: V3 = AutoMovieCurveMath64.sub(y.p, x.p);
      const tangent: (n: V3) => V3 = (n: V3): V3 => AutoMovieCurveMath64.sub(chord, AutoMovieCurveMath64.scale(n, chord.reduce((sum: number, p: number, k: number): number => sum + p * n[k]!, 0) / (n.reduce((sum: number, p: number): number => sum + p * p, 0) || 1)));
      return AutoMovieCurveMath64.hermite(x.p, y.p, tangent(x.n), tangent(y.n), 1);
    });
    rows.splice(1, 0, ...[0.25, 0.5, 0.75].map((t: number): typeof rows[number] => ({ ids: AutoMovieHumanLoftMesh.vertices(mesh, columns.map((span: AutoMovieCurveMath64.Span): V3 => AutoMovieCurveMath64.cubic(span, t))), phases })));
    for (let i: number = 1; i < rows.length; ++i) AutoMovieHumanLoftMesh.zipper(mesh, rows[i - 1]!.ids, rows[i - 1]!.phases.map((u: number): number => u * 2 * Math.PI), rows[i]!.ids, rows[i]!.phases.map((u: number): number => u * 2 * Math.PI));

    // Zipper and the former contour tiler publish opposite boundary senses.
    // Preserve the actual reciprocal shared rims, not an inferred loop sign.
    orient(mesh, first, lower, upper, {
      lower: direction(mesh.indices.slice(0, first), lower, "eye retained lower") === 1 ? -1 : 1,
      upper: direction(mesh.indices.slice(0, first), upper, "eye retained upper") === 1 ? -1 : 1,
    });
    return `Known source eye annulus ${name}: actual reciprocal ports joined; ${reversed} independent generated faces reoriented, publication values retained`;
  }

  /** Reverse a whole independent generated sheet, never a source curve or point. */
  function reverseSeparateSheet(mesh: Context, lower: number, upper: number): number {
    const parents: Int32Array = Int32Array.from({ length: mesh.positions.length / 3 }, (_: unknown, i: number): number => i);
    const root: (id: number) => number = (id: number): number => {
      while (parents[id] !== id) { parents[id] = parents[parents[id]!]!; id = parents[id]!; }
      return id;
    };
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const a: number = root(mesh.indices[i]!);
      parents[root(mesh.indices[i + 1]!)] = a;
      parents[root(mesh.indices[i + 2]!)] = a;
    }
    const selected: number = root(upper);
    if (selected === root(lower)) throw new Error("The known eye ports already share one component with incompatible boundary senses");
    let count: number = 0;
    for (let i: number = 0; i < mesh.indices.length; i += 3)
      if (root(mesh.indices[i]!) === selected) {
        [mesh.indices[i + 1], mesh.indices[i + 2]] = [mesh.indices[i + 2]!, mesh.indices[i + 1]!];
        count++;
      }
    return count;
  }

  /** Attach the unchanged original ordinary oral owner on its measured port. */
  function oral(mesh: Context, rim: number[], name: string, address: string): void {
    const wall: AutoMovieHumanHeadF1Junctions.IOutput = AutoMovieHumanHeadF1Junctions.of(name);
    const authored: number[] | undefined = wall.rails.get(address);
    if (authored === undefined) throw new Error(`Missing original oral owner port: ${name}`);
    const a: number[] = direction(mesh.indices, rim, name) < 0 ? rim : rim.slice().reverse();
    const b: number[] = direction(wall.mesh.indices, authored, name) > 0 ? authored : authored.slice().reverse();
    const offset: number = mesh.positions.length / 3;
    for (const value of wall.mesh.positions) mesh.positions.push(value);
    for (const id of wall.mesh.indices) mesh.indices.push(offset + id);
    strip(mesh, a, b.map((id: number): number => id + offset));
  }

  /** Ordinary contour loft on actual independent indexed boundaries. */
  function strip(mesh: Context, a: number[], b: number[]): void {
    const ids: Map<V3, number> = new Map();
    const point: (id: number) => V3 = (id: number): V3 => {
      const p: V3 = AutoMovieHumanLoftMesh.position(mesh, id);
      ids.set(p, id);
      return p;
    };
    tessellateAutoMovieContourStrip64(a.map(point), b.map(point),
      (x: V3, y: V3, z: V3): void => { mesh.indices.push(ids.get(x)!, ids.get(y)!, ids.get(z)!); },
      (p: V3): string => String(ids.get(p)!),
      (observation: Parameters<NonNullable<Parameters<typeof tessellateAutoMovieContourStrip64>[4]>>[0]): void => { if (!observation.qualified) throw new Error(observation.diagnostics.join(" | ")); });
  }

  /** Physical signed area in the source (+Z,+X) horizontal chart. */
  function signedArea(mesh: Context, ring: readonly number[]): number {
    return ring.reduce((sum: number, id: number, i: number): number => {
      const a: V3 = AutoMovieHumanLoftMesh.position(mesh, id);
      const b: V3 = AutoMovieHumanLoftMesh.position(mesh, ring[(i + 1) % ring.length]!);
      return sum + a[2] * b[0] - a[0] * b[2];
    }, 0);
  }

  /** Require one coherent free boundary before an existing indexed join. */
  function direction(indices: readonly number[], ring: readonly number[], name: string): 1 | -1 {
    const next: Map<number, number> = new Map(ring.map((id: number, i: number): [number, number] => [id, ring[(i + 1) % ring.length]!]));
    const counts: Map<number, { forward: number; backward: number }> = new Map(ring.map((id: number): [number, { forward: number; backward: number }] =>
      [id, { forward: 0, backward: 0 }]));
    for (let i: number = 0; i < indices.length; i += 3)
      for (let j: number = 0; j < 3; j++) {
        const a: number = indices[i + j]!, b: number = indices[i + (j + 1) % 3]!;
        if (next.get(a) === b) counts.get(a)!.forward++;
        if (next.get(b) === a) counts.get(b)!.backward++;
      }
    if ([...counts.values()].every(({ forward, backward }: { forward: number; backward: number }): boolean => forward === 1 && backward === 0)) return 1;
    if ([...counts.values()].every(({ forward, backward }: { forward: number; backward: number }): boolean => forward === 0 && backward === 1)) return -1;
    throw new Error(`The actual F1 port is not one reciprocal free ring: ${name}`);
  }
}
