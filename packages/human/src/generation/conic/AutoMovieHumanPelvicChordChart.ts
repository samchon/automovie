import {
  AutoMovieIllinois as Illinois,
  AutoMovieSolidNormalCone as NormalCone,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type { AutoMovieVector3Tuple as P3 } from "@automovie/interface";

import { AutoMovieHumanPelvicMedialLoft as Native } from "./AutoMovieHumanPelvicMedialLoft";

/** A native physical chord chart through the three held transverse curves. */
export namespace AutoMovieHumanPelvicChordChart {
  /** Native medial conic connected to both old fork curves. */
  type Chart = ReturnType<typeof Native.prepare>[number];

  /** Prepared section curve and its exact source differential. */
  type Course = ReturnType<Chart["course"]>;

  /** Position and derivatives required by the held boundary planes. */
  type Jet = { point: P3; du: P3; dv: P3; duv: P3 };

  /**
   * Read the four original boundary planes at their realized section addresses.
   * Their common positive cone gives the fixed physical graph basis and never
   * requires an interior rectangular surface read.
   */
  export function projection(
    chart: ReturnType<typeof prepare>[number],
    rear: boolean,
  ) {
    const rows = chart.rows;
    const columns = Math.ceil(chart.columns / 2);
    const begin = rear ? 0.5 : 0;
    const end = begin + 0.5;
    const stations = Array.from({ length: rows + 1 }, (_, i) => i / rows);
    const atRows = chart.prepareRows(stations);
    const ends = chart.prepareRows([0, 1]);
    const first = atRows(begin);
    const last = atRows(end);
    const rails = Array.from({ length: columns + 1 }, (_, i) =>
      ends(begin + ((end - begin) * i) / columns),
    );
    const boundary = [
      stations.map((_, i) => first(i)),
      rails.map((read) => read(1)),
      stations.map((_, i) => last(rows - i)),
      rails.map((_, i) => rails[columns - i]!(0)),
    ].flatMap((edge) => edge.slice(0, -1));
    const normals = boundary.map(({ du, dv }, id): NormalCone.INormal => {
      const vector = Vec.unit(Vec.cross(du, dv));
      if (vector === null)
        throw new Error(`${chart.part} needs all four regular boundary planes`);
      return { id, vector };
    });
    const cone = NormalCone.maximumMargin(normals);
    if (cone.normal === null)
      throw new Error(`${chart.part} has no common positive native projection`);
    return cone.normal;
  }

  /** Each of the three curves is read in its own exact chord coordinate. */
  export function prepare(native: readonly Chart[]) {
    return native.map((chart) => {
      const guides = [0, 0.5, 1].map((v) => prepareGuide(chart.course(v)));
      const source = guides.map(({ read }) => read(0));
      const target = guides.map(({ read }) => read(1));
      const surfaceAt = (v: number) => {
        const p = chart.profile(v);
        const d = p.delta,
          dv = p.deltaFirst;
        const axis = Native.normalJet(d, dv);
        const project = (point: P3, rate: P3) =>
          perpendicular(point, rate, axis);
        const weights = hermite(v);
        const s = interpolated(source, weights, project);
        const t = interpolated(target, weights, project);
        const first = slope(
          d,
          dv,
          s,
          Native.normalJet([p.slope, -1, 0], [p.slopeFirst, 0, 0]),
          axis,
        );
        const last = slope(
          d,
          dv,
          t,
          Native.normalJet(p.normal, p.nFirst),
          axis,
        );
        return (h: number, row: readonly Jet[]) => {
          const o = interpolated(row, weights, project);
          // Cubic Hermite basis for the two measured tangent-plane constraints.
          // The residual and its repair are wholly perpendicular to the chord.
          const a = h * (1 - h) ** 2,
            b = h * h * (h - 1);
          const da = (1 - h) * (1 - 3 * h),
            db = h * (3 * h - 2);
          return {
            point: Vec.combine([
              [1, p.p.p],
              [h, d],
              [1, o.point],
              [a, first.point],
              [b, last.point],
            ]),
            du: Vec.combine([
              [1, d],
              [1, o.du],
              [da, first.point],
              [db, last.point],
            ]),
            dv: Vec.combine([
              [1, p.p.d],
              [h, dv],
              [1, o.dv],
              [a, first.dv],
              [b, last.dv],
            ]),
            duv: Vec.combine([
              [1, dv],
              [1, o.duv],
              [da, first.dv],
              [db, last.dv],
            ]),
          };
        };
      };
      const prepareRows = (stations: readonly number[]) => {
        const sections = stations.map((h) => guides.map(({ read }) => read(h)));
        return (v: number) => {
          const at = surfaceAt(v);
          return (i: number) => at(stations[i]!, sections[i]!);
        };
      };
      return {
        part: chart.part,
        rows: chart.rows,
        columns: chart.columns,
        reverse: chart.reverse,
        profile: chart.profile,
        prepareRows,
        stockPhysical: (v: number) =>
          prepareGuide(chart.stockCourse(v)).absolute,
        anchorNormals: guides.map(({ plane }) => plane),
        nativeProgress: [0, 1].map((i) => guides[2 * i]!.progress),
      };
    });
  }
  /** Invert positive normalized chord reach, then differentiate at fixed reach. */
  function prepareGuide(course: Course) {
    const p = course.first(0),
      q = course.first(1);
    const d = Vec.sub(q.point, p.point),
      dv = Vec.sub(q.dv, p.dv);
    const metric = Vec.dot(d, d),
      metricV = 2 * Vec.dot(d, dv);
    const second = course.second();
    const progress = (u: number) =>
      u === 0 || u === 1
        ? u
        : Vec.dot(Vec.sub(course.point(u), p.point), d) / metric;
    const resolve = (h: number) => {
      const u =
        h === 0 || h === 1
          ? h
          : Illinois.root(
              (t) => progress(t) - h,
              0,
              1,
              16 * Number.EPSILON,
              53,
            );
      if (u === null)
        throw new Error(`The supplied guide does not span its chord at ${h}`);
      const j = second(u);
      const hu = Vec.dot(j.du, d) / metric;
      if (!(hu > 0))
        throw new Error(`The supplied guide turns back on its chord at ${h}`);
      return { j, hu };
    };
    const read = (h: number): Jet => {
      const { j, hu } = resolve(h);
      const rel = Vec.sub(j.point, p.point);
      const hv =
        (Vec.dot(Vec.sub(j.dv, p.dv), d) + Vec.dot(rel, dv) - h * metricV) /
        metric;
      const uv = -hv / hu;
      const hUV =
        (Vec.dot(j.duv, d) + Vec.dot(j.du, dv) - hu * metricV) / metric;
      const hUU = Vec.dot(j.duu, d) / metric;
      const ru = Vec.scale(j.du, 1 / hu);
      return {
        point: Vec.combine([
          [1, rel],
          [-h, d],
        ]),
        du: Vec.sub(ru, d),
        dv: Vec.combine([
          [1, j.dv],
          [uv, j.du],
          [-1, p.dv],
          [-h, dv],
        ]),
        duv: Vec.combine([
          [1 / hu, j.duv],
          [uv / hu, j.duu],
          [-(hUV + uv * hUU) / hu, ru],
          [-1, dv],
        ]),
      };
    };
    const plane = (h: number) => {
      const { j, hu } = resolve(h);
      const n = Vec.cross(j.du, j.dv);
      const nh = Vec.scale(
        Vec.add(Vec.cross(j.duu, j.dv), Vec.cross(j.du, j.duv)),
        1 / hu,
      );
      return Native.normalJet(n, nh);
    };
    const absolute = (h: number) => {
      const j = read(h);
      return {
        point: Vec.combine([
          [1, p.point],
          [h, d],
          [1, j.point],
        ]),
        du: Vec.add(d, j.du),
        dv: Vec.combine([
          [1, p.dv],
          [h, dv],
          [1, j.dv],
        ]),
        duv: Vec.add(dv, j.duv),
      };
    };
    return { progress, read, plane, absolute };
  }

  function hermite(v: number) {
    const i = v < 0.5 ? 0 : 1;
    const t = 2 * v - i,
      square = t * t,
      cubic = square * t;
    return {
      i,
      value: [
        2 * cubic - 3 * square + 1,
        (cubic - 2 * square + t) / 2,
        3 * square - 2 * cubic,
        (cubic - square) / 2,
      ],
      rate: [
        12 * (square - t),
        3 * square - 4 * t + 1,
        12 * (t - square),
        3 * square - 2 * t,
      ],
    };
  }

  type Plane = ReturnType<typeof Native.normalJet>;

  function interpolated(
    rows: readonly Jet[],
    { i, value, rate }: ReturnType<typeof hermite>,
    project: (point: P3, dv: P3) => { point: P3; dv: P3 },
  ) {
    const p = rows[i]!,
      q = rows[i + 1]!;
    const terms = [p.point, p.dv, q.point, q.dv];
    const along = [p.du, p.duv, q.du, q.duv];
    const combine = (coefs: number[], vectors: P3[]) =>
      Vec.combine(vectors.map((vector, k) => [coefs[k]!, vector]));
    const a = project(combine(value, terms), combine(rate, terms));
    const b = project(combine(value, along), combine(rate, along));
    return { point: a.point, dv: a.dv, du: b.point, duv: b.dv };
  }

  function perpendicular(point: P3, dv: P3, axis: Plane) {
    const a = Vec.dot(point, axis.normal);
    const da = Vec.dot(dv, axis.normal) + Vec.dot(point, axis.normalFirst);
    return {
      point: Vec.sub(point, Vec.scale(axis.normal, a)),
      dv: Vec.combine([
        [1, dv],
        [-a, axis.normalFirst],
        [-da, axis.normal],
      ]),
    };
  }

  /** Nearest transverse change to the inherited plane, at fixed chord pace. */
  function slope(d: P3, dv: P3, j: Jet, plane: Plane, axis: Plane) {
    const tangent = Vec.add(d, j.du),
      mixed = Vec.add(dv, j.duv);
    const { point: n, dv: dn } = perpendicular(
      plane.normal,
      plane.normalFirst,
      axis,
    );
    const len = Vec.dot(n, n);
    if (!(len > 0))
      throw new Error("The source plane forbids its chosen chord pace");
    const height = -Vec.dot(tangent, plane.normal) / len;
    const dh =
      (-Vec.dot(mixed, plane.normal) -
        Vec.dot(tangent, plane.normalFirst) -
        2 * height * Vec.dot(n, dn)) /
      len;
    return {
      point: Vec.scale(n, height),
      dv: Vec.combine([
        [height, dn],
        [dh, n],
      ]),
    };
  }
}
