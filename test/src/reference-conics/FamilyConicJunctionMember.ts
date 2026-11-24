import { AutoMovieViewChain } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection } from "@automovie/human";
import type { AutoMovieVector2Tuple, AutoMovieVector3Tuple, IAutoMovieHumanConicLoft, IAutoMovieHumanConicSection, IAutoMovieViewAxis, IAutoMovieViewChain } from "@automovie/interface";

import type { FamilyConicJunction } from "./FamilyConicJunction";

/** Prepare and read a junction member's section grids and end-plane cut on a fixed course. */
export namespace FamilyConicJunctionMember {
  type V = AutoMovieVector3Tuple;
  type P = AutoMovieVector2Tuple;
  type Family = IAutoMovieHumanConicLoft.IFamily;
  type Resolve = (values: readonly number[]) => IAutoMovieHumanConicSection.IChain;
  type IMember = FamilyConicJunction.IMember;
  type IPlane = FamilyConicJunction.IPlane;
  type IRead = FamilyConicJunction.IRead;
  type ISections = FamilyConicJunction.ISections;

  /**
   * The provider every reading uses by default: a family prepared into its fields' reader, whose closure resolves and chains the fields
   * at each station it is asked. It keeps no results: each call builds its section, and `count` counts them.
   */
  export function sections() {
    const made = {
      count: 0,
      build: (values: readonly number[], resolve: Resolve): IAutoMovieViewChain.ISection => {
        ++made.count;
        return AutoMovieViewChain.of(resolve(values).input);
      },
      prepare: (family: Family, resolve: Resolve = AutoMovieHumanConicSection.prepare(family.layout)) => {
        const read = AutoMovieHumanConicLoft.reader(family);
        return (station: number): IAutoMovieViewChain.ISection => made.build(read(station), resolve);
      },
    };
    return made;
  }

  const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const scale = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  /** The independent variables of a member expressed in its own section fields and reduced knot basis. */
  export interface IFieldColumns {
    /** Each control's field, index in the reduced knot basis and existing finite-difference step. */
    controls: readonly { field: number; knot: number; step: number }[];
    /** The reduced natural spline basis at a station, in the same order as the controls' knot indices. */
    weights: (station: number) => readonly number[];
  }

  /** Prepare one member's fixed course, stations, section layout, phase grids and cut spline before reading changed fields. */
  export function prepareMember(member: IMember, plane: IPlane, columns?: IFieldColumns) {
    const axis: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(member.family);
    const resolve: Resolve = AutoMovieHumanConicSection.prepare(member.family.layout);
    const wedgeStations: readonly number[] = member.wedge ?? [];
    const distinct: number[] = [...new Set([...member.rings, ...member.lines, ...member.bracket, ...wedgeStations])].sort((a, b): number => a - b);
    const phases: number[][] = distinct.map((): number[] => []);
    // Store station/phase indices in the requested grids, with each ray read once at its station.
    const grid = (stations: readonly number[], requested: readonly number[]) => stations.map((s: number) => {
      const station: number = distinct.indexOf(s);
      const own: number[] = phases[station]!;
      const reads: number[] = requested.map((phase: number): number => {
        const index: number = own.indexOf(phase);
        if (index >= 0) return index;
        own.push(phase);
        return own.length - 1;
      });
      return { station, reads };
    });
    const rings = grid(member.rings, member.phases);
    const lines = grid(member.lines, member.guides);
    const bracket = grid(member.bracket, member.cut);
    const wedge = grid(wedgeStations, member.cut);
    const stations = distinct.map((s: number, k: number) => {
      const { origin, u, v } = axis.at(s);
      const ray = AutoMovieViewChain.reader(phases[k]!);
      return {
        s, u: [...u] as V, v: [...v] as V,
        points: (section: IAutoMovieViewChain.ISection): P[] => ray(section).map((r, i: number): P => {
          if (r === null) throw new Error(member.face + ": the section at " + s + " mm has no point at phase " + phases[k]![i]);
          return r.point;
        }),
        world: (p: P): V => add(origin as V, add(scale(u as V, p[0]), scale(v as V, p[1]))),
        weights: columns?.weights(s) ?? [],
      };
    });
    const normals: V[] = rings.map(({ station }): V => cross(stations[station]!.u, stations[station]!.v));
    const spline = prepareCubic(member.bracket);
    const assemble = (sampled: readonly V[][]): IRead => {
      const at = ({ station, reads }: { station: number; reads: number[] }, i: number): V => sampled[station]![reads[i]!]!;
      const ringPoints: V[][] = rings.map((g): V[] => g.reads.map((i: number): V => sampled[g.station]![i]!));
      const linePoints: V[][] = member.guides.map((_, i: number): V[] => lines.map((g): V => at(g, i)));
      const wedgeLines: V[][] = wedge.length === 0 ? [] : member.cut.map((_, i: number): V[] => wedge.map((g): V => at(g, i)));
      return cutReading(member, plane, spline, ringPoints, linePoints, normals, wedgeLines, (i: number): V[] => bracket.map((g): V => at(g, i)));
    };
    const fixed = ({ centres, halves, up, roll, origin, knots, native, layout }: Family): void => {
      const base: Family = member.family;
      const same = (a: unknown, b: unknown): boolean => a === b || JSON.stringify(a) === JSON.stringify(b);
      if (!same(centres, base.centres) || !same(halves, base.halves) || !same(up, base.up) || !same(roll, base.roll) ||
        !same(origin, base.origin) || (origin !== undefined && !same(knots, base.knots)) || native?.axis !== base.native?.axis || !same(layout, base.layout))
        throw new Error(member.face + ": the junction's prepared course or layout changed");
    };
    const read = (family: Family, provider: ISections): IRead => {
      fixed(family);
      const section = provider.prepare(family, resolve);
      return assemble(stations.map((station): V[] => station.points(section(station.s)).map(station.world)));
    };
    const fieldSteps: number[] = [];
    for (const control of columns?.controls ?? []) fieldSteps[control.field] = control.step;
    const reading = (family: Family, provider: ReturnType<typeof sections>) => {
      fixed(family);
      if (columns === undefined || family.extended !== undefined)
        return { base: read(family, provider), moved: null };
      if (family.knots.length !== member.family.knots.length || family.knots.some((k, i): boolean => k !== member.family.knots[i]))
        throw new Error(member.face + ": the junction's prepared field knots changed");
      const fields = AutoMovieHumanConicLoft.reader(family);
      const original = stations.map((station) => {
        const values: number[] = fields(station.s);
        const points: P[] = station.points(provider.build(values, resolve));
        const world: V[] = points.map(station.world);
        // The natural spline is linear in each field's knot values, while its rational ray intersection is not. Take its local
        // one-sided point velocity once per field and sign, then multiply by the corresponding knot weight. Both sides preserve
        // the direction of the original finite difference when a share is held at a layout bound.
        const signs: readonly [number, number] = [Math.min(0, ...station.weights), Math.max(0, ...station.weights)];
        const velocities = fieldSteps.map((step: number, f: number): (P[] | null)[] => signs.map((weight: number): P[] | null => {
          const shift: number = weight * step;
          if (shift === 0) return null;
          const moved: number[] = [...values];
          moved[f]! += shift;
          const section: IAutoMovieViewChain.ISection = provider.build(moved, resolve);
          if (section.fault !== null) return null;
          return station.points(section).map((p: P, i: number): P => [(p[0] - points[i]![0]) / shift, (p[1] - points[i]![1]) / shift]);
        }));
        return { values, points, world, velocities };
      });
      const moved = (index: number): IRead => {
        const control = columns.controls[index]!;
        return assemble(stations.map((station, k: number): V[] => {
          const originalStation = original[k]!;
          const shift: number = station.weights[control.knot]! * control.step;
          if (shift === 0) return originalStation.world;
          const velocity = originalStation.velocities[control.field]?.[shift < 0 ? 0 : 1];
          if (velocity === null || velocity === undefined) {
            const values: number[] = [...originalStation.values];
            values[control.field]! += shift;
            return station.points(provider.build(values, resolve)).map(station.world);
          }
          return originalStation.points.map((p: P, i: number): V =>
            station.world([p[0] + shift * velocity[i]![0], p[1] + shift * velocity[i]![1]]));
        }));
      };
      return { base: assemble(original.map(({ world }): V[] => world)), moved };
    };
    return { read, reading };
  }

  /** Read end-plane crossings and their tangents from the prepared phase lines. */
  function cutReading(member: IMember, plane: IPlane, spline: ReturnType<typeof prepareCubic>, rings: V[][],
    lines: V[][], normals: V[], wedgeLines: V[][], phasePoints: (i: number) => V[]): IRead {
    let along: V = [0, 0, 0];
    const crossing: (number | null)[] = [];
    const tangent = (first: V): void => {
      const l = Math.hypot(...first);
      if (l > 0) along = add(along, scale(first, 1 / l));
      crossing.push(l > 0 ? dot(first, plane.z) / l : 0);
    };
    const cut: (P | null)[] = member.bracket.length < 2 ? [] : member.cut.map((_, index: number): P | null => {
      // The line of this phase through the bracketing stations, its height over the plane, and the crossing between the stations whose
      // heights change sign, on the natural cubic through the line's points (the loft's own interpolation along the station).
      const points: V[] = phasePoints(index);
      const heights: number[] = points.map((p: V): number => dot(sub(p, plane.origin), plane.z));
      const curve = spline(points);
      for (let i = 0; i + 1 < points.length; ++i) {
        const [h0, h1] = [heights[i]!, heights[i + 1]!];
        if (h0 === 0) { tangent(curve(i, member.bracket[i]!).first); return inPlane(points[i]!, plane); }
        if (h0 * h1 > 0) continue;
        const x = (k: number) => member.bracket[k]!;
        let [a, b] = [x(i), x(i + 1)];
        let [ha, hb] = [h0, h1];
        for (let n = 0; n < 60 && b - a > 1e-12 * Math.max(1, Math.abs(b)); ++n) {
          const m = ha === hb ? (a + b) / 2 : Math.min(b, Math.max(a, a + (b - a) * ha / (ha - hb)));
          const mid = m === a || m === b ? (a + b) / 2 : m;
          const hm = dot(sub(curve(i, mid).at, plane.origin), plane.z);
          if (hm === 0) { a = mid; b = mid; break; }
          if (hm * ha < 0) { b = mid; hb = hm; } else { a = mid; ha = hm; }
        }
        const met = curve(i, (a + b) / 2);
        tangent(met.first);
        return inPlane(met.at, plane);
      }
      crossing.push(null);
      return null;
    });
    const length: number = Math.hypot(...along);
    return { face: member.face, rings, lines, cut, normals, axis: cut.length > 0 && length > 0 ? scale(along, 1 / length) : null, crossing, wedgeLines };
  }

  /** A world point's coordinates in the plane. */
  function inPlane(p: V, plane: IPlane): [number, number] {
    const q = sub(p, plane.origin);
    return [dot(q, plane.x), dot(q, plane.y)];
  }

  /** Factor the natural spline's station-only tridiagonal system before reading any phase line. */
  function prepareCubic(stations: readonly number[]): (points: readonly V[]) => (i: number, s: number) => { at: V; first: V } {
    const n: number = stations.length;
    const h: number[] = stations.slice(1).map((s: number, i: number): number => s - stations[i]!);
    if (n === 2) return (points) => (_, s: number) => {
      const w: number = h[0]!, t: number = (s - stations[0]!) / w;
      return { at: add(points[0]!, scale(sub(points[1]!, points[0]!), t)), first: scale(sub(points[1]!, points[0]!), 1 / w) };
    };
    const c: number[] = new Array<number>(n).fill(0);
    const inverse: number[] = new Array<number>(n).fill(1);
    for (let i = 1; i < n - 1; ++i) {
      const diag: number = 2 * (h[i - 1]! + h[i]!) - h[i - 1]! * c[i - 1]!;
      c[i] = h[i]! / diag;
      inverse[i] = 1 / diag;
    }
    const intervals: number[] = h.map((span: number): number => 6 / span);
    return (points: readonly V[]) => {
      // The right-hand side and its moments depend on the points of the phase line, componentwise.
      const moments: V[] = Array.from({ length: n }, (): V => [0, 0, 0]);
      for (let i = 1; i < n - 1; ++i) {
        const rhs: V = sub(scale(sub(points[i + 1]!, points[i]!), intervals[i]!), scale(sub(points[i]!, points[i - 1]!), intervals[i - 1]!));
        moments[i] = scale(sub(rhs, scale(moments[i - 1]!, h[i - 1]!)), inverse[i]!);
      }
      for (let i = n - 2; i >= 1; --i) moments[i] = sub(moments[i]!, scale(moments[i + 1]!, c[i]!));
      return (i: number, s: number): { at: V; first: V } => {
        const w: number = h[i]!;
        const A: number = (stations[i + 1]! - s) / w, B: number = (s - stations[i]!) / w;
        // With dA/ds = -1/w and dB/ds = 1/w, the moment terms' first derivatives have factors -(3 A^2 - 1) w / 6 and (3 B^2 - 1) w / 6.
        return {
          at: add(add(scale(points[i]!, A), scale(points[i + 1]!, B)),
            add(scale(moments[i]!, ((A * A * A - A) * w * w) / 6), scale(moments[i + 1]!, ((B * B * B - B) * w * w) / 6))),
          first: add(scale(sub(points[i + 1]!, points[i]!), 1 / w),
            add(scale(moments[i]!, (-(3 * A * A - 1) * w) / 6), scale(moments[i + 1]!, ((3 * B * B - 1) * w) / 6))),
        };
      };
    };
  }

}
