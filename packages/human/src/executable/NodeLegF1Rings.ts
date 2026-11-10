import { AutoMovieMeshCourse, AutoMovieMeshExtract, type AutoMovieViewAxis } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFootWebTrim } from "../generation/foot/AutoMovieHumanFootWebTrim";
import { AutoMovieHumanLegF1World } from "../generation/leg/AutoMovieHumanLegF1World";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { NodeLegF1Archive } from "./NodeLegF1Archive";

/**
 * Closed-ring correspondence, indexed loft strips and their measured receipts for F1 legs.
 *
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
 */
export namespace NodeLegF1Rings {
  type V2 = NodeLegF1Archive.V2;
  type V3 = NodeLegF1Archive.V3;
  type Frame = NodeLegF1Archive.Frame;

  /** Chart placement, displacement and scaling for the existing rings. */
  const { place, scale, sub }: typeof NodeLegF1Archive = NodeLegF1Archive;

  const Trace: typeof AutoMovieHumanF1Trace = AutoMovieHumanF1Trace;
  const Geometry: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;

  interface ISeamInspection {
    angle: number;
    phase: number;
    sharedEdges: number;
    winding: string;
  }

  /**
   * The measured endpoints and receipt of an ordinary interval.
   *
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
   */
  export interface IOrdinaryInterval {
    /** Course stations of the interval, in millimetres. */
    stations: number[];
    /** Whether the join uses its observed contour rings. */
    observed: boolean;
    /** Shared-edge and tangent inspection at the proximal seam. */
    entry: ISeamInspection;
    /** Shared-edge and tangent inspection at the distal seam. */
    exit: ISeamInspection;
    /** Connection modes at the proximal and distal seams, in that order. */
    modes: [string, string];
  }

  /**
   * Check sampled normals, correspondence and directed uses of every shared edge.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function inspectSeam(
    positions: number[],
    indices: number[],
    axis: AutoMovieViewAxis.IAxis,
    previous: { station: number; row: number[] },
    ring: { station: number; row: number[] },
    next: { station: number; row: number[] },
  ): ISeamInspection {
    const point = (index: number): V3 => [positions[index * 3]!, positions[index * 3 + 1]!, positions[index * 3 + 2]!];
    const chart = ({ station, row }: { station: number; row: number[] }): V2[] => {
      const frame = axis.at(station);
      return row.map((index): V2 => {
        const p = sub(point(index), frame.origin as V3);
        return [Geometry.dot(p, frame.u as V3), Geometry.dot(p, frame.v as V3)];
      });
    };
    const [before, at, after] = [chart(previous), chart(ring), chart(next)];
    const winding = [before, at, after].map((loop): string => {
      const area = loop.reduce((sum, [u, v], k): number => {
        const [nextU, nextV] = loop[(k + 1) % loop.length]!;
        return sum + u * nextV - nextU * v;
      }, 0);
      return area > 0 ? "+" : area < 0 ? "-" : "0";
    }).join("");
    let angle = 0;
    let phase = 0;
    const byEdge = new Map(ring.row.map((index, k): [number, number] => [index, ring.row[(k + 1) % ring.row.length]!]));
    const clockwise = new Map<number, number>();
    const counterclockwise = new Map<number, number>();
    const firstNormals = new Map<number, V3>();
    const secondNormals = new Map<number, V3>();
    const previousPhases = new Map(previous.row.map((index, k): [number, V2] => [index, before![k]!]));
    const nextPhases = new Map(next.row.map((index, k): [number, V2] => [index, after![k]!]));
    const azimuth = (q: V2): number => Math.atan2(q[1], q[0]);
    for (let i = 0; i < indices.length; i += 3) {
      for (let k = 0; k < 3; ++k) {
        const a = indices[i + k]!;
        const b = indices[i + (k + 1) % 3]!;
        const forward = byEdge.get(a) === b;
        if (!forward && byEdge.get(b) !== a) continue;
        const c = indices[i + (k + 2) % 3]!;
        const n = Geometry.cross(sub(point(b), point(a)), sub(point(c), point(a)));
        const start = forward ? a : b;
        const uses = forward ? clockwise : counterclockwise;
        const normals = forward ? firstNormals : secondNormals;
        uses.set(start, (uses.get(start) ?? 0) + 1);
        normals.set(start, n);
        const remote = previousPhases.get(c) ?? nextPhases.get(c);
        if (remote !== undefined) {
          const seamPhase = at![ring.row.indexOf(start)]!;
          const difference = azimuth(remote) - azimuth(seamPhase);
          phase = Math.max(phase, Math.abs(Math.atan2(Math.sin(difference), Math.cos(difference))));
        }
      }
    }
    const sharedEdges = ring.row.filter((index): boolean => clockwise.get(index) === 1 && counterclockwise.get(index) === 1).length;
    for (const index of ring.row) {
      const a = firstNormals.get(index);
      const b = secondNormals.get(index);
      if (a !== undefined && b !== undefined) angle = Math.max(angle, Math.atan2(Math.hypot(...Geometry.cross(a, b)), Geometry.dot(a, b)));
    }
    return { angle: angle * 180 / Math.PI, phase: phase * 180 / Math.PI, sharedEdges, winding };
  }

  /** Compare both measured closed contours in their physical cut plane. */
  export const sectionDeviation: typeof AutoMovieHumanFootWebTrim.sectionDeviation = AutoMovieHumanFootWebTrim.sectionDeviation;

  /**
   * Cut the native and generated meshes at the same halfway planes.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function inspectOrdinary(
    intervals: IOrdinaryInterval[],
    axis: AutoMovieViewAxis.IAxis,
    reference: AutoMovieMeshExtract.IMesh,
    candidate: AutoMovieMeshExtract.IMesh,
  ): string[] {
    if (intervals.length === 0) return [];
    const sections = intervals.flatMap(({ stations, observed }, interval) => [
      ...(observed ? [{ interval, station: stations[0]!, boundary: true }] : []),
      ...stations.slice(1).map((s, i) => ({ interval, station: (s + stations[i]!) / 2, boundary: false })),
      ...(observed ? [{ interval, station: stations[stations.length - 1]!, boundary: true }] : []),
    ]);
    const planes = sections.map(({ station }): AutoMovieMeshCourse.IPlane => {
      const frame = axis.at(station);
      return { station, origin: frame.origin as V3, u: frame.u as V3, v: frame.v as V3 };
    });
    const referenceCuts = AutoMovieMeshCourse.cut(reference, planes, Trace.TOLERANCE);
    const candidateCuts = AutoMovieMeshCourse.cut(candidate, planes, Trace.TOLERANCE);
    return intervals.map(({ stations, entry, exit, modes }, interval): string => {
      let readings = 0;
      let missed = 0;
      let worst = 0;
      let at = stations[0]!;
      const boundary: string[] = [];
      for (const [i, section] of sections.entries()) {
        if (section.interval !== interval) continue;
        const a = referenceCuts[i]!.loop;
        const b = candidateCuts[i]!.loop;
        if (section.boundary) {
          boundary.push(a === null || b === null ? "unreadable" : `${sectionDeviation(a, b).toFixed(3)} mm`);
          continue;
        }
        if (a === null || b === null) {
          ++missed;
          continue;
        }
        ++readings;
        const deviation = sectionDeviation(a, b);
        if (deviation > worst) {
          worst = deviation;
          at = section.station;
        }
      }
      const seam = (s: ISeamInspection): string => `${s.angle.toFixed(2)} degrees, phase departure ${s.phase.toFixed(2)} degrees, ${s.sharedEdges} reciprocally oriented shared edges, chart winding ${s.winding}`;
      return `Ordinary [${stations[0]!.toFixed(3)}, ${stations[stations.length - 1]!.toFixed(3)}] mm: ${readings} midpoint sections, ${missed} unreadable, ${readings === 0 ? "maximum unavailable" : `maximum ${worst.toFixed(3)} mm at ${at.toFixed(3)} mm`}${boundary.length === 0 ? "" : `; native boundary departure ${boundary.join(" / ")}`}; entry ${modes[0]} ${seam(entry)}, exit ${modes[1]} ${seam(exit)}.`;
    });
  }

  /** Keep every measured branch point and align its loop with the next chart. */
  export const forkClock: typeof AutoMovieHumanLegF1World.forkClock = AutoMovieHumanLegF1World.forkClock;

  /**
   * One indexed rim and its actual station.
   *
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
   */
  export type IRing = {
    /** Course station of the ring, in millimetres. */
    station: number;
    /** Ordered world vertex indices with an implicit closing edge from last to first. */
    row: number[];
  };

  /**
   * Intersect one chart ray with a closed contour that contains its origin.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function sampleRay(frame: Frame, points: readonly V2[], u: number, v: number): V3 | null {
    let minimum = Infinity;
    let maximum = -Infinity;
    for (let k = 0; k < points.length; ++k) {
      const [x, y] = points[k]!;
      const [nextX, nextY] = points[(k + 1) % points.length]!;
      const dx = nextX - x;
      const dy = nextY - y;
      const denominator = u * dy - v * dx;
      if (denominator === 0) continue;
      const t = (x * v - y * u) / denominator;
      const radial = (x + t * dx) * u + (y + t * dy) * v;
      if (t < -1e-10 || t > 1 + 1e-10 || radial <= 0) continue;
      minimum = Math.min(minimum, radial);
      maximum = Math.max(maximum, radial);
    }
    return !Number.isFinite(minimum) || maximum - minimum > 1e-8 ? null : place(frame, [u * minimum, v * minimum]);
  }

  /**
   * Evaluate a short strip between the two existing rings with measured transverse directions.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function stitchTangent(
    before: IRing,
    a: IRing,
    b: IRing,
    after: IRing,
    axis: AutoMovieViewAxis.IAxis,
    positions: number[],
    indices: number[],
    append: (points: V3[]) => number[],
  ): { entry: IRing; exit: IRing; mode: string } {
    const chart = (ring: IRing): { frame: Frame; points: V2[] } => {
      const frame = axis.at(ring.station);
      const points = ring.row.map((index): V2 => {
        const worldPoint: V3 = [positions[index * 3]!, positions[index * 3 + 1]!, positions[index * 3 + 2]!];
        const p = sub(worldPoint, frame.origin as V3);
        return [Geometry.dot(p, frame.u as V3), Geometry.dot(p, frame.v as V3)];
      });
      return { frame, points };
    };
    const source = [chart(before), chart(a), chart(b), chart(after)];
    const samples = Array.from({ length: a.row.length }, (_, k): (V3 | null)[] => {
      const phi = k * 2 * Math.PI / a.row.length;
      return source.map(({ frame, points }): V3 | null => sampleRay(frame, points, Math.cos(phi), Math.sin(phi)));
    });
    if (samples.some((row): boolean => row.some((p): boolean => p === null))) {
      const mode = stitchSeam(a, b, axis, positions, indices);
      return { entry: b, exit: a, mode };
    }
    const stations = CaptureSpecs.steps(a.station, b.station, CaptureSpecs.STEP).slice(1, -1);
    const evaluated: IRing[] = stations.map((station): IRing => {
      const points = samples.map(([pBefore, pStart, pEnd, pAfter]): V3 => {
        const atStart = scale(sub(pStart!, pBefore!), 1 / (a.station - before.station));
        const atEnd = scale(sub(pAfter!, pEnd!), 1 / (after.station - b.station));
        return pStart!.map((value, d): number =>
          AutoMovieMeshExtract.hermite(a.station, value, atStart[d]!, b.station, pEnd![d]!, atEnd[d]!, station)
        ) as V3;
      });
      return { station, row: append(points) };
    });
    let row = a;
    for (const next of [...evaluated, b]) {
      stitchSeam(row, next, axis, positions, indices);
      row = next;
    }
    return { entry: evaluated[0] ?? b, exit: evaluated[evaluated.length - 1] ?? a, mode: "measured tangent" };
  }

  /** Join the actual section rims in their polar chart. */
  export const stitchSeam: typeof AutoMovieHumanLegF1World.stitchSeam = AutoMovieHumanLegF1World.stitchSeam;

  /** Join the ordinary forefoot to the exact six-port web seed. */
  export const stitchForefoot: typeof AutoMovieHumanLegF1World.stitchForefoot = AutoMovieHumanLegF1World.stitchForefoot;

  /** Join two closed section rims in their measured correspondence. */
  export const stitchRows: typeof AutoMovieHumanLegF1World.stitchRows = AutoMovieHumanLegF1World.stitchRows;
}
