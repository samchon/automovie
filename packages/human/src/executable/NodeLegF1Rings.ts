import { AutoMovieMeshCourse, AutoMovieMeshExtract, type AutoMovieViewAxis } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
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

  /**
   * Compare the two actual plane sections by distance to the other polygon.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function sectionDeviation(a: readonly V2[], b: readonly V2[]): number {
    const directed = (source: readonly V2[], target: readonly V2[]): number => {
      let largest = 0;
      for (const [x, y] of source) {
        let nearest = Infinity;
        for (let i = 0; i < target.length; ++i) {
          const [ax, ay] = target[i]!;
          const [bx, by] = target[(i + 1) % target.length]!;
          const dx = bx - ax;
          const dy = by - ay;
          const lengthSquared = dx * dx + dy * dy;
          const along = lengthSquared === 0 ? 0 : ((x - ax) * dx + (y - ay) * dy) / lengthSquared;
          const t = Math.max(0, Math.min(1, along));
          nearest = Math.min(nearest, (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2);
        }
        largest = Math.max(largest, nearest);
      }
      return Math.sqrt(largest);
    };
    return Math.max(directed(a, b), directed(b, a));
  }

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

  /**
   * Keep every measured branch point and align its loop with the next chart.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function forkClock(fork: V3[], frame: Frame): V3[] {
    // The native parent cut repeats its closing point; that repeat is internal
    // to one half after the split. Its exact coordinate remains on the mesh.
    const ring = fork.filter((p, i): boolean => {
      const previous = fork[(i + fork.length - 1) % fork.length]!;
      return p[0] !== previous[0] || p[1] !== previous[1] || p[2] !== previous[2];
    });
    const projected: V2[] = ring.map((p): V2 => [Geometry.dot(p, frame.u as V3), Geometry.dot(p, frame.v as V3)]);
    let area = 0;
    let start = 0;
    for (let i = 0; i < projected.length; ++i) {
      const [u, v] = projected[i]!;
      const [nextU, nextV] = projected[(i + 1) % projected.length]!;
      area += u * nextV - nextU * v;
      if (u > projected[start]![0]) start = i;
    }
    const direction = area > 0 ? 1 : -1;
    return Array.from({ length: ring.length }, (_, k): V3 => ring[(start + direction * k + ring.length) % ring.length]!);
  }

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

  /**
   * Join two rings using their corresponding physical chart phases.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function stitchSeam(
    a: { station: number; row: number[] },
    b: { station: number; row: number[] },
    axis: AutoMovieViewAxis.IAxis,
    positions: number[],
    indices: number[],
  ): string {
    const phase = ({ station, row }: { station: number; row: number[] }): { row: number[]; next: number[] } | null => {
      const frame = axis.at(station);
      const angles = row.map((index): number => {
        const p = sub([positions[index * 3]!, positions[index * 3 + 1]!, positions[index * 3 + 2]!], frame.origin as V3);
        const angle = Math.atan2(Geometry.dot(p, frame.v as V3), Geometry.dot(p, frame.u as V3));
        if (Math.abs(angle) < 1e-10) return 0;
        return angle < 0 ? 1 + angle / (2 * Math.PI) : angle / (2 * Math.PI);
      });
      const start = angles.reduce((i, angle, k): number => angle < angles[i]! ? k : i, 0);
      const order = row.map((_, k): number => (start + k) % row.length);
      const ordered = order.map((k): number => angles[k]!);
      if (ordered.some((angle, k): boolean => k > 0 && angle < ordered[k - 1]!)) return null;
      return { row: order.map((k): number => row[k]!), next: [...ordered.slice(1), ordered[0]! + 1] };
    };
    const first = phase(a);
    const second = phase(b);
    if (first === null || second === null) {
      stitchRows(a.row, b.row, positions, indices, "length");
      return "perimeter";
    }
    stitchRows(first.row, second.row, positions, indices, [first.next, second.next]);
    return "polar";
  }

  /**
   * Join the last regularly sampled foot section to its native skin rim.
   * The native rim has a local azimuth reversal between two consecutive
   * host rays. The measured ray intersections still follow the rim order.
   * Anchor the strip there to avoid shifting the whole perimeter.
   *
   * @param a Archive ring in increasing, equally spaced chart-ray order.
   * @param b Exact indexed native rim in increasing contour order.
   * @param axis Original course supplying the two section frames.
   * @param positions Existing world coordinates, in millimetres.
   * @param indices Destination triangles of the ordinary strip.
   * @returns Whether all physical rays meet the native rim once and in order.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The two rings correspond at measured ray intersections. The native arc distance orders intervening vertices for the existing indexed strip.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every native position and refuses missing or disordered intersections without appending triangles.
   */
  export function stitchForefoot(
    a: IRing,
    b: IRing,
    axis: AutoMovieViewAxis.IAxis,
    positions: number[],
    indices: number[],
  ): boolean {
    const frame: NodeLegF1Archive.Frame = axis.at(b.station);
    const points: NodeLegF1Archive.V3[] = b.row.map((index): NodeLegF1Archive.V3 =>
      [positions[3 * index]!, positions[3 * index + 1]!, positions[3 * index + 2]!]);
    const chart: NodeLegF1Archive.V2[] = points.map((point): NodeLegF1Archive.V2 => {
      const d: NodeLegF1Archive.V3 = NodeLegF1Archive.sub(point, frame.origin as NodeLegF1Archive.V3);
      return [Geometry.dot(d, frame.u as NodeLegF1Archive.V3), Geometry.dot(d, frame.v as NodeLegF1Archive.V3)];
    });
    const distances: number[] = [0];
    for (const [i, point] of points.entries())
      distances.push(distances[i]! + Math.hypot(...NodeLegF1Archive.sub(points[(i + 1) % points.length]!, point)));
    const length: number = distances[points.length]!;
    if (!(length > 0)) return false;

    // The archive row has one point per physical ray. Read the same rays on
    // the native rim and retain the native vertices between those intersections.
    const hits: (number | null)[] = a.row.map((_, k): number | null => {
      const angle: number = k * 2 * Math.PI / a.row.length;
      const u: number = Math.cos(angle);
      const v: number = Math.sin(angle);
      let radius: number | undefined;
      let distance: number | null = null;
      for (const [i, [x, y]] of chart.entries()) {
        const [nextX, nextY]: NodeLegF1Archive.V2 = chart[(i + 1) % chart.length]!;
        const dx: number = nextX - x;
        const dy: number = nextY - y;
        const denominator: number = u * dy - v * dx;
        if (denominator === 0) continue;
        const t: number = (x * v - y * u) / denominator;
        const r: number = (x + t * dx) * u + (y + t * dy) * v;
        if (t < -1e-10 || t > 1 + 1e-10 || r <= 0) continue;
        if (radius !== undefined && Math.abs(radius - r) > 1e-8) return null;
        radius = r;
        distance ??= distances[i]! + t * (distances[i + 1]! - distances[i]!);
      }
      return distance;
    });
    if (hits.some((hit): boolean => hit === null)) return false;
    const offset: number = hits[0]!;
    const relative = (distance: number): number => {
      const phase: number = distance - offset;
      return phase < 0 ? phase + length : phase;
    };
    const anchors: number[] = hits.map((hit): number => relative(hit!));
    if (anchors.some((anchor, i): boolean => i > 0 && anchor <= anchors[i - 1]!)) return false;
    anchors.push(length);

    const rim: number[] = distances.slice(0, -1).map(relative);
    const first: number = rim.reduce((best, phase, i): number => phase < rim[best]! ? i : best, 0);
    const order: number[] = rim.map((_, k): number => (first + k) % rim.length);
    let sector: number = 0;
    const phases: number[] = order.map((i): number => {
      const distance: number = rim[i]!;
      while (distance >= anchors[sector + 1]! && sector + 1 < a.row.length) ++sector;
      const fraction: number = (distance - anchors[sector]!) / (anchors[sector + 1]! - anchors[sector]!);
      return (sector + fraction) / a.row.length;
    });
    const ordinary: number[] = a.row.map((_, k): number => (k + 1) / a.row.length);
    const native: number[] = [...phases.slice(1), phases[0]! + 1];
    stitchRows(a.row, order.map((i): number => b.row[i]!), positions, indices, [ordinary, native]);
    return true;
  }

  /**
   * Join two closed rings in their shared cyclic order, preserving all vertices.
   * The supplied clocks are edge ends in one unwrapped turn. The strip
   * advances the ring whose next edge ends first and retains both rims.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function stitchRows(
    a: number[],
    b: number[],
    positions: number[],
    indices: number[],
    correspondence?: "length" | [number[], number[]],
  ): void {
    const clocks = (row: number[]): number[] => {
      if (correspondence === undefined && a.length === b.length) return row.map((_, k): number => (k + 1) / row.length);
      let length = 0;
      const distances = row.map((index, k): number => {
        const first = index * 3;
        const second = row[(k + 1) % row.length]! * 3;
        length += Math.hypot(positions[first]! - positions[second]!, positions[first + 1]! - positions[second + 1]!, positions[first + 2]! - positions[second + 2]!);
        return length;
      });
      return distances.map((distance): number => distance / length);
    };
    const [firstClock, secondClock] = correspondence === undefined || correspondence === "length" ? [clocks(a), clocks(b)] : correspondence;
    let i = 0;
    let j = 0;
    while (i < a.length || j < b.length) {
      const first = a[i % a.length]!;
      const second = b[j % b.length]!;
      if ((firstClock[i] ?? Infinity) < (secondClock[j] ?? Infinity)) {
        ++i;
        indices.push(first, second, a[i % a.length]!);
      } else {
        ++j;
        indices.push(first, second, b[j % b.length]!);
      }
    }
  }
}
