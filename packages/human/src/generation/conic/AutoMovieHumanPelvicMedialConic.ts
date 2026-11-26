import {
  type AutoMovieConstructionSplitCourses,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple as P3,
  IAutoMovieSolidSurface as Surface,
} from "@automovie/interface";

import type { AutoMovieHumanPelvicMedian as Median } from "./AutoMovieHumanPelvicMedian";
import type { AutoMovieHumanPelvicRegistration as Guide } from "./AutoMovieHumanPelvicRegistration";
import type { AutoMovieHumanPelvicSplit as Pelvis } from "./AutoMovieHumanPelvicSplit";

/** One source-owned family of rational transverse pelvic courses. */
export namespace AutoMovieHumanPelvicMedialConic {
  /** The complete authored median and both actual receiving sections. */
  type Source = Exclude<ReturnType<typeof Pelvis.source>, string>;

  /** The split's already prepared native boundaries. */
  type Courses = Exclude<
    ReturnType<typeof AutoMovieConstructionSplitCourses.prepare>,
    string
  >;

  /** Select one shared AP proportion and one physical departure pace. */
  export function prepare(
    source: Source,
    median: ReturnType<typeof Median.cardinal>,
    raw: Courses,
    original: readonly Guide.IRegistration[],
  ) {
    const apex = source.guide.at(0.5).p;
    const fields = source.rails.map(({ part, outward, station }, owner) => {
      const registration = original[owner]!;
      const { edges, rows } = raw.jets[owner]!;
      const edge = edges.find(({ seam }) => seam !== undefined)!;
      const columns = edge.count;
      const axis = Vec.dot(
        Vec.sub(part.axis.at(station).origin, apex),
        outward,
      );
      const center = centre(source, registration, owner);
      if (!("admitted" in center && center.admitted && axis > 0))
        throw new Error(`${part.name} has no original same-AP calibration`);
      const pace = center.rays[0] * Math.sqrt(center.w2);
      const read = (v: number) => {
        const p = source.guide.at(v);
        const { q, rate } = registration.receive(v);
        const delta = Vec.sub(q.p, p.p);
        const normal = Vec.cross(q.u, q.v);
        const slope = p.d[1] / p.d[0];
        if (!(p.d[0] < 0 && rate * q.v[0] < 0 && normal[2] !== 0))
          throw new Error(`${part.name} has an unordered source at ${v}`);
        // C-P lies in both its original planes. Its prescribed AP coordinate
        // is a single convex combination of the two original AP positions.
        const base = Vec.scale([0, 0, 1], Vec.dot(normal, delta) / normal[2]);
        const shift: P3 = [
          delta[0],
          delta[0] * slope,
          (-delta[0] * (normal[0] + slope * normal[1])) / normal[2],
        ];
        return { p, q, rate, delta, normal, slope, base, shift };
      };
      return {
        part: part.name,
        outward,
        axis,
        center,
        pace,
        rows,
        columns,
        reverse: edge.seam!.reverse,
        read,
        registration,
        sites: Array.from({ length: 2 * columns + 1 }, (_, j) =>
          read(j / (2 * columns)),
        ),
      };
    });
    const constraints = fields.flatMap(({ sites, outward }) =>
      sites.flatMap(({ base, shift, delta }) => {
        const dir = Vec.unit(delta)!;
        return [
          [Vec.dot(base, outward), Vec.dot(shift, outward)],
          [Vec.dot(base, dir), Vec.dot(shift, dir)],
          [Vec.dot(Vec.sub(delta, base), dir), -Vec.dot(shift, dir)],
          [-base[1], -shift[1]],
          [base[1] - delta[1], shift[1]],
        ] as const;
      }),
    );
    const lower = Math.max(
      0,
      ...constraints.filter(([, m]) => m > 0).map(([b, m]) => -b / m),
    );
    const upper = Math.min(
      1,
      ...constraints.filter(([, m]) => m < 0).map(([b, m]) => -b / m),
    );
    if (!(lower < upper && constraints.every(([b, m]) => m !== 0 || b >= 0)))
      throw new Error(
        "The original tangent planes have no common ordered AP proportion",
      );
    // ESTIMATE. One midpoint of the bilateral, whole-arc admissible interval
    // gives equal fractional margin from both limiting source conditions.
    const beta = (lower + upper) / 2;
    const cap = fields.map(({ sites, outward, axis, part }) =>
      Math.min(
        ...sites.map(({ p, q, base, shift }) => {
          const origin = Vec.dot(Vec.sub(p.p, apex), outward);
          const end = Vec.dot(Vec.sub(q.p, apex), outward);
          const reach = Vec.dot(Vec.add(base, Vec.scale(shift, beta)), outward);
          if (!(origin < axis && end < axis && reach > 0))
            throw new Error(
              `${part} has no source hull bounded by the actual thigh axis`,
            );
          const c = origin + reach;
          // A nonnegative quadratic on positive odds has middle coefficient at
          // least minus the geometric mean of its end coefficients. Apply that
          // exact rational half-space bound to the original medial axis plane.
          return c <= axis
            ? Infinity
            : (reach * Math.sqrt((axis - origin) * (axis - end))) / (c - axis);
        }),
      ),
    );
    const wanted = Math.min(...fields.map(({ pace }) => pace));
    const pace = Math.min(wanted, ...cap);
    if (!(pace > 0))
      throw new Error("The native medial hull has no positive departure pace");
    const charts = fields.map(
      (
        {
          part,
          outward,
          axis,
          center,
          rows,
          columns,
          reverse,
          read,
          registration,
        },
        i,
      ) => {
        const profile = (v: number) => {
          const { p, q, rate, delta, normal, slope, base, shift } = read(v);
          const control = Vec.add(base, Vec.scale(shift, beta));
          const to = Vec.scale(q.v, rate);
          const deltaFirst = Vec.sub(to, p.d);
          const sagittalNormal = Vec.unit([-p.d[1], p.d[0], 0])!;
          const slopeFirst =
            (1 + slope * slope) *
            median.normalCurvature(v, sagittalNormal) *
            Vec.norm(p.d);
          const cx = beta * deltaFirst[0];
          const cy = cx * slope + control[0] * slopeFirst;
          const nFirst = Vec.scale(
            Vec.add(Vec.cross(q.uv, q.v), Vec.cross(q.u, q.vv)),
            rate,
          );
          const cz =
            (Vec.dot(nFirst, Vec.sub(delta, control)) +
              Vec.dot(normal, Vec.sub(deltaFirst, [cx, cy, 0]))) /
            normal[2];
          const dControl: P3 = [cx, cy, cz];
          const lateral = Vec.dot(control, outward);
          const w = pace / lateral;
          const dw = (-w * Vec.dot(dControl, outward)) / lateral;
          return {
            p,
            q,
            to,
            delta,
            deltaFirst,
            control,
            dControl,
            w,
            dw,
            slope,
            slopeFirst,
            normal,
            nFirst,
          };
        };
        return {
          part,
          outward,
          rows,
          columns,
          reverse,
          axis,
          center,
          physicalPaceLimit: cap[i],
          sourceAtChild: registration.sourceAtChild,
          contact(v: number) {
            const { p, q } = read(v);
            return {
              source: p.p,
              receiver: q.p,
              sourceNormal: Vec.unit(Vec.cross(p.d, outward))!,
              receiverNormal: Vec.unit(Vec.cross(q.u, q.v))!,
            };
          },
          profile,
          atV(v: number) {
            const { p, q, to, delta, deltaFirst, control, dControl, w, dw } =
              profile(v);
            const shape = Vec.sub(control, Vec.scale(delta, beta));
            const shapeFirst = Vec.sub(dControl, Vec.scale(deltaFirst, beta));
            return (s: number) => {
              const { value, along, weight } = basis(s, beta, w);
              return {
                point:
                  s === 0
                    ? p.p
                    : s === 1
                      ? q.p
                      : Vec.combine([
                          [1, p.p],
                          [s, delta],
                          [value, shape],
                        ]),
                du: Vec.add(delta, Vec.scale(shape, along)),
                dv:
                  s === 0
                    ? p.d
                    : s === 1
                      ? to
                      : Vec.combine([
                          [1, p.d],
                          [s, deltaFirst],
                          [value, shapeFirst],
                          [weight * dw, shape],
                        ]),
              };
            };
          },
        };
      },
    );
    return { lower, upper, beta, pace, wanted, charts };
  }
  /** Read the exact same-AP conic at the person's measured perineal point. */
  export function centre(
    source: Source,
    original: Guide.IRegistration,
    owner: number,
  ) {
    const p = source.guide.at(0.5).p;
    const outward = source.rails[owner]!.outward;
    const native = source.guide.transverse();
    const direction = Vec.scale(native, Math.sign(Vec.dot(native, outward)));
    return conic(p, direction, original.atPhysicalX(p[0]));
  }
  /**
   * Evaluate the physical conic from two positive tangent rays and the actual
   * receiving curvature.
   */
  export function conic(p: P3, tp: P3, jet: Surface.IJet) {
    const { p: q, u, v, uu, uv, vv } = jet;
    const chord = Vec.sub(q, p);
    const plane = Vec.unit(Vec.cross(tp, chord));
    const normal = Vec.unit(Vec.cross(u, v));
    const cross =
      plane === null || normal === null
        ? null
        : Vec.unit(Vec.cross(plane, normal));
    if (cross === null || plane === null || normal === null)
      return { p, q, tp, refusal: "Nonregular physical intersection" } as const;
    const tq = Vec.dot(cross, chord) < 0 ? Vec.scale(cross, -1) : cross;
    const cosine = Vec.dot(tp, tq);
    const rays = Vec.solve2(1, cosine, cosine, 1, [
      Vec.dot(chord, tp),
      Vec.dot(chord, tq),
    ]);
    const coordinates = Vec.solve2(
      Vec.dot(u, u),
      Vec.dot(u, v),
      Vec.dot(u, v),
      Vec.dot(v, v),
      [Vec.dot(u, tq), Vec.dot(v, tq)],
    );
    if (rays === null || coordinates === null)
      return {
        p,
        q,
        tp,
        tq,
        refusal: "Singular tangent-ray coordinates",
      } as const;
    const [a, b] = rays,
      [s, t] = coordinates;
    const middle = Vec.add(p, Vec.scale(tp, a));
    const along = Vec.combine([
      [s * s, uu],
      [2 * s * t, uv],
      [t * t, vv],
    ]);
    const bend = Vec.cross(plane, tq);
    const kQ = Vec.dot(along, normal) / Vec.dot(bend, normal);
    // A positive rational quadratic's endpoint curvature is the chord's
    // signed normal component divided by twice the squared handle length
    // and weight. Each position, tangent and the receiving curvature is owned.
    // Gfrerrer and Weiss (2020), https://doi.org/10.1016/j.cagd.2020.101904.
    const w2 = Vec.dot(Vec.scale(chord, -1), bend) / (2 * b * b * kQ);
    const kP = Vec.dot(chord, Vec.cross(plane, tp)) / (2 * a * a * w2);
    const error = Vec.norm(Vec.sub(middle, Vec.sub(q, Vec.scale(tq, b))));
    return {
      p,
      q,
      tp,
      tq,
      middle,
      rays,
      kQ,
      kP,
      w2,
      error,
      admitted: a > 0 && b > 0 && w2 > 0 && Number.isFinite(w2),
    } as const;
  }
  /** Positive rational clock with AP progress s=B_Q+beta*B_C. */
  function basis(s: number, beta: number, w: number) {
    if (s === 0) return { value: 0, along: 1 / beta, weight: 0 };
    if (s === 1) return { value: 0, along: -1 / (1 - beta), weight: 0 };
    const h = w * (s - beta);
    const radical = Math.hypot(h, Math.sqrt(s * (1 - s)));
    const odds = h < 0 ? s / (radical - h) : (radical + h) / (1 - s);
    const t = odds / (1 + odds);
    const k = 2 * t * (1 - t);
    const kt = 2 - 4 * t;
    const denominator = 1 + (w - 1) * k;
    const square = denominator * denominator;
    const ct = (w * kt) / square;
    const cw = (k * (1 - k)) / square;
    const qt = (2 * t * denominator - t * t * (w - 1) * kt) / square;
    const qw = (-t * t * k) / square;
    const along = ct / (qt + beta * ct);
    return {
      value: (w * k) / denominator,
      along,
      weight: cw - along * (qw + beta * cw),
    };
  }
}
