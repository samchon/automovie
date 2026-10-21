import type { IAutoMovieModelPart } from "@automovie/interface";
import type { HumanCurve } from "./HumanCurve";
import type { HumanCurveFamily } from "./HumanCurveFamily";

/** Skin and visible construction are two samplings of the same curve authority.
 * This owner introduces no source positions, normals, caps or boundary welds.
 */
export namespace HumanCurveMesh {
  /** A model-space polyline sampled from the generating family. */
  export interface Line {
    /** Feature or guide identity within this generated region. */
    id: string;

    /** Curve samples in metres, matching the emitted model's units. */
    points: HumanCurve.Vector[];
  }

  /** Generated surface and its actual curve construction. */
  export interface Result {
    /** New geometry with analytic normals from the generating derivatives. */
    part: IAutoMovieModelPart;

    /** Principal/intermediate sections and longitudinal guides of that family. */
    construction: Line[];

    /** The two open generating boundaries, retained for their integration owner. */
    boundaryStationsMm: [number, number];
  }

  /** Sample the unchanged family into triangles and construction lines.
   * Recursive restriction controls tessellation only. New principal curves and
   * missing features must be supplied by the regional generation method.
   * Winding follows dP/ds cross dP/dphase; a singular jet refuses emission.
   */
  export function build(id: string, family: HumanCurveFamily.Family, outwardSign: 1 | -1, radialSegments: number = 96, subdivisionDepth: number = 3, phaseParameters?: readonly number[]): Result {
    if (!id || (outwardSign !== 1 && outwardSign !== -1) || !Number.isSafeInteger(radialSegments) || radialSegments < 12 || radialSegments > 1024 || !Number.isSafeInteger(subdivisionDepth) || subdivisionDepth < 0 || subdivisionDepth > 8)
      throw new Error("Curve mesh sampling requires a named region and bounded integer resolution");
    const phases: readonly number[] = phaseParameters ?? Array.from({ length: radialSegments }, (_unused: unknown, index: number): number => index*2*Math.PI/radialSegments);
    if (phases.length < 12 || phases.length > 1024 || phases[0] !== 0 || phases.some((phase: number, index: number): boolean => !Number.isFinite(phase) || phase < 0 || phase >= 2*Math.PI || (index > 0 && !(phase > phases[index-1]!)))) throw new Error("Shared angular samples must retain one finite ordered periodic domain");
    radialSegments = phases.length;
    const intervals: HumanCurveFamily.Interval[] = family.refine(subdivisionDepth, 8192);
    const stations: number[] = [intervals[0]!.startMm, ...intervals.map((interval: HumanCurveFamily.Interval): number => interval.endMm)];
    const positions: number[] = [], normals: number[] = [], indices: number[] = [];
    const rings: number[][] = [];
    const poles: Set<number> = new Set();
    for (const station of stations) {
      const section: HumanCurve.Section | undefined = family.sections.find((candidate: HumanCurve.Section): boolean => candidate.stationMm === station);
      if (section?.topology === "pole") {
        if ((station !== stations[0] && station !== stations[stations.length - 1]) || section.coefficientsMm.some((coefficient: number): boolean => coefficient !== 0))
          throw new Error("Only an explicitly collapsed endpoint can emit a pole: " + id);
        const index: number = positions.length / 3;
        positions.push(...metres(family.evaluate(station, 0)));
        normals.push(0, 0, 0);
        poles.add(index);
        rings.push([index]);
        continue;
      }
      const ring: number[] = [];
      for (let phaseIndex: number = 0; phaseIndex < radialSegments; phaseIndex++) {
        const jet: HumanCurveFamily.Jet = family.jet(station, phases[phaseIndex]!);
        ring.push(positions.length / 3);
        positions.push(...jet.positionMm.map((component: number): number => component / 1000));
        const a: HumanCurve.Vector = jet.longitudinalDerivative, b: HumanCurve.Vector = jet.phaseDerivativeMmPerRadian;
        const normal: HumanCurve.Vector = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const length: number = Math.hypot(...normal);
        if (!(length > 0 && Number.isFinite(length))) throw new Error("Generated curve family has a singular surface jet: " + id);
        normals.push(...normal.map((component: number): number => outwardSign * component / length));
      }
      rings.push(ring);
    }
    for (let row: number = 0; row < stations.length - 1; row++)
      for (let phase: number = 0; phase < radialSegments; phase++) {
        const next: number = (phase + 1) % radialSegments;
        const lower: number[] = rings[row]!, upper: number[] = rings[row + 1]!;
        const a: number = lower[lower.length === 1 ? 0 : phase]!, b: number = upper[upper.length === 1 ? 0 : phase]!;
        const c: number = upper[upper.length === 1 ? 0 : next]!, d: number = lower[lower.length === 1 ? 0 : next]!;
        if (lower.length === 1 && upper.length === 1) throw new Error("Adjacent collapsed poles define no surface: " + id);
        if (upper.length !== 1) triangle(a, b, c);
        if (lower.length !== 1) triangle(a, c, d);
      }
    // At a contour death dP/dphase is identically zero. The oriented fan's
    // own area normals supply the pole normal; no source normal is consulted.
    for (const pole of poles) {
      const normal: HumanCurve.Vector = [normals[3 * pole]!, normals[3 * pole + 1]!, normals[3 * pole + 2]!];
      const length: number = Math.hypot(...normal);
      if (!(length > 0 && Number.isFinite(length))) throw new Error("Generated pole has no oriented fan normal: " + id);
      for (let axis: number = 0; axis < 3; axis++) normals[3 * pole + axis] = normal[axis]! / length;
    }
    const construction: Line[] = rings.map((ring: number[], index: number): Line => ({
      id: id + ".section." + index,
      points: Array.from({ length: radialSegments + 1 }, (_unused: unknown, phase: number): HumanCurve.Vector => {
        const vertex: number = ring[ring.length === 1 ? 0 : phase % radialSegments]!;
        return [positions[3 * vertex]!, positions[3 * vertex + 1]!, positions[3 * vertex + 2]!];
      }),
    }));
    for (let phase: number = 0; phase < 16; phase++) construction.push({ id: id + ".guide." + phase, points: stations.map((station: number): HumanCurve.Vector => metres(family.evaluate(station, phase * 2 * Math.PI / 16))) });
    return {
      part: { id, name: id, material: null, attachedBone: null, transform: null, geometry: { type: "mesh", mesh: { positions, indices, normals, uvs: null, skin: null } } },
      construction, boundaryStationsMm: [stations[0]!, stations[stations.length - 1]!],
    };

    function triangle(a: number, b: number, c: number): void {
      const first: number = a, second: number = outwardSign === 1 ? b : c, third: number = outwardSign === 1 ? c : b;
      indices.push(first, second, third);
      if (!poles.has(first) && !poles.has(second) && !poles.has(third)) return;
      const u: HumanCurve.Vector = [positions[3 * second]! - positions[3 * first]!, positions[3 * second + 1]! - positions[3 * first + 1]!, positions[3 * second + 2]! - positions[3 * first + 2]!];
      const v: HumanCurve.Vector = [positions[3 * third]! - positions[3 * first]!, positions[3 * third + 1]! - positions[3 * first + 1]!, positions[3 * third + 2]! - positions[3 * first + 2]!];
      const normal: HumanCurve.Vector = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      for (const vertex of [first, second, third])
        if (poles.has(vertex)) for (let axis: number = 0; axis < 3; axis++) normals[3 * vertex + axis] = normals[3 * vertex + axis]! + normal[axis]!;
    }
  }

  function metres(point: HumanCurve.Vector): HumanCurve.Vector { return [point[0] / 1000, point[1] / 1000, point[2] / 1000]; }
}
