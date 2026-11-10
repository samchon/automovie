import { AutoMovieCurveMath64, generateAutoMovieContourLoft64, type IAutoMovieContourLoft64, type IAutoMovieCurve64 } from "@automovie/engine";

import inputs from "./AutoMovieHumanHeadF1JunctionInputs.json";

type Primitive = NonNullable<IAutoMovieContourLoft64.IResult["primitiveRanges"]>[number];

/** The accepted contour-owned F1 head junctions in their observed world charts. */
export namespace AutoMovieHumanHeadF1Junctions {
  /** One locally generated indexed skin and the exact named boundary walks it emits. */
  export interface IOutput {
    /** Absolute ISB world millimetres and newly generated triangles. */
    mesh: { positions: number[]; indices: number[] };

    /** Actual ordered indices of the output's named rails. */
    rails: Map<string, number[]>;
  }

  /** Replay an accepted F1 contour branch using its exact knots and signed incidence. */
  export function of(name: string): IOutput {
    const data = inputs.find((item): boolean => item.name === name);
    if (data === undefined) throw new Error(`No recorded F1 head junction named ${name}`);
    const sections: IAutoMovieContourLoft64.ISection[] = data.sections.map(({ coordinateMm, loops }) => ({
      coordinateMm,
      loops: loops.map(({ winding, curve }) => ({
        winding: winding === -1 ? -1 : 1,
        curve: {
          type: "cubicBezier", name: curve.name, closed: true, unit: "mm", phaseUnit: "mm", phaseIntervals: curve.phaseIntervals,
          spans: curve.spans.map((span): IAutoMovieCurve64.Span => [
            AutoMovieCurveMath64.clone(span[0]!), AutoMovieCurveMath64.clone(span[1]!),
            AutoMovieCurveMath64.clone(span[2]!), AutoMovieCurveMath64.clone(span[3]!),
          ]),
        },
      })),
    }));
    const events: IAutoMovieContourLoft64.IEvent[] = data.events.map((event): IAutoMovieContourLoft64.IEvent => {
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
      keep = data.intervals.flatMap((interval): Primitive[] => {
        const group: number = interval.groups.findIndex((item): boolean => item.supported && item.before.includes(0) && item.after.includes(0));
        const part: Primitive | undefined = result.primitiveRanges?.find((row: Primitive): boolean =>
          row.kind === "strip" && row.triangleCount > 0 && row.beforeMm === interval.beforeMm && row.afterMm === interval.afterMm && row.group === group);
        const qualified: boolean = result.stripObservations?.some((row): boolean =>
          row.qualified && row.beforeMm === interval.beforeMm && row.afterMm === interval.afterMm && row.group === group) === true;
        return part === undefined || !qualified ? [] : [part];
      });
      if (keep.length !== data.intervals.length) throw new Error("The recorded F1 forehead is incomplete");
      rails.set("forehead:top", rails.get(`${sections.length - 1}:0`)!);
    } else if (result.unresolved.length !== 0) throw new Error(`The fixed F1 head junction ${name} has unresolved source incidence`);
    if (data.lastExterior !== undefined) {
      const cutoff: number = sections[data.lastExterior - data.first]!.coordinateMm;
      keep = (result.primitiveRanges ?? []).filter((range: Primitive): boolean =>
        range.beforeMm < cutoff || !data.intervals.find((interval): boolean => interval.beforeMm === range.beforeMm)?.groups[range.group]?.before.includes(0));
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
