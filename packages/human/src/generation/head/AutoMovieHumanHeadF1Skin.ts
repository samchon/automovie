import {
  AutoMovieCurveMath64, generateAutoMovieContourLoft64, tessellateAutoMovieContourStrip64,
  type IAutoMovieContourLoft64, type IAutoMovieCurve64,
} from "@automovie/engine";

import { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanHeadEyeParts } from "./AutoMovieHumanHeadEyeParts";
import { AutoMovieHumanHeadF1Junctions } from "./AutoMovieHumanHeadF1Junctions";
import observed from "./AutoMovieHumanHeadF1Observed.json";

type V3 = AutoMovieCurveMath64.V;
type Section = IAutoMovieContourLoft64.ISection;
type Interval = IAutoMovieContourLoft64.IInterval;
type Event = IAutoMovieContourLoft64.IEvent;
type Context = AutoMovieHumanLoftMesh.IContext;
type Clock = (typeof observed.clocks)[number];
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
    const charts: Map<string, Chart> = new Map();
    const sections: Section[] = [{
      coordinateMm: 1458, loops: [line("head.fixed.neck", neck, 1, charts)],
    }, ...observed.sections.map(({ coordinateMm, loops }, i: number): Section => ({
      coordinateMm, loops: loops.map(({ points, winding }, j: number): Section["loops"][number] =>
        line(`head.fixed.source.${i}.${j}`, points, winding === -1 ? -1 : 1, charts)),
    }))];
    // The 192-point caller rail is the exact shared trunk boundary. Only this
    // already-established short boundary strip precedes the recorded source.
    const intervals: Interval[] = [{
      beforeMm: 1458, afterMm: sections[1]!.coordinateMm,
      groups: [{ before: [0], after: [0], supported: true, reason: null }],
    }, ...observed.intervals.map((interval): Interval => {
      const groups: readonly Group[] = interval.groups;
      return { beforeMm: interval.beforeMm, afterMm: interval.afterMm,
        groups: groups.map(({ before, after, supported, reason }) => ({ before, after, supported, reason })) };
    })];
    const events: Event[] = observed.events.map((event): Event => {
      const kind: string = event.kind;
      if (kind !== "minimum" && kind !== "maximum" && kind !== "saddle")
        throw new Error(`Unrecognized measured F1 critical: ${event.name}`);
      return { ...event, kind, terminal: event.terminal === null ? null : AutoMovieCurveMath64.clone(event.terminal) };
    });
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
        construction: (id: string, points: readonly IAutoMovieCurve64.Vector[], phase): void => {
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
    const ranges: NonNullable<typeof result.primitiveRanges> = [];
    const neckLimit: number = observed.directNeck.retainedAfterMm;
    const neckSense: 1 | -1 = direction(mesh.indices, required(rims, 1458, 0).indices, "original canonical neck");
    const sides: Map<Clock, { lower: 1 | -1; upper: 1 | -1 }> = new Map();
    for (const clock of observed.clocks) {
      const range = result.primitiveRanges?.find((item): boolean => item.kind === "strip"
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
    // The turned source owner replaces the whole lower domain, including
    // every original split and pole. Its boundary is a preserved healthy
    // section, not a plane moved past an inconvenient child contour.
    for (const range of result.primitiveRanges ?? [])
      if (range.afterMm <= neckLimit) ranges.push(range);
    const removed: Set<number> = new Set(ranges.flatMap(({ firstTriangle, triangleCount }): number[] =>
      Array.from({ length: triangleCount }, (_: unknown, i: number): number => firstTriangle + i)));
    const retained: number[] = [];
    for (let i: number = 0; i < mesh.indices.length; i += 3)
      if (!removed.has(i / 3)) retained.push(mesh.indices[i]!, mesh.indices[i + 1]!, mesh.indices[i + 2]!);
    mesh.indices = retained;
    // Only an actual sourceSlabs one-before/one-after component with no
    // critical event receives this clock. All persistent edge anchors were
    // retained offline. Between anchors this is inferred PL parameter
    // transport, not a material correspondence or a longitudinal guide.
    for (const clock of observed.clocks)
      if (clock.afterMm > neckLimit) ordinary(mesh, rims, clock, sides.get(clock)!);
    turnedNeck(mesh, rims, neckSense);
    for (const interval of observed.intervals)
      for (const group of interval.groups)
        if (group.ear !== null) ear(mesh, rims, interval.afterMm, group);
    for (const wall of observed.walls) {
      const [y, raw]: number[] = wall.rim.split(":").map(Number);
      const row = observed.sections.find((section): boolean => section.coordinateMm === y);
      const loop: number | undefined = row?.loops.findIndex(({ rawOrdinal }): boolean => rawOrdinal === raw);
      if (loop === undefined || loop < 0) throw new Error(`The exact original oral port is absent: ${wall.name}`);
      oral(mesh, required(rims, y!, loop).indices, wall.name,
        wall.name === "lower original oral wall" ? "85:0" : "0:0");
    }
    const last: Section = sections.at(-1)!;
    const crown: number[] = required(rims, last.coordinateMm, 0).indices;
    const top: boolean = direction(mesh.indices, crown, "crown") > 0;
    const apex: number = AutoMovieHumanLoftMesh.vertices(mesh, [AutoMovieCurveMath64.clone(observed.crown)])[0]!;
    AutoMovieHumanLoftMesh.cap(mesh, crown, apex, top);
    for (const join of observed.eyeJoins) {
      if (join.before.length !== 1 || join.after.length !== 1 || !join.proof.sourceSubsetVerified)
        throw new Error("A known eye join lacks its exact source annulus subset");
      eyeReceipts.push(eye(mesh, required(rims, join.beforeMm, join.before[0]!).indices,
        required(rims, join.afterMm, join.after[0]!).indices, `${join.beforeMm}–${join.afterMm}`));
    }
    // Only the previously measured flat ear critical is an authorized
    // unresolved kernel group. Its exact source pole/rail remain explicit;
    // neither its source nor its event qualification is raised to true.
    const earBounds: Set<string> = new Set();
    for (const interval of observed.intervals)
      for (const group of interval.groups)
        if (group.ear !== null) earBounds.add(`${interval.beforeMm}:${interval.afterMm}`);
    const unresolved = result.unresolved.filter(({ beforeMm, afterMm, incoming, outgoing }): boolean =>
      !(earBounds.has(`${beforeMm}:${afterMm}`) && incoming === 0 && outgoing === 1)
      && !observed.externalPorts.some((port): boolean => port.beforeMm === beforeMm && port.afterMm === afterMm
        && port.before.length === incoming && port.after.length === outgoing)
      && !observed.eyeJoins.some((join): boolean => join.beforeMm === beforeMm && join.afterMm === afterMm
        && join.before.length === incoming && join.after.length === outgoing));
    if (unresolved.length !== 0)
      throw new Error(`Fixed F1 source ownership remains unresolved: ${JSON.stringify(unresolved)}`);
    // The two globe owners stay last, byte-for-byte in their published order.
    const eyes: Context = AutoMovieHumanHeadEyeParts.f1();
    const offset: number = mesh.positions.length / 3;
    for (const value of eyes.positions) mesh.positions.push(value);
    for (const index of eyes.indices) mesh.indices.push(offset + index);
    return { mesh, diagnostics: [
      `Fixed head: ${sections.length} world-mm sections, ${events.length} source events; ${observed.clocks.length} ordinary source-component clocks`,
      "Original oral-wall403 section inputs retained; exact source-terminal/port ownership separates those sheets from the exterior",
      ...eyeReceipts,
      `Offline source ${observed.sourceIdentity}; selection ${observed.sourceSelectionIdentity}; clock interiors remain inferred PL`,
    ] };
  }

  /** Consume the turned numerical owner and share both existing physical port directions. */
  function turnedNeck(mesh: Context, rims: ReadonlyMap<string, Rim>, lowerSense: 1 | -1): void {
    const events: Event[] = observed.directNeck.events.map((event): Event => {
      const kind: string = event.kind;
      if (kind !== "minimum" && kind !== "maximum" && kind !== "saddle")
        throw new Error("The turned F1 neck has an unknown original critical kind");
      return { ...event, kind, terminal: event.terminal === null ? null : AutoMovieCurveMath64.clone(event.terminal) };
    });
    const sections: AutoMovieHumanHeadF1Junctions.IClosedNeck["sections"] = observed.directNeck.sections.map((section) => ({
      coordinateMm: section.coordinateMm,
      loops: section.loops.map((loop) => ({
        winding: loop.winding, pointsMm: loop.pointsMm,
        segmentDomains: loop.segmentDomains.map((domain): "lower" | "upper" | null => {
          if (domain !== null && domain !== "lower" && domain !== "upper")
            throw new Error("An observed neck span has an unknown physical ownership domain");
          return domain;
        }),
      })),
    }));
    const part: AutoMovieHumanHeadF1Junctions.IOutput = AutoMovieHumanHeadF1Junctions.neck({ ...observed.directNeck, sections, events });
    const lower: number[] = required(rims, 1458, 0).indices;
    const upper: number[] = required(rims, observed.directNeck.retainedAfterMm, 0).indices;
    const first: number[] | undefined = part.rails.get("neck:bottom"), last: number[] | undefined = part.rails.get("neck:top");
    if (first === undefined || last === undefined) throw new Error("The physical turned neck omitted an original port");
    const offset: number = mesh.positions.length / 3;
    for (const value of part.mesh.positions) mesh.positions.push(value);
    for (const id of part.mesh.indices) mesh.indices.push(id + offset);
    const a: number[] = first.map((id: number): number => id + offset), b: number[] = last.map((id: number): number => id + offset);
    const opposite = (sense: 1 | -1): 1 | -1 => sense === 1 ? -1 : 1;
    const connect = (lo: number[], hi: number[], wantLow: 1 | -1, wantHigh: 1 | -1): void => {
      const begin: number = mesh.indices.length;
      strip(mesh, lo, hi);
      if (direction(mesh.indices.slice(begin), lo, "turned continuation lower") !== wantLow)
        for (let i: number = begin; i < mesh.indices.length; i += 3)
          [mesh.indices[i + 1], mesh.indices[i + 2]] = [mesh.indices[i + 2]!, mesh.indices[i + 1]!];
      const faces: number[] = mesh.indices.slice(begin);
      if (direction(faces, lo, "turned oriented lower") !== wantLow || direction(faces, hi, "turned oriented upper") !== wantHigh)
        throw new Error("The turned source continuation changed one original physical port direction");
    };
    connect(lower, a, lowerSense, opposite(direction(mesh.indices, a, "turned lower free port")));
    connect(b, upper, opposite(direction(mesh.indices, b, "turned upper free port")), opposite(direction(mesh.indices, upper, "retained healthy upper port")));
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
      const mix = (t: number): V3 => [
        a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t,
      ];
      return [a, mix(1 / 3), mix(2 / 3), b];
    });
    const prefix: number[] = [0];
    const phaseIntervals: number[] = spans.map(([a, , , b]): number => {
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
    // Three independent authorities: material winding sets generated rim
    // order, rawSense relates that order to the recorded observations, and
    // transport direction relates the two raw clocks. No coordinate moves.
    const lo = ordered(a, lower, a.chart.rawSense * a.chart.sheetWinding);
    const hi = ordered(b, upper, b.chart.rawSense * b.chart.sheetWinding * clock.direction);
    const first: number = mesh.indices.length;
    AutoMovieHumanLoftMesh.zipper(mesh, lo.indices, lo.phases, hi.indices, hi.phases);
    const faces: number[] = mesh.indices.slice(first);
    const low: 1 | -1 = direction(faces, a.indices, "clock lower");
    const high: 1 | -1 = direction(faces, b.indices, "clock upper");
    if (low === -expected.lower && high === -expected.upper)
      for (let i: number = first; i < mesh.indices.length; i += 3)
        [mesh.indices[i + 1], mesh.indices[i + 2]] = [mesh.indices[i + 2]!, mesh.indices[i + 1]!];
    else if (low !== expected.lower || high !== expected.upper)
      throw new Error("The actual source clock reverses only one original kernel boundary");
    const oriented: number[] = mesh.indices.slice(first);
    if (direction(oriented, a.indices, "oriented lower") !== expected.lower
      || direction(oriented, b.indices, "oriented upper") !== expected.upper)
      throw new Error("The ordinary F1 replacement did not preserve both original indexed rim directions");
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
   * Consume only a recorded source-coherent eye annulus. Its local first-face
   * material publications remain unchanged in the input. They do not justify
   * constant winding across the annulus. Actual indexed free rims determine
   * this existing join; only an independent generated upper sheet can reverse.
   */
  function eye(mesh: Context, lower: number[], upper: number[], name: string): string {
    const a: number[] = direction(mesh.indices, lower, "eye lower") < 0 ? lower : lower.slice().reverse();
    let b: number[] = direction(mesh.indices, upper, "eye upper") > 0 ? upper : upper.slice().reverse();
    let reversed: number = 0;
    if (signedArea(mesh, a) * signedArea(mesh, b) < 0) {
      reversed = reverseSeparateSheet(mesh, lower[0]!, upper[0]!);
      b = b.slice().reverse();
    }
    strip(mesh, a, b);
    return `Known source eye annulus ${name}: actual reciprocal ports joined; ${reversed} independent generated faces reoriented, publication values retained`;
  }

  /** Reverse a whole independent generated sheet, never a source curve or point. */
  function reverseSeparateSheet(mesh: Context, lower: number, upper: number): number {
    const parents: Int32Array = Int32Array.from({ length: mesh.positions.length / 3 }, (_: unknown, i: number): number => i);
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
    const point = (id: number): V3 => {
      const p: V3 = AutoMovieHumanLoftMesh.position(mesh, id);
      ids.set(p, id);
      return p;
    };
    tessellateAutoMovieContourStrip64(a.map(point), b.map(point),
      (x: V3, y: V3, z: V3): void => { mesh.indices.push(ids.get(x)!, ids.get(y)!, ids.get(z)!); },
      (p: V3): string => String(ids.get(p)!),
      (observation): void => { if (!observation.qualified) throw new Error(observation.diagnostics.join(" | ")); });
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
    const next: Map<number, number> = new Map(ring.map((id: number, i: number) => [id, ring[(i + 1) % ring.length]!]));
    const counts: Map<number, { forward: number; backward: number }> = new Map(ring.map((id: number) =>
      [id, { forward: 0, backward: 0 }]));
    for (let i: number = 0; i < indices.length; i += 3)
      for (let j: number = 0; j < 3; j++) {
        const a: number = indices[i + j]!, b: number = indices[i + (j + 1) % 3]!;
        if (next.get(a) === b) counts.get(a)!.forward++;
        if (next.get(b) === a) counts.get(b)!.backward++;
      }
    if ([...counts.values()].every(({ forward, backward }): boolean => forward === 1 && backward === 0)) return 1;
    if ([...counts.values()].every(({ forward, backward }): boolean => forward === 0 && backward === 1)) return -1;
    throw new Error(`The actual F1 port is not one reciprocal free ring: ${name}`);
  }
}
