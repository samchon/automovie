import {
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieHumanDigitNails,
  AutoMovieVector2Tuple as P2,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import type { FamilyConicMpfbDigitTips as Tips } from "./FamilyConicMpfbDigitTips";
import type { FamilyConicMpfbNailStock as Stock } from "./FamilyConicMpfbNailStock";
import type { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";

/** The raw distal skin and exact source-material length in the same nail frame. */
export namespace FamilyConicMpfbNailSupport {
  /** Measure the fold and free edge against the original skin and material patch. */
  export function observe(
    source: Mpfb.IGeometry,
    patch: Stock.IPatch,
    cap: Tips.ICap,
    made: IAutoMovieHumanDigitNails.IMade,
  ) {
    const { origin, distal, dorsal } = made.nail.frame;
    const lateral: P3 = Vec.cross(distal, dorsal);
    function chart(p: P3): P3 {
      const q: P3 = Vec.sub(p, origin);
      return [Vec.dot(q, distal), Vec.dot(q, dorsal), Vec.dot(q, lateral)];
    }
    const [fold, free] = made.nail.plan.span;
    const layer: number =
      chart(made.nail.plate.centres[0]!)[1] + made.nail.plate.values[0]![0]!;
    const thickness: number = made.row.proportions.thickness;
    const extents: number[] = patch.points.map((p): number => chart(p)[0]);
    const first: number = Math.min(...extents),
      last: number = Math.max(...extents);
    const raw = Full.create(cap.view);
    const [lo, hi] = raw.regular ?? raw.domain;
    const before: number = Math.max(lo, cap.from - (last - first));
    const count: number = Math.ceil(hi - before);
    // One-millimetre original axial probes supply a bounded Newton start.
    const probes = Array.from({ length: count + 1 }, (_, i) => {
      const s: number = before + ((hi - before) * i) / count;
      const frame = cap.view.axis.at(s);
      const phase: number = Math.atan2(
        Vec.dot(dorsal, frame.v),
        Vec.dot(dorsal, frame.u),
      );
      return { s, phase, q: chart(raw.point(s, phase)) };
    });
    const surface = (x: number): { height: number; station: number } | null => {
      const closest = probes.reduce((a, b) =>
        Math.hypot(a.q[0] - x, a.q[2]) <= Math.hypot(b.q[0] - x, b.q[2])
          ? a
          : b,
      );
      let s: number = closest.s,
        phase: number = closest.phase;
      for (let i: number = 0; i < 12; ++i) {
        const j = raw.jet(s, phase);
        const [u, v, w] = chart(j.p);
        if (Math.hypot(u - x, w) < 1e-6) return { height: v, station: s };
        const move = Vec.solve2(
          Vec.dot(j.u, distal),
          Vec.dot(j.v, distal),
          Vec.dot(j.u, lateral),
          Vec.dot(j.v, lateral),
          [x - u, -w],
        );
        if (move === null) return null;
        s += move[0];
        phase += move[1];
        if (!(s >= lo && s <= hi)) return null;
      }
      return null;
    };
    const positions = source.body.positions;
    const triangle: P3[] = patch.indices.map(
      (i): P3 =>
        chart([
          positions[3 * i]!,
          positions[3 * i + 1]!,
          positions[3 * i + 2]!,
        ]),
    );
    const reference = (x: number): number | null => {
      let highest: number = -Infinity;
      for (let i: number = 0; i < triangle.length; i += 3) {
        const a: P3 = triangle[i]!,
          b: P3 = triangle[i + 1]!,
          c: P3 = triangle[i + 2]!;
        const [u, v]: P3 = Vec.sub(b, a),
          [p, q]: P3 = Vec.sub(c, a);
        const weights: P2 | null = Vec.solve2(u, p, b[2] - a[2], c[2] - a[2], [
          x - a[0],
          -a[2],
        ]);
        if (
          weights === null ||
          weights[0] < 0 ||
          weights[1] < 0 ||
          weights[0] + weights[1] > 1
        )
          continue;
        highest = Math.max(highest, a[1] + v * weights[0] + q * weights[1]);
      }
      return Number.isFinite(highest) ? highest : null;
    };
    const steps: number = Math.ceil(last - first);
    const xs: number[] = [
      fold,
      free,
      ...Array.from(
        { length: steps + 1 },
        (_, i): number => first + ((last - first) * i) / steps,
      ),
    ].sort((a, b): number => a - b);
    const rows = xs.map((x) => {
      const reading = surface(x);
      const parent: number | null = reading?.height ?? null,
        stock: number | null = reference(x);
      return {
        x,
        parent,
        station: reading?.station ?? null,
        stock,
        padExcess: parent === null || stock === null ? null : parent - stock,
        freeEdgeMargin: parent === null ? null : layer - parent - thickness,
      };
    });
    return {
      span: [fold, free],
      referenceSpan: [first, last],
      crown: layer,
      thickness,
      rows,
    };
  }
}
