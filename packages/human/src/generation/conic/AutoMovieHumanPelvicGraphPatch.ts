import {
  evaluateAutoMovieHermiteGregory64 as Gregory,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type { AutoMovieVector3Tuple as P3 } from "@automovie/interface";

import type { AutoMovieHumanPelvicChordChart as Chord } from "./AutoMovieHumanPelvicChordChart";
import { AutoMovieHumanPelvicMedialLoft as Native } from "./AutoMovieHumanPelvicMedialLoft";

/**
 * The held posterior scalar graph, expressed in its original physical tangent
 * planes.
 */
export namespace AutoMovieHumanPelvicGraphPatch {
  /** The native exterior and medial guide chart. */
  type Chart = ReturnType<typeof Chord.prepare>[number];

  /** Position and first partials in the original physical guide chart. */
  type Row = ReturnType<ReturnType<Chart["stockPhysical"]>>;

  /** Normal and its derivative along the original boundary. */
  type Plane = ReturnType<typeof Native.normalJet>;

  /** Boundary constraints of the existing scalar Gregory evaluator. */
  type Edge = Parameters<typeof Gregory>[0][number];

  /**
   * Prepare only the actual posterior scope. A phase evaluates its original
   * radial section once and shares that reader across all declared longitudinal
   * stations.
   */
  export function rear(
    chart: Chart,
    normal: P3,
    stations: readonly number[],
    phases: readonly number[],
  ) {
    const host = chart.prepareRows([...stations, 0, 1]);
    const stock = chart.stockPhysical;
    const read = slab(chart, host, stations, 1, normal, stock);
    return phases.map((phase) => read(2 * phase - 1));
  }

  /** Read the scalar height over one admitted original projected region. */
  function slab(
    chart: Chart,
    host: ReturnType<Chart["prepareRows"]>,
    stations: readonly number[],
    half: number,
    axis: P3,
    stockAt: Chart["stockPhysical"],
  ) {
    const first = half / 2,
      last = first + 0.5;
    const size = stations.length;
    const atStation = [...stations, 0, 1];
    const a = host(first),
      b = host(last);
    const a0 = stockAt(first),
      b0 = stockAt(last);
    const front = atStation.map((h, i) => difference(a(i), a0(h)));
    const back = atStation.map((h, i) => difference(b(i), b0(h)));
    const corners: [P3, P3, P3, P3] = [
      front[size]!.point,
      front[size + 1]!.point,
      back[size]!.point,
      back[size + 1]!.point,
    ];
    const origin = a(size).point;
    const projected = (p: P3) => Vec.sub(p, Vec.scale(axis, Vec.dot(p, axis)));
    const section = (t: number, owned?: ReturnType<Chart["stockPhysical"]>) => {
      const v = (half + t) / 2;
      const stock = owned ?? stockAt(v),
        profile = chart.profile(v);
      const p = profile.p.p,
        q = profile.q.p;
      const launch = stock(0),
        receive = stock(1);
      const p0 = {
        point: Vec.sub(p, launch.point),
        dv: Vec.sub(profile.p.d, launch.dv),
      };
      const q0 = {
        point: Vec.sub(q, receive.point),
        dv: Vec.sub(profile.to, receive.dv),
      };
      const at = (i: number) => {
        const h = atStation[i]!;
        const native = stock(h);
        const transfer = coons(front[i]!, back[i]!, p0, q0, corners, h, t);
        return {
          point: projected(
            Vec.sub(Vec.add(native.point, transfer.point), origin),
          ),
          du: projected(Vec.add(native.du, transfer.du)),
          dv: projected(Vec.add(Vec.scale(native.dv, 0.5), transfer.dv)),
          duv: projected(Vec.add(Vec.scale(native.duv, 0.5), transfer.duv)),
        };
      };
      // These normals and their analytic along-rail derivatives belong to
      // the actual body and thigh, not the interior of any earlier loft.
      const source = Native.normalJet(
        [profile.slope, -1, 0],
        [profile.slopeFirst / 2, 0, 0],
      );
      const target = Native.normalJet(
        profile.normal,
        Vec.scale(profile.nFirst, 0.5),
      );
      const across = [
        data(p, Vec.scale(profile.p.d, 0.5), at(size), source, false),
        data(q, Vec.scale(profile.to, 0.5), at(size + 1), target, false),
      ];
      return { at, across };
    };
    const ends = [section(0, a0), section(1, b0)];
    const horizontal = ends.map(({ at }, i) =>
      atStation.map((h, j) => {
        const ordinary = (i === 0 ? a : b)(j);
        return data(
          ordinary.point,
          ordinary.du,
          at(j),
          chart.anchorNormals[half + i]!(h),
          true,
        );
      }),
    );
    return (t: number) => {
      const current = t === 0 ? ends[0]! : t === 1 ? ends[1]! : section(t);
      const vertical = [0, 1].map(
        (i): Edge =>
          (v) =>
            (v === 0 ? ends[0]! : v === 1 ? ends[1]! : current).across[i]!,
      );
      return (i: number) => {
        const h = atStation[i]!;
        const row =
          (edge: number): Edge =>
          (u) =>
            horizontal[edge]![u === 0 ? size : u === 1 ? size + 1 : i]!;
        const height = Gregory(
          [row(0), vertical[1]!, row(1), vertical[0]!],
          h,
          t,
        );
        const plane = current.at(i);
        return {
          point: Vec.combine([
            [1, origin],
            [1, plane.point],
            [height.point[0], axis],
          ]),
          du: Vec.add(plane.du, Vec.scale(axis, height.du[0])),
          dv: Vec.combine([
            [2, plane.dv],
            [2 * height.dv[0], axis],
          ]),
        };
      };
    };

    function data(
      real: P3,
      tangent: P3,
      map: Row,
      { normal, normalFirst }: Plane,
      horizontal: boolean,
    ): ReturnType<Edge> {
      const across = horizontal ? map.dv : map.du;
      const projection = Vec.dot(normal, axis);
      if (projection === 0)
        throw new Error(
          "A genuine boundary normal is parallel to the height chart",
        );
      const cross = -Vec.dot(normal, across) / projection;
      const crossTangent =
        (-Vec.dot(normalFirst, across) -
          Vec.dot(normal, map.duv) -
          cross * Vec.dot(normalFirst, axis)) /
        projection;
      return {
        point: [Vec.dot(Vec.sub(real, origin), axis), 0, 0],
        tangent: [Vec.dot(tangent, axis), 0, 0],
        cross: [cross, 0, 0],
        crossTangent: [crossTangent, 0, 0],
      };
    }
  }

  function difference(a: Row, b: Row): Row {
    return {
      point: Vec.sub(a.point, b.point),
      du: Vec.sub(a.du, b.du),
      dv: Vec.sub(a.dv, b.dv),
      duv: Vec.sub(a.duv, b.duv),
    };
  }
  /** The same exact four-boundary Coons operator in the prospective chart. */
  export function coons(
    a: Row,
    b: Row,
    source: Pick<Row, "point" | "dv">,
    receiver: Pick<Row, "point" | "dv">,
    corner: readonly [P3, P3, P3, P3],
    h: number,
    t: number,
  ) {
    const [f0, f1, k0, k1] = corner;
    const blend = (a: P3, b: P3, t: number) =>
      Vec.combine([
        [1 - t, a],
        [t, b],
      ]);
    const f = Vec.sub(f1, f0),
      k = Vec.sub(k1, k0);
    return {
      point: Vec.combine([
        [1, blend(a.point, b.point, t)],
        [1, blend(source.point, receiver.point, h)],
        [-1, blend(blend(f0, f1, h), blend(k0, k1, h), t)],
      ]),
      du: Vec.combine([
        [1, blend(a.du, b.du, t)],
        [1, Vec.sub(receiver.point, source.point)],
        [-1, blend(f, k, t)],
      ]),
      dv: Vec.combine([
        [1, Vec.sub(b.point, a.point)],
        [0.5, blend(source.dv, receiver.dv, h)],
        [-1, blend(Vec.sub(k0, f0), Vec.sub(k1, f1), h)],
      ]),
      duv: Vec.combine([
        [1, Vec.sub(b.du, a.du)],
        [0.5, Vec.sub(receiver.dv, source.dv)],
        [-1, Vec.sub(k, f)],
      ]),
    };
  }
}
