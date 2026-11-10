import { AutoMovieCurveMath64, generateAutoMovieContourLoft64, sampleAutoMovieSurfaceNetwork, type IAutoMovieContourLoft64, type IAutoMovieCurve64, type IAutoMovieSurfaceNetwork } from "@automovie/engine";

import { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";
import floorInputs from "./AutoMovieHumanHeadF1Floor.json";

import inputs from "./AutoMovieHumanHeadF1JunctionInputs.json";

/** Original triangle range from the existing contour realization. */
type Primitive = NonNullable<IAutoMovieContourLoft64.IResult["primitiveRanges"]>[number];
/** Previously recorded ordinary controls and branch incidence. */
type Recorded = (typeof inputs)[number];

/** The accepted contour-owned F1 head junctions in their observed world charts. */
export namespace AutoMovieHumanHeadF1Junctions {
  /** One locally generated indexed skin and the exact named boundary walks it emits. */
  export interface IOutput {
    /** Absolute ISB world millimetres and newly generated triangles. */
    mesh: { positions: number[]; indices: number[] };

    /** Actual ordered indices of the output's named rails. */
    rails: Map<string, number[]>;
  }

  /**
   * Replace only the under-chin band between two existing healthy indexed rims.
   * The front guide is the lower midline outline in already-recorded turned
   * world-mm sections; oral/globe heights are outside this band. A local plane
   * through the two actual anterior rim points and the measured forward axis
   * selects that outline. No original mesh, cap or global chart is consumed.
   * The public Coons owner interpolates four boundary curves. Its Catmull-Rom
   * boundary interpolation is a local construction, not exact PL replay or a
   * surface-error/normal-continuity certificate. Original outer rim indices stay.
   */
  export function floor(
    mesh: AutoMovieHumanLoftMesh.IContext,
    lower: readonly number[],
    upper: readonly number[],
    backGuide: readonly AutoMovieCurveMath64.V[],
  ): string {
    /** Actual constructor coordinates, millimetres. */
    type V = AutoMovieCurveMath64.V;
    /** Existing public network declaration; its point fields use metres. */
    type Network = IAutoMovieSurfaceNetwork;
    /** Read one existing index without changing its identity. */
    const point: (id: number) => V = (id: number): V => AutoMovieHumanLoftMesh.position(mesh, id);
    /** Convex-neck anterior/posterior rim features, never used for lips or eyes. */
    const extreme: (ring: readonly number[], sign: 1 | -1) => number =
      (ring: readonly number[], sign: 1 | -1): number => ring.reduce((best: number, id: number): number =>
        sign * point(id)[0] > sign * point(best)[0] ? id : best);
    const lf: number = extreme(lower, 1), lb: number = extreme(lower, -1);
    const uf: number = extreme(upper, 1), ub: number = extreme(upper, -1);
    const start: V = point(lf), end: V = point(uf);
    const axis: V = AutoMovieCurveMath64.clone(floorInputs.frame.n);
    const along: V = AutoMovieCurveMath64.sub(end, start);
    const normal: V = [
      axis[1] * along[2] - axis[2] * along[1],
      axis[2] * along[0] - axis[0] * along[2],
      axis[0] * along[1] - axis[1] * along[0],
    ];
    /** Signed scalar projection in the recorded plane, not an angular clock. */
    const dot: (a: readonly number[], b: readonly number[]) => number =
      (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
    const low: number = dot(start, axis), high: number = dot(end, axis);
    if (!(high > low) || !(dot(normal, normal) > 0))
      throw new Error("The local floor's measured axis does not advance between its actual rims");
    const front: V[] = [start];
    for (const section of floorInputs.sections) {
      if (section.coordinateMm <= low || section.coordinateMm >= high) continue;
      const crossings: V[] = [];
      for (const curve of section.curves) {
        const values: V[] = curve.pointsMm.map(AutoMovieCurveMath64.clone);
        const count: number = curve.closed ? values.length : values.length - 1;
        for (let i: number = 0; i < count; i++) {
          const a: V = values[i]!, b: V = values[(i + 1) % values.length]!;
          const da: number = dot(AutoMovieCurveMath64.sub(a, start), normal);
          const db: number = dot(AutoMovieCurveMath64.sub(b, start), normal);
          if (da === 0) crossings.push(a);
          if ((da < 0 && db > 0) || (da > 0 && db < 0))
            crossings.push(AutoMovieCurveMath64.mix(a, b, da / (da - db)));
        }
      }
      // The anatomical floor is the lower envelope of this turned slice.
      // This is below all recorded oral walls; no child or opening is capped.
      const floor: V | undefined = crossings.filter((p: V): boolean =>
        p[1] >= floorInputs.boundsMm[0]! && p[1] <= floorInputs.boundsMm[1]!)
        .reduce<V | undefined>((best: V | undefined, p: V): V => best === undefined || p[1] < best[1] ? p : best, undefined);
      if (floor !== undefined) front.push(floor);
    }
    front.push(end);
    if (front.length < 3) throw new Error("Recorded turned floor curves do not span the local boundary pair");
    /** Original whole-cycle order restricted to one side of the neck. */
    const arc: (ring: readonly number[], from: number, to: number, step: 1 | -1) => V[] =
      (ring: readonly number[], from: number, to: number, step: 1 | -1): V[] => {
        const values: V[] = [];
        let at: number = ring.indexOf(from);
        do { values.push(point(ring[at]!)); if (ring[at] === to) break; at = (at + step + ring.length) % ring.length; }
        while (values.length <= ring.length);
        if (values.length > ring.length) throw new Error("A local floor rim lost its ordered side");
        return values;
      };
    const ll: V[] = arc(lower, lf, lb, 1), lr: V[] = arc(lower, lf, lb, -1);
    const ul: V[] = arc(upper, uf, ub, 1), ur: V[] = arc(upper, uf, ub, -1);
    const rows: number = front.length - 1;
    const leftColumns: number = Math.max(ll.length, ul.length) - 1;
    const rightColumns: number = Math.max(lr.length, ur.length) - 1;
    /** Physical unit conversion at the public network boundary, exactly once. */
    const metres: (p: V) => import("@automovie/interface").IAutoMovieVector3 =
      (p: V): import("@automovie/interface").IAutoMovieVector3 => ({ x: p[0] / 1000, y: p[1] / 1000, z: p[2] / 1000 });
    /** Counts follow the saved curves, not a new mesh-density target. */
    const counts: (value: number) => IAutoMovieSurfaceNetwork.ICounts = (value: number): IAutoMovieSurfaceNetwork.ICounts =>
      ({ lowest: value, low: value, medium: value, high: value });
    /** Actual source points define the existing public boundary interpolant. */
    const curve: (from: string, to: string, values: readonly V[], count: number) => IAutoMovieSurfaceNetwork.ICurve =
      (from: string, to: string, values: readonly V[], count: number): IAutoMovieSurfaceNetwork.ICurve =>
        ({ from, to, through: values.slice(1, -1).map(metres), segments: counts(count) });
    const network: Network = {
      sweeps: {},
      nodes: { lf: { type: "point", position: metres(start) }, lb: { type: "point", position: metres(point(lb)) },
        uf: { type: "point", position: metres(end) }, ub: { type: "point", position: metres(point(ub)) } },
      curves: {
        ll: curve("lf", "lb", ll, leftColumns), ul: curve("uf", "ub", ul, leftColumns),
        lr: curve("lf", "lb", lr, rightColumns), ur: curve("uf", "ub", ur, rightColumns),
        front: curve("lf", "uf", front, rows),
        back: curve("lb", "ub", [point(lb), ...backGuide, point(ub)], rows),
      },
      patches: [
        { type: "coons", name: "floor.left", sides: [{ type: "curve", curve: "ll" }, { type: "curve", curve: "back" },
          { type: "curve", curve: "ul", reverse: true }, { type: "curve", curve: "front", reverse: true }] },
        { type: "coons", name: "floor.right", sides: [{ type: "curve", curve: "lr", reverse: true }, { type: "curve", curve: "front" },
          { type: "curve", curve: "ur" }, { type: "curve", curve: "back", reverse: true }] },
      ],
    };
    const sampled: ReturnType<typeof sampleAutoMovieSurfaceNetwork> = sampleAutoMovieSurfaceNetwork({ network, tier: "high", fit: false });
    const mapped: Map<number, number> = new Map();
    /** Reuse named network edge identities; never merge by distance. */
    const index: (id: number) => number = (id: number): number => {
      if (!Number.isSafeInteger(id)) throw new Error("A local Coons row lost its named network vertex");
      const found: number | undefined = mapped.get(id);
      if (found !== undefined) return found;
      const value: number = mesh.positions.length / 3;
      mesh.positions.push(sampled.cage.positions[3 * id]! * 1000, sampled.cage.positions[3 * id + 1]! * 1000, sampled.cage.positions[3 * id + 2]! * 1000);
      mapped.set(id, value); return value;
    };
    const grids: Map<string, number>[] = sampled.patches.map((patch: typeof sampled.patches[number]): Map<string, number> => {
      const grid: Map<string, number> = new Map();
      for (const face of patch.faces) for (let k: number = 0; k < 4; k++) {
        const coordinate: typeof sampled.corners[number][number] = sampled.corners[face]![k]!;
        grid.set(coordinate.s + ":" + coordinate.t, sampled.cage.faces[face]![k]!);
      }
      return grid;
    });
    /** Split a retained rim at its actual anterior/posterior features. */
    const endpoint: (ring: readonly number[], f: number, b: number) => { ids: number[]; phases: number[] } =
      (ring: readonly number[], f: number, b: number): { ids: number[]; phases: number[] } => {
        const first: number = ring.indexOf(f), split: number = (ring.indexOf(b) - first + ring.length) % ring.length;
        const ids: number[] = ring.slice(first).concat(ring.slice(0, first));
        return { ids, phases: ids.map((_: number, i: number): number =>
          i <= split ? Math.PI * i / split : Math.PI + Math.PI * (i - split) / (ids.length - split)) };
      };
    let previous: { ids: number[]; phases: number[] } = endpoint(lower, lf, lb);
    for (let j: number = 1; j < rows; j++) {
      const left: number[] = Array.from({ length: leftColumns + 1 }, (_: unknown, i: number): number => index(grids[0]!.get(i / leftColumns + ":" + j / rows)!));
      const right: number[] = Array.from({ length: rightColumns - 1 }, (_: unknown, i: number): number => index(grids[1]!.get((i + 1) / rightColumns + ":" + j / rows)!));
      const ids: number[] = left.concat(right);
      const phases: number[] = ids.map((_: number, i: number): number =>
        i <= leftColumns ? Math.PI * i / leftColumns : Math.PI + Math.PI * (i - leftColumns) / rightColumns);
      AutoMovieHumanLoftMesh.zipper(mesh, previous.ids, previous.phases, ids, phases);
      previous = { ids, phases };
    }
    const final: { ids: number[]; phases: number[] } = endpoint(upper, uf, ub);
    AutoMovieHumanLoftMesh.zipper(mesh, previous.ids, previous.phases, final.ids, final.phases);
    return "Local turned floor: " + front.length + " recorded midline guide stations; actual two outer rims retained; Coons boundary interpolation, no source triangles/caps";
  }

  /** Replay an accepted F1 contour branch using its exact knots and signed incidence. */
  export function of(name: string): IOutput {
    const data: Recorded | undefined = inputs.find((item: Recorded): boolean => item.name === name);
    if (data === undefined) throw new Error(`No recorded F1 head junction named ${name}`);
    const sections: IAutoMovieContourLoft64.ISection[] = data.sections.map(({ coordinateMm, loops }: Recorded["sections"][number]): IAutoMovieContourLoft64.ISection => ({
      coordinateMm,
      loops: loops.map(({ winding, curve }: (typeof loops)[number]): IAutoMovieContourLoft64.ISection["loops"][number] => ({
        winding: winding === -1 ? -1 : 1,
        curve: {
          type: "cubicBezier", name: curve.name, closed: true, unit: "mm", phaseUnit: "mm", phaseIntervals: curve.phaseIntervals,
          spans: curve.spans.map((span: (typeof curve.spans)[number]): IAutoMovieCurve64.Span => [
            AutoMovieCurveMath64.clone(span[0]!), AutoMovieCurveMath64.clone(span[1]!),
            AutoMovieCurveMath64.clone(span[2]!), AutoMovieCurveMath64.clone(span[3]!),
          ]),
        },
      })),
    }));
    const events: IAutoMovieContourLoft64.IEvent[] = data.events.map((event: Recorded["events"][number]): IAutoMovieContourLoft64.IEvent => {
      const kind: string = event.kind;
      if (kind !== "minimum" && kind !== "maximum" && kind !== "saddle") throw new Error(`Invalid F1 event at ${event.name}`);
      return { ...event, kind, terminal: event.terminal === null ? null : AutoMovieCurveMath64.clone(event.terminal) };
    });
    const positions: number[] = [];
    const indices: number[] = [];
    const vertices: Map<IAutoMovieCurve64.Vector, number> = new Map();
    const rails: Map<string, number[]> = new Map();
    const result: ReturnType<typeof generateAutoMovieContourLoft64> = generateAutoMovieContourLoft64(
      { sections, intervals: data.intervals, events, chordToleranceMm: data.chordToleranceMm },
      {
        vertex: (index: number, point: IAutoMovieCurve64.Vector): void => { vertices.set(point, index); positions.push(point[0], point[1], -point[2]); },
        triangle: (a: number, b: number, c: number): void => { indices.push(a, c, b); },
        construction: (id: string, points: readonly IAutoMovieCurve64.Vector[]): void => {
          const key: RegExpExecArray | null = /\.section\.(\d+)\.loop\.(\d+)$/.exec(id);
          const row: (number | undefined)[] = points.map((point: IAutoMovieCurve64.Vector): number | undefined => vertices.get(point));
          if (key !== null && row.every((index: number | undefined): index is number => index !== undefined)) rails.set(`${key[1]}:${key[2]}`, row);
        },
      },
    );
    let keep: readonly Primitive[] | null = null;
    if (name === "forehead exterior") {
      keep = data.intervals.flatMap((interval: Recorded["intervals"][number]): Primitive[] => {
        const group: number = interval.groups.findIndex((item: (typeof interval.groups)[number]): boolean => item.supported && item.before.includes(0) && item.after.includes(0));
        const part: Primitive | undefined = result.primitiveRanges?.find((row: Primitive): boolean =>
          row.kind === "strip" && row.triangleCount > 0 && row.beforeMm === interval.beforeMm && row.afterMm === interval.afterMm && row.group === group);
        const qualified: boolean = result.stripObservations?.some((row: NonNullable<typeof result.stripObservations>[number]): boolean =>
          row.qualified && row.beforeMm === interval.beforeMm && row.afterMm === interval.afterMm && row.group === group) === true;
        return part === undefined || !qualified ? [] : [part];
      });
      if (keep.length !== data.intervals.length) throw new Error("The recorded F1 forehead is incomplete");
      rails.set("forehead:top", rails.get(`${sections.length - 1}:0`)!);
    } else if (result.unresolved.length !== 0) throw new Error(`The fixed F1 head junction ${name} has unresolved source incidence`);
    if (data.lastExterior !== undefined) {
      const cutoff: number = sections[data.lastExterior - data.first]!.coordinateMm;
      keep = (result.primitiveRanges ?? []).filter((range: Primitive): boolean =>
        range.beforeMm < cutoff || !data.intervals.find((interval: Recorded["intervals"][number]): boolean => interval.beforeMm === range.beforeMm)?.groups[range.group]?.before.includes(0));
    }
    if (name === "mouth aperture") {
      rails.set("mouth:first", rails.get("0:0")!);
      rails.set("mouth:last", rails.get(`${sections.length - 1}:0`)!);
    }
    const faces: number[] = keep === null ? indices : keep.flatMap((range: Primitive): number[] =>
      indices.slice(3 * range.firstTriangle, 3 * (range.firstTriangle + range.triangleCount)));
    return { mesh: { positions, indices: faces }, rails };
  }
}
