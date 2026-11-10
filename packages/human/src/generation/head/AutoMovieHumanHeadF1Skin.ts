import { AutoMovieCurveMath64, tessellateAutoMovieContourStrip64, type IAutoMovieContourLoft64, type IAutoMovieCurve64 } from "@automovie/engine";

import { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanHeadEyeParts } from "./AutoMovieHumanHeadEyeParts";
import { AutoMovieHumanHeadF1Junctions } from "./AutoMovieHumanHeadF1Junctions";
import observed from "./AutoMovieHumanHeadF1Observed.json";

/** Absolute source-chart position in millimetres. */
type V3 = AutoMovieCurveMath64.V;
/** Indexed buffers owned by the actual Human loft realization. */
type Context = AutoMovieHumanLoftMesh.IContext;
/** One complete numeric input course, including all of its signed components. */
type Course = (typeof observed.directHead.courses)[number];
/** Existing ordinary-loft declaration, independent of source mesh addresses. */
type Event = IAutoMovieContourLoft64.IEvent;

/**
 * Mission 1's numeric F1 head: a turned under-chin course, the measured
 * Frankfort-up head course, and the original healthy Y-section band between
 * them. Actual oral walls and skin belong to those courses together.
 * No source model, triangle buffer, archive or fitter is read at runtime.
 * Their different physical axes avoid treating a chart-dependent multiple
 * saddle as an anatomical obstruction or deleting one of its branches.
 */
export namespace AutoMovieHumanHeadF1Skin {
  /** Generate all head owners in world mm and retain the caller's exact 192-point neck rail. */
  export function f1(neck: readonly V3[]): { mesh: Context; diagnostics: string[] } {
    if (neck.length !== 192) throw new Error("The fixed F1 head requires the canonical 192-point trunk port");
    const outputs: AutoMovieHumanHeadF1Junctions.IOutput[] = observed.directHead.courses.map(course);
    if (outputs.length !== 2) throw new Error("The fixed F1 head needs its two recorded physical courses");
    const mesh: Context = { positions: [], indices: [], groups: [] };
    const connectionObservations: string[] = [];
    const boundaries: number[][][] = [];
    for (const output of outputs) {
      const offset: number = mesh.positions.length / 3;
      for (const p of output.mesh.positions) mesh.positions.push(p);
      for (const i of output.mesh.indices) mesh.indices.push(i + offset);
      const lower: number[] | undefined = output.rails.get("course:lower");
      const upper: number[] | undefined = output.rails.get("course:upper");
      if (lower === undefined) throw new Error("A physical F1 course did not emit its lower port");
      boundaries.push([lower.map((i: number): number => i + offset),
        ...(upper === undefined ? [] : [upper.map((i: number): number => i + offset)])]);
    }

    // The finite healthy band uses original curves at 1479.1008758544922,
    // 1480.0839233398438, 1481.102066040039 and 1482.0838928222656 mm.
    // Both end walks are the actual free indices of the two ordinary owners;
    // no zero-height connector or positional weld reconciles their sampling.
    let previous: number[] = boundaries[0]![1]!;
    if (previous === undefined) throw new Error("The turned jaw omitted its healthy upper port");
    for (const profile of observed.directHead.connectingProfiles.slice(1, -1)) {
      if (profile.contours.length !== 1 || !profile.contours[0]!.closed)
        throw new Error("A recorded healthy band profile no longer has one complete physical curve");
      const next: number[] = AutoMovieHumanLoftMesh.vertices(mesh,
        profile.contours[0]!.pointsMm.map(AutoMovieCurveMath64.clone));
      connect(mesh, previous, next, false, connectionObservations);
      previous = next;
    }
    connect(mesh, previous, boundaries[1]![0]!, true, connectionObservations);

    // This short physical continuation reaches the original y1458 trunk rail.
    // Its material direction is an offline original-boundary observation,
    // not a winding guessed from a renderer normal or a nearest-point weld.
    const canonical: number[] = AutoMovieHumanLoftMesh.vertices(mesh, neck.map(AutoMovieCurveMath64.clone));
    connect(mesh, boundaries[0]![0]!, canonical, false, connectionObservations);
    if (direction(mesh.indices, canonical) !== observed.directHead.canonicalNeckSense)
      throw new Error("The fixed F1 head disagrees with the canonical neck's actual material direction");

    // The two exact independent globe owners remain last, 1536 faces each.
    const eyes: Context = AutoMovieHumanHeadEyeParts.f1();
    const offset: number = mesh.positions.length / 3;
    for (const p of eyes.positions) mesh.positions.push(p);
    for (const i of eyes.indices) mesh.indices.push(i + offset);
    return { mesh, diagnostics: [
      `Fixed head: ${observed.directHead.courses.map((item: Course): string => item.name + ":" + item.sections.length).join(", ")} world-mm sections`,
      "Turned jaw, measured head-up skin/oral branches and original healthy connecting curves share their actual emitted indices",
      `Offline source ${observed.sourceIdentity}; selection ${observed.sourceSelectionIdentity}; the two original globe owners stay last`,
      // Preserve the actual kernel records from each build through the existing
      // public diagnostics path. They remain observations, not success claims.
      ...outputs.map((output: AutoMovieHumanHeadF1Junctions.IOutput, i: number): string =>
        JSON.stringify({ headCourse: observed.directHead.courses[i]!.name, ...output.observations })),
      ...connectionObservations,
    ] };
  }

  /** Validate imported numeric domains and critical kinds without changing any source coefficient or material publication. */
  function course(data: Course): AutoMovieHumanHeadF1Junctions.IOutput {
    const events: Event[] = data.events.map((event): Event => {
      const kind: string = event.kind;
      if (kind !== "minimum" && kind !== "maximum" && kind !== "saddle")
        throw new Error("The fixed F1 head has an unknown original critical kind");
      return { ...event, kind, terminal: event.terminal === null ? null : AutoMovieCurveMath64.clone(event.terminal) };
    });
    const sections: AutoMovieHumanHeadF1Junctions.IClosedHead["sections"] = data.sections.map((section) => ({
      coordinateMm: section.coordinateMm,
      loops: section.loops.map((loop) => ({
        winding: loop.winding, pointsMm: loop.pointsMm, curve: loop.curve,
        segmentDomains: loop.segmentDomains.map((domain): "lower" | "upper" | null => {
          if (domain !== null && domain !== "lower" && domain !== "upper")
            throw new Error("An original course span has an unknown physical ownership domain");
          return domain;
        }),
      })),
    }));
    return AutoMovieHumanHeadF1Junctions.head({ ...data, sections, events });
  }

  /** Tile one finite physical band; orientation follows both actual incident indexed rims. */
  function connect(mesh: Context, a: readonly number[], b: readonly number[], retainedB: boolean, observations: string[]): void {
    const originalA: 1 | -1 = direction(mesh.indices, a);
    const originalB: 1 | -1 | null = retainedB ? direction(mesh.indices, b) : null;
    const area: (rail: readonly number[]) => number = (rail: readonly number[]): number => rail.reduce((sum: number, id: number, i: number): number => {
      const p: V3 = AutoMovieHumanLoftMesh.position(mesh, id);
      const q: V3 = AutoMovieHumanLoftMesh.position(mesh, rail[(i + 1) % rail.length]!);
      return sum + p[0] * q[2] - q[0] * p[2];
    }, 0);
    const upper: number[] = area(a) * area(b) < 0 ? [...b].reverse() : Array.from(b);
    const ids: Map<IAutoMovieCurve64.Vector, number> = new Map();
    const points: (rail: readonly number[]) => V3[] = (rail: readonly number[]): V3[] => rail.map((id: number): V3 => {
      const p: V3 = AutoMovieHumanLoftMesh.position(mesh, id);
      ids.set(p, id);
      return p;
    });
    const start: number = mesh.indices.length;
    tessellateAutoMovieContourStrip64(points(a), points(upper),
      (p: IAutoMovieCurve64.Vector, q: IAutoMovieCurve64.Vector, r: IAutoMovieCurve64.Vector): void => {
        mesh.indices.push(ids.get(p)!, ids.get(q)!, ids.get(r)!);
      }, (p: IAutoMovieCurve64.Vector): string => String(ids.get(p)!),
      (observation): void => {
        const record: string = JSON.stringify({
          headConnection: { firstWorldYmm: mesh.positions[3 * a[0]! + 1], lastWorldYmm: mesh.positions[3 * b[0]! + 1] },
          stripObservation: observation,
        });
        observations.push(record);
        if (!observation.qualified) throw new Error("A physical head connection is unqualified: " + record);
      });
    if (direction(mesh.indices.slice(start), a) === originalA)
      for (let i: number = start; i < mesh.indices.length; i += 3)
        [mesh.indices[i + 1], mesh.indices[i + 2]] = [mesh.indices[i + 2]!, mesh.indices[i + 1]!];
    const strip: number[] = mesh.indices.slice(start);
    if (direction(strip, a) === originalA || (originalB !== null && direction(strip, b) === originalB))
      throw new Error("A physical course band conflicts with one of its actual incident rims");
  }

  /** Read one coherent free-cycle direction from actual indexed incidence, never equal positions. */
  function direction(indices: readonly number[], rail: readonly number[]): 1 | -1 {
    const uses: Map<string, number> = new Map();
    for (let i: number = 0; i < indices.length; i += 3)
      for (let j: number = 0; j < 3; j++) {
        const key: string = indices[i + j] + ":" + indices[i + (j + 1) % 3];
        uses.set(key, (uses.get(key) ?? 0) + 1);
      }
    const forward: boolean = rail.every((a: number, i: number): boolean =>
      uses.get(a + ":" + rail[(i + 1) % rail.length]) === 1 && !uses.has(rail[(i + 1) % rail.length] + ":" + a));
    const reverse: boolean = rail.every((a: number, i: number): boolean =>
      uses.get(rail[(i + 1) % rail.length] + ":" + a) === 1 && !uses.has(a + ":" + rail[(i + 1) % rail.length]));
    if (forward === reverse) throw new Error("An actual F1 course port is not one coherent indexed free cycle");
    return forward ? 1 : -1;
  }
}
