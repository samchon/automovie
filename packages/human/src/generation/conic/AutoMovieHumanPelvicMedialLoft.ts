import {
  type AutoMovieConstructionSplitCourses,
  AutoMovieBernstein64 as B,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type { AutoMovieVector3Tuple as P3 } from "@automovie/interface";

import type { AutoMovieHumanPelvicMedialConic as Medial } from "./AutoMovieHumanPelvicMedialConic";
import type { AutoMovieHumanPelvicSplit as Pelvis } from "./AutoMovieHumanPelvicSplit";

/** The real fore and rear forks, medial stock courses, and shared center. */
export namespace AutoMovieHumanPelvicMedialLoft {
  /** Actual parent and receiving curve source. */
  type Source = Exclude<ReturnType<typeof Pelvis.source>, string>;

  /** The original split's exterior and medial courses. */
  type Courses = Exclude<
    ReturnType<typeof AutoMovieConstructionSplitCourses.prepare>,
    string
  >;

  /** The conic support for one physical side. */
  type Chart = ReturnType<typeof Medial.prepare>["charts"][number];

  /** The conic point and both boundary jets at one angular address. */
  type Profile = ReturnType<Chart["profile"]>;

  /** Analytic frame in one fixed generating section. */
  type Reader = (u: number) => { point: P3; du: P3; dv: P3 };

  /** Common degree after exact elevation of the native center. */
  const ORDER = 5;

  /** Use one Hermite rule between three physical cross-courses. */
  export function prepare(
    source: Source,
    raw: Courses,
    medial: readonly Chart[],
  ) {
    return medial.map((chart, owner) => {
      const outer = raw.jets[owner]!.edges.find(
        ({ seam }) => seam === undefined,
      )!;
      const end = source.input.parent.cut;
      const front =
        end.point(outer.bodyPhase!(0))[0] > end.point(outer.bodyPhase!(1))[0]
          ? 0
          : 1;
      const forks = [front, 1 - front].map((t, i) =>
        forkField(outer.course, t, chart.atV(i)),
      );
      const boundaries = forks.map(
        ({ controls, one, across, endpointFields }) => {
          const p = endpointFields[0]!.rates!;
          const q = endpointFields[1]!.rates!;
          // Chiyokura and Kimura's physical G1 relation. The two measured
          // coefficient ratios are equal in the exact protected registration.
          // https://doi.org/10.1145/800059.801160
          const angle = B.add(
            B.scale(across, q[0]),
            B.productV([p[1], q[1]], one),
          );
          return {
            points: controls,
            angle,
            lnWeight: controls.map(() => 0),
            dLog: controls.map(() => 0),
          };
        },
      );
      const knots = [0, 0.5, 1].map((v, i) => {
        const profile = chart.profile(v);
        const curve = i === 1 ? center(profile) : boundaries[i / 2]!;
        return {
          offset: curve.points.map((p, k) =>
            Vec.sub(p, chord(profile.p.p, profile.q.p, k)),
          ),
          dOffset: curve.angle.map((p, k) =>
            Vec.sub(p, chord(profile.p.d, profile.to, k)),
          ),
          lnWeight: curve.lnWeight,
          dLog: curve.dLog,
        };
      });
      const fields = knots.slice(1).map((q, i) => {
        const p = knots[i]!;
        const offset = B.hermite(p.offset, q.offset, p.dOffset, q.dOffset, 0.5);
        const lnWeight = p.lnWeight.map((a, k) => [
          a,
          a + p.dLog[k]! / 6,
          q.lnWeight[k]! - q.dLog[k]! / 6,
          q.lnWeight[k]!,
        ]);
        return {
          offset,
          dOffset: B.gridTangent(offset, 2),
          lnWeight,
          dLog: lnWeight.map((coefs) => B.dScalar(coefs, 2)),
        };
      });
      const course = (v: number) => {
        const profile = chart.profile(v);
        const i = v < 0.5 ? 0 : 1;
        const t = 2 * v - i;
        const f = fields[i]!;
        const offset = B.gridValue(f.offset, t);
        const dOffset = B.gridValue(f.dOffset, t);
        const weight = f.lnWeight.map((w) => Math.exp(B.scalar(w, t)));
        const dWeight = f.dLog.map((dw, k) => weight[k]! * B.scalar(dw, t));
        const points = offset.map((d, k) =>
          Vec.add(chord(profile.p.p, profile.q.p, k), d),
        );
        const angle = dOffset.map((d, k) =>
          Vec.add(chord(profile.p.d, profile.to, k), d),
        );
        inherit(profile, points, angle);
        return rational(points, angle, weight, dWeight);
      };
      const atV = (v: number) => course(v).first;
      const junctions = () =>
        boundaries.map(({ points, angle }, i) => {
          const at = atV(i);
          const du = B.tangent(points);
          const rows = Array.from({ length: chart.rows + 1 }, (_, j) => {
            const u = j / chart.rows;
            const q = at(u);
            const p = B.value(points, u);
            const a = B.value(du, u);
            const b = B.value(angle, u);
            const normal = Vec.unit(Vec.cross(a, b))!;
            const other = Vec.unit(Vec.cross(q.du, q.dv))!;
            return {
              u,
              position: Vec.norm(Vec.sub(p, q.point)),
              along: Vec.norm(Vec.sub(a, q.du)),
              acrossGap: Vec.norm(Vec.sub(b, q.dv)),
              tilt: Vec.norm(Vec.cross(normal, other)),
              orientation: Vec.dot(normal, other),
            };
          });
          return { rows };
        });
      const stockCourse = (v: number) => {
        const edge = raw.jets[owner]!.edges.find(
          ({ seam }) => seam !== undefined,
        )!;
        const controls = (v: number) =>
          edge.course(chart.reverse ? 1 - v : v).controls;
        const points: readonly P3[] = controls(v);
        const tangent = B.tangent(points);
        // A numerical parameter-scale ESTIMATE. These unit-interval source
        // stencils are second order, so h^2 and eps/h balance at cbrt(eps).
        // The actual closed-form boundary normals remain independently owned.
        // https://doi.org/10.1090/S0025-5718-1988-0935077-0
        const step = Math.cbrt(Number.EPSILON);
        const across =
          v >= step && v <= 1 - step
            ? B.scale(
                B.add(controls(v + step), controls(v - step), -1),
                1 / (2 * step),
              )
            : (() => {
                const sign = v < step ? 1 : -1;
                const first = B.add(controls(v + sign * step), points, -1);
                const second = B.add(controls(v + 2 * sign * step), points, -1);
                return B.scale(B.add(first, second, -0.25), (2 * sign) / step);
              })();
        const mixed = B.tangent(across);
        const point = (u: number) => B.value(points, u);
        const first = (u: number) => ({
          point: point(u),
          du: B.value(tangent, u),
          dv: B.value(across, u),
          duv: B.value(mixed, u),
        });
        const second = () => {
          const along = B.tangent(tangent);
          return (u: number) => ({ ...first(u), duu: B.value(along, u) });
        };
        const pace = () => {
          const chord = Vec.sub(points.at(-1)!, points[0]!);
          const metric = Vec.dot(chord, chord);
          return tangent.map((p) => Vec.dot(chord, p) / metric);
        };
        return { point, first, second, pace };
      };
      return {
        ...chart,
        stock: (v: number) => stockCourse(v).first,
        stockCourse,
        forks: forks.map(({ endpointFields }) => endpointFields),
        junctions,
        course,
        atV,
      };
    });
  }
  /**
   * Read the exact exterior course and its supported one-sided angular
   * observation. The derivative's unit-interval step balances second-order
   * truncation and machine roundoff, as it does on the original stock course.
   *
   * @see https://doi.org/10.1090/S0025-5718-1988-0935077-0 Fornberg's one-sided stencil.
   */
  export function forkField(
    read: Courses["jets"][number]["edges"][number]["course"],
    t: number,
    medial: Reader,
  ) {
    const controls: readonly P3[] = read(t).controls;
    const h = Math.cbrt(Number.EPSILON);
    const sense = 1 - 2 * t;
    const oneInside = read(t + sense * h).controls;
    const twoInside = read(t + 2 * sense * h).controls;
    const across = controls.map(
      (p, i): P3 =>
        Vec.combine([
          [(2 * sense) / h, Vec.sub(oneInside[i]!, p)],
          [-sense / (2 * h), Vec.sub(twoInside[i]!, p)],
        ]),
    );
    const degree = controls.length - 1;
    const one = B.tangent(controls);
    const endpointFields = [0, 1].map((end) => {
      const j = medial(end);
      const A = across[degree * end]!;
      const B = one[(degree - 1) * end]!;
      const a2 = Vec.dot(A, A),
        b2 = Vec.dot(B, B),
        ab = Vec.dot(A, B);
      const rates = Vec.solve2(a2, ab, ab, b2, [
        Vec.dot(A, j.dv),
        Vec.dot(B, j.dv),
      ]);
      const normal = Vec.unit(Vec.cross(j.du, j.dv))!;
      return {
        desired: j.dv,
        oldAcross: A,
        oldAlong: B,
        rates,
        outsidePlane:
          rates === null
            ? null
            : Vec.norm(
                Vec.sub(
                  j.dv,
                  Vec.combine([
                    [rates[0], A],
                    [rates[1], B],
                  ]),
                ),
              ),
        coursePlane: Vec.dot(Vec.unit(B)!, normal),
        seamPosition: Vec.norm(Vec.sub(controls[degree * end]!, j.point)),
      };
    });
    return { controls, one, across, endpointFields };
  }
  /** Differentiate the original unit normal, keeping its derivative tangent. */
  export function normalJet(cross: P3, first: P3) {
    const normal = Vec.unit(cross)!;
    return {
      normal,
      normalFirst: Vec.scale(
        Vec.sub(first, Vec.scale(normal, Vec.dot(first, normal))),
        1 / Vec.norm(cross),
      ),
    };
  }
  /** Homogeneous degree elevation keeps the central quadratic exactly. */
  function center({ p, q, to, control, dControl, w, dw }: Profile) {
    const c = Vec.add(p.p, control);
    const n = B.elevate([p.p, Vec.scale(c, w), q.p], ORDER);
    const dn = B.elevate(
      [
        p.d,
        Vec.combine([
          [dw, c],
          [w, Vec.add(p.d, dControl)],
        ]),
        to,
      ],
      ORDER,
    );
    const weights = B.elevateScalar([1, w, 1], ORDER);
    const dWeights = B.elevateScalar([0, dw, 0], ORDER);
    const points = n.map((p, k) => Vec.scale(p, 1 / weights[k]!));
    return {
      points,
      angle: dn.map((p, k) =>
        Vec.scale(
          Vec.sub(p, Vec.scale(points[k]!, dWeights[k]!)),
          1 / weights[k]!,
        ),
      ),
      lnWeight: weights.map(Math.log),
      dLog: dWeights.map((w, k) => w / weights[k]!),
    };
  }

  /** Each true rail supplies its endpoints and tangent plane at every phase. */
  function inherit(profile: Profile, points: P3[], angle: P3[]) {
    const { p, q, to, slope, slopeFirst, normal, nFirst } = profile;
    const fences = [
      {
        point: p.p,
        tangent: p.d,
        ...normalJet([slope, -1, 0], [slopeFirst, 0, 0]),
      },
      { point: q.p, tangent: to, ...normalJet(normal, nFirst) },
    ];
    fences.forEach(({ point, tangent, normal, normalFirst }, end) => {
      const rim = end * ORDER;
      const k = end === 0 ? 1 : ORDER - 1;
      points[rim] = point;
      angle[rim] = tangent;
      const relative = Vec.sub(points[k]!, point);
      const rate = Vec.sub(angle[k]!, tangent);
      const height = Vec.dot(relative, normal);
      const change = Vec.dot(relative, normalFirst) + Vec.dot(rate, normal);
      points[k] = Vec.sub(points[k]!, Vec.scale(normal, height));
      angle[k] = Vec.combine([
        [1, angle[k]!],
        [-change, normal],
        [-height, normalFirst],
      ]);
    });
  }

  /** Prepare one rational Bézier reader for all points of this true section. */
  function rational(
    points: P3[],
    angle: P3[],
    weight: number[],
    dWeight: number[],
  ) {
    const n = points.map((p, k) => Vec.scale(p, weight[k]!));
    const dn = angle.map((p, k) =>
      Vec.combine([
        [weight[k]!, p],
        [dWeight[k]!, points[k]!],
      ]),
    );
    const u = B.tangent(n),
      w = B.dScalar(weight);
    const first = (t: number) => {
      const inverse = 1 / B.scalar(weight, t);
      const point = Vec.scale(B.value(n, t), inverse);
      return {
        point,
        du: Vec.scale(
          Vec.sub(B.value(u, t), Vec.scale(point, B.scalar(w, t))),
          inverse,
        ),
        dv: Vec.scale(
          Vec.sub(B.value(dn, t), Vec.scale(point, B.scalar(dWeight, t))),
          inverse,
        ),
      };
    };
    const second = () => {
      const uu = B.tangent(u),
        uv = B.tangent(dn);
      const ww = B.dScalar(w),
        dw = B.dScalar(dWeight);
      return (t: number) => {
        const p = first(t);
        const inverse = 1 / B.scalar(weight, t),
          rate = B.scalar(w, t);
        return {
          ...p,
          duu: Vec.scale(
            Vec.combine([
              [1, B.value(uu, t)],
              [-B.scalar(ww, t), p.point],
              [-2 * rate, p.du],
            ]),
            inverse,
          ),
          duv: Vec.scale(
            Vec.combine([
              [1, B.value(uv, t)],
              [-B.scalar(dw, t), p.point],
              [-rate, p.dv],
              [-B.scalar(dWeight, t), p.du],
            ]),
            inverse,
          ),
        };
      };
    };
    const point = (t: number) =>
      Vec.scale(B.value(n, t), 1 / B.scalar(weight, t));
    return { point, first, second };
  }

  function chord(p: P3, q: P3, k: number): P3 {
    return Vec.combine([
      [1 - k / ORDER, p],
      [k / ORDER, q],
    ]);
  }
}
