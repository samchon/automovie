import { AutoMovieCurveMath64, AutoMovieViewAxis } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec as Geometry } from "../arm/AutoMovieHumanArmCurveSpec";

type V3 = [number, number, number];
type V2 = [number, number];
type Frame = ReturnType<AutoMovieViewAxis.IAxis["at"]>;
const sub: typeof AutoMovieCurveMath64.sub = AutoMovieCurveMath64.sub;
/** One fixed F1 boundary and its existing increasing geometric parameters. */
type FairRail = { row: number[]; phase: number[] };
/** One longitudinal cubic of the fixed F1 repair, in absolute world mm. */
type FairColumn = { phase: number; span: AutoMovieCurveMath64.Span; linear?: boolean };

/**
 * f1's leg and foot 2D lines as absolute world points on her reference in
 * her own stance (the shank abducted, the feet as placed), world
 * calibration mm with +X forward, +Y up and Z negative on her left: the
 * owner's world-match step (2026-11-08). Each point is a silhouette point of
 * her surface in its view, placed by `NodeLegWorldTrace` and checked on her
 * clay in every view: the leg's at its levels (the sites' own and every
 * 30 mm between); the foot's sampled every 4 mm, each sample's free
 * coordinate the median of its neighbourhood (her mesh's saw-toothed slices
 * and hatching are single-sample steps), reduced to the fewest knots whose
 * natural cubic passes every sample within 0.5 mm. The leg's zero frames
 * take them through `AutoMovieHumanLegF1Rebase`.
 */
export namespace AutoMovieHumanLegF1World {
  /**
   * Realize the two fixed F1 repairs as shared transverse Hermite loft rows.
   * Boundary indices are retained exactly. One middle curve exposes the
   * cubic bow; further common rows follow the 0.5 mm control-hull chord bound.
   * Open Hip panels return their lateral indices for the unchanged neighboring
   * strip to consume. Closed toe bands use the existing cyclic row operator.
   * The caller owns the inferred endpoint directions and artifact scope;
   * cubic interpolation alone certifies neither embedding nor G1 continuity.
   */
  export function fairBand(lower: FairRail, upper: FairRail, columns: FairColumn[], positions: number[], indices: number[], closed: boolean): { t: number; ids: number[] }[] {
    const times: Set<number> = new Set([0.5]);

    /** Refine the whole transverse row family, not selected bad vertices. */
    const refine: (span: AutoMovieCurveMath64.Span, from: number, to: number, depth: number) => void =
      (span: AutoMovieCurveMath64.Span, from: number, to: number, depth: number): void => {
        const d: V3 = sub(span[3], span[0]), l2: number = Geometry.dot(d, d);
        const error: number = Math.max(...span.slice(1, 3).map((p: V3): number => {
          const q: V3 = sub(p, span[0]), t: number = l2 === 0 ? 0 : Math.max(0, Math.min(1, Geometry.dot(q, d) / l2));
          return Math.hypot(...sub(q, AutoMovieCurveMath64.scale(d, t)));
        }));
        if (error <= 0.5) return;
        if (depth === 30) throw new Error("The fixed F1 Hermite repair cannot meet its chord tolerance");
        const middle: number = (from + to) / 2;
        times.add(middle);
        const [a, b]: [AutoMovieCurveMath64.Span, AutoMovieCurveMath64.Span] = AutoMovieCurveMath64.split(span, 0.5);
        refine(a, from, middle, depth + 1); refine(b, middle, to, depth + 1);
      };
    for (const column of columns) refine(column.span, 0, 1, 0);
    const rows: { t: number; ids: number[] }[] = [...times].sort((a: number, b: number): number => a - b).map(
      (t: number): { t: number; ids: number[] } => ({ t, ids: columns.map(({ span, linear }: FairColumn): number => {
        const p: V3 = linear ? AutoMovieCurveMath64.mix(span[0], span[3], t) : AutoMovieCurveMath64.cubic(span, t);
        return positions.push(p[0], p[1], p[2]) / 3 - 1;
      }) }));
    const phases: number[] = columns.map((column: FairColumn): number => column.phase);
    const rails: FairRail[] = [lower, ...rows.map(({ ids }: typeof rows[number]): FairRail => ({ row: ids, phase: phases })), upper];
    for (let k: number = 1; k < rails.length; ++k) {
      const a: FairRail = rails[k - 1]!, b: FairRail = rails[k]!;
      if (closed) stitchRows(a.row, b.row, positions, indices,
        [[...a.phase.slice(1), a.phase[0]! + 1], [...b.phase.slice(1), b.phase[0]! + 1]]);
      else {
        let i: number = 0, j: number = 0;
        while (i + 1 < a.row.length || j + 1 < b.row.length) {
          const x: number = a.row[i]!, y: number = b.row[j]!;
          if ((a.phase[i + 1] ?? Infinity) <= (b.phase[j + 1] ?? Infinity)) indices.push(x, a.row[++i]!, y);
          else indices.push(x, b.row[++j]!, y);
        }
      }
    }
    return rows;
  }

  /** Keep each fixed observed section frame and evaluate only between its measured neighbours. */
  export function archivedAxis(stations: number[], frames: Frame[]): AutoMovieViewAxis.IAxis {
    const exact: Map<number, Frame> = new Map(stations.map((s, i): [number, Frame] => [s, frames[i]!]));
    const mix = (a: V3, b: V3, t: number): V3 =>
      [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    return {
      at(s: number): Frame {
        const frame: Frame | undefined = exact.get(s);
        if (frame !== undefined) return frame;
        const i: number = stations.findIndex((station: number): boolean => station > s);
        if (i <= 0) throw new Error(`station ${s} mm is outside the fixed section family`);
        const a: Frame = frames[i - 1]!;
        const b: Frame = frames[i]!;
        const t: number = (s - stations[i - 1]!) / (stations[i]! - stations[i - 1]!);
        const origin: V3 = mix(a.origin as V3, b.origin as V3, t);
        const n: V3 = Geometry.unit(mix(AutoMovieViewAxis.normal(a) as V3, AutoMovieViewAxis.normal(b) as V3, t));
        const first: V3 = mix(a.u as V3, b.u as V3, t);
        const u: V3 = Geometry.unit(sub(first, AutoMovieCurveMath64.scale(n, Geometry.dot(first, n))));
        return { origin, u, v: Geometry.cross(u, n) };
      },
    };
  }

  /** Her bone landmarks in that stance: the hip centre (the trunk's hip port), the knee centre between the epicondyles' skin points, IM between the malleoli's tips. */
  export const LANDMARKS: Readonly<Record<"hip" | "knee" | "im", V3>> = { hip: [0.0, 889.0, -86.1], knee: [30.3, 490.0, -98.0], im: [13.3, 63.7, -136.7] };

  /** Her foot's course direction from IM: her sole's principal heading, pitched as the leg's course from IM to the toe-web pole. */
  export const COURSE: V3 = [157.6, -55.8, -20.2];

  /** Her front-ankle juncture: her surface on the ray from IM in the bisection plane of her shank and foot course, toward the bend's inner side (the talus' front). */
  export const JUNCTURE: V3 = [47.3, 86.9, -137.7];

  /** The leg's levels top down: a site's name, or an empty string between sites. */
  export const LEVELS: readonly string[] = ["gluteal furrow", "", "", "", "", "", "", "", "", "", "suprapatella", "midpatella", "", "", "", "", "calf maximum", "", "", "", "", "", "", "", "ankle minimum"];

  /** The leg's four lines, one point per level: front view lateral and medial, side view anterior and posterior. */
  export const LEG: Readonly<Record<"lateral" | "medial" | "anterior" | "posterior", readonly V3[]>> = {
    lateral: [
      [40.3, 775.6, -192.1],
      [40.1, 745.6, -191.0],
      [39.0, 715.6, -188.5],
      [37.2, 685.6, -184.9],
      [47.1, 655.6, -180.9],
      [43.5, 625.6, -176.3],
      [39.5, 595.6, -171.0],
      [25.8, 565.6, -165.3],
      [12.4, 535.6, -162.0],
      [6.7, 505.6, -161.5],
      [3.3, 490.4, -161.1],
      [-2.1, 468.4, -160.7],
      [-8.0, 445.6, -162.6],
      [-13.2, 415.6, -169.0],
      [-7.1, 385.6, -176.3],
      [-8.5, 355.6, -180.5],
      [-9.2, 343.0, -181.2],
      [-10.3, 325.6, -181.3],
      [-13.0, 295.6, -180.2],
      [-7.3, 265.6, -177.9],
      [-9.4, 235.6, -175.4],
      [-2.0, 205.6, -172.2],
      [-0.7, 175.6, -169.3],
      [2.2, 145.6, -165.1],
      [4.9, 120.7, -161.7],
    ],
    medial: [
      [33.6, 775.6, -10.8],
      [22.9, 745.6, -12.1],
      [23.0, 715.6, -14.9],
      [23.3, 685.6, -19.0],
      [23.4, 655.6, -24.8],
      [23.4, 625.6, -30.8],
      [22.8, 595.6, -35.1],
      [21.9, 565.6, -38.2],
      [20.4, 535.6, -41.4],
      [17.5, 505.6, -44.7],
      [15.6, 490.4, -46.9],
      [13.1, 468.4, -51.9],
      [10.4, 445.6, -59.2],
      [-2.3, 415.6, -68.0],
      [-12.5, 385.6, -71.6],
      [-13.8, 355.6, -71.3],
      [-14.5, 343.0, -71.3],
      [-15.7, 325.6, -71.7],
      [-12.1, 295.6, -75.2],
      [-11.8, 265.6, -81.9],
      [-8.3, 235.6, -88.5],
      [-10.0, 205.6, -94.0],
      [-9.6, 175.6, -99.2],
      [-7.6, 145.6, -104.5],
      [-3.2, 120.7, -108.5],
    ],
    anterior: [
      [134.1, 775.6, -107.8],
      [133.0, 745.6, -109.2],
      [130.4, 715.6, -109.9],
      [126.2, 685.6, -110.5],
      [120.7, 655.6, -110.9],
      [114.1, 625.6, -110.1],
      [106.7, 595.6, -96.9],
      [98.5, 565.6, -98.6],
      [91.8, 535.6, -101.5],
      [85.8, 505.6, -113.4],
      [82.1, 490.4, -106.6],
      [74.4, 468.4, -116.2],
      [65.1, 445.6, -111.5],
      [51.2, 415.6, -122.1],
      [46.8, 385.6, -131.9],
      [45.9, 355.6, -134.8],
      [45.4, 343.0, -135.7],
      [44.5, 325.6, -136.5],
      [42.2, 295.6, -137.3],
      [39.4, 265.6, -138.1],
      [36.3, 235.6, -139.4],
      [33.9, 205.6, -140.6],
      [33.1, 175.6, -141.2],
      [34.3, 145.6, -134.6],
      [37.7, 120.7, -134.8],
    ],
    posterior: [
      [-62.5, 767.6, -99.2],
      [-56.2, 745.6, -100.7],
      [-52.3, 715.6, -102.7],
      [-51.7, 685.6, -102.7],
      [-51.2, 655.6, -101.5],
      [-49.3, 625.6, -100.6],
      [-45.7, 595.6, -100.7],
      [-41.1, 565.6, -101.8],
      [-37.7, 535.6, -103.5],
      [-38.3, 505.6, -114.9],
      [-39.7, 490.4, -115.6],
      [-41.5, 468.4, -116.9],
      [-46.7, 445.6, -118.5],
      [-55.5, 415.6, -120.0],
      [-62.3, 385.6, -121.1],
      [-66.5, 355.6, -122.8],
      [-67.2, 343.0, -123.9],
      [-66.9, 325.6, -125.8],
      [-63.7, 295.6, -129.5],
      [-58.8, 265.6, -132.7],
      [-53.8, 235.6, -136.0],
      [-49.4, 205.6, -130.5],
      [-45.6, 175.6, -131.6],
      [-41.9, 145.6, -131.7],
      [-39.0, 120.7, -131.2],
    ],
  };

  /** The foot's lines from the heel to the ball: from above the lateral and medial outlines and from the side the dorsal profile by station along +X; the heel's back by height. */
  export const FOOT: Readonly<Record<"lateral" | "medial" | "dorsal" | "heel", readonly V3[]>> = {
    lateral: [
      [-42.0, 19.0, -151.1],
      [-34.0, 13.8, -159.9],
      [-26.0, 13.5, -165.3],
      [-14.0, 12.7, -170.4],
      [30.0, 14.3, -180.6],
      [50.0, 11.9, -188.4],
      [70.0, 9.4, -195.9],
      [82.0, 11.7, -199.5],
      [94.0, 0.7, -199.2],
    ],
    medial: [
      [-42.0, 21.2, -125.7],
      [-38.0, 21.2, -121.5],
      [-26.0, 13.7, -115.0],
      [-14.0, 13.5, -113.0],
      [-6.0, 20.5, -112.7],
      [-2.0, 20.3, -112.5],
      [6.0, 77.7, -108.2],
      [14.0, 74.8, -106.5],
      [22.0, 73.8, -107.2],
      [30.0, 61.7, -109.4],
      [38.0, 30.6, -109.8],
      [50.0, 35.5, -111.2],
      [66.0, 32.4, -113.2],
      [82.0, 29.9, -115.9],
      [94.0, 23.7, -117.1],
    ],
    dorsal: [
      [38.0, 76.6, -155.5],
      [50.0, 76.9, -147.7],
      [58.0, 74.3, -135.6],
      [62.0, 70.5, -136.3],
      [70.0, 65.3, -140.2],
      [94.0, 53.9, -140.2],
    ],
    heel: [
      [-39.0, 4.0, -141.3],
      [-42.7, 8.0, -142.8],
      [-45.4, 16.0, -142.4],
      [-45.6, 24.0, -141.9],
      [-41.6, 44.0, -139.4],
      [-38.4, 60.0, -136.3],
    ],
  };
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

  /** A recorded physical row and its indexed boundary. */
  type IRing = { station: number; row: number[] };

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
    const frame: Frame = axis.at(b.station);
    const points: V3[] = b.row.map((index): V3 =>
      [positions[3 * index]!, positions[3 * index + 1]!, positions[3 * index + 2]!]);
    const chart: V2[] = points.map((point): V2 => {
      const d: V3 = sub(point, frame.origin as V3);
      return [Geometry.dot(d, frame.u as V3), Geometry.dot(d, frame.v as V3)];
    });
    const distances: number[] = [0];
    for (const [i, point] of points.entries())
      distances.push(distances[i]! + Math.hypot(...sub(points[(i + 1) % points.length]!, point)));
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
        const [nextX, nextY]: V2 = chart[(i + 1) % chart.length]!;
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
