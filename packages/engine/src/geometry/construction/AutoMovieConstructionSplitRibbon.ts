import type { AutoMovieVector3Tuple as P3 } from "@automovie/interface";

import { AutoMovieConstructionSplitCubic as Cubic } from "./AutoMovieConstructionSplitCubic";
import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

/** Transverse corrections shared by adjoining generating-curve sectors. */
export namespace AutoMovieConstructionSplitRibbon {
  /** One signed transverse correction defined by the two genuine end lines. */
  export type Ribbon = (u: number) => (v: number) => P3;

  type CourseAt = (t: number) => Cubic.Course;

  /**
   * ESTIMATE of the angular jet at the observed numerical resolution. The
   * second-order one-sided stencil never reads beyond its own source sector.
   */
  function readAngularEndpoint(
    read: CourseAt,
    end: 0 | 1,
    step: number = Math.cbrt(Number.EPSILON) / 2,
  ): Cubic.Cubic {
    const sign = 1 - 2 * end;
    const p = read(end).controls;
    const a = read(end + sign * step).controls;
    const b = read(end + 2 * sign * step).controls;
    return p.map(
      (x, i): P3 =>
        Vec.combine([
          [(2 * sign) / step, Vec.sub(a[i]!, x)],
          [-sign / (2 * step), Vec.sub(b[i]!, x)],
        ]),
    ) as Cubic.Cubic;
  }

  /** Prepare one geometric transverse direction over the actual shared line. */
  export function prepareCoursePlane(before: CourseAt, after: CourseAt) {
    const line = before(1).controls;
    const left = readAngularEndpoint(before, 1);
    const right = readAngularEndpoint(after, 0);
    return (u: number): readonly [P3, P3] => {
      const zero: P3 = [0, 0, 0];
      if (u === 0 || u === 1) return [zero, zero];
      const along = Vec.unit(Cubic.first(line, u))!;
      const direction = (angular: Cubic.Cubic): P3 => {
        const original = Cubic.value(angular, u);
        return Vec.sub(original, Vec.scale(along, Vec.dot(original, along)));
      };
      const a = direction(left);
      const b = direction(right);
      // ESTIMATE. Equal angular weight moves both unit directions by the same
      // angle and retains their measured positive chart rates and tangential
      // shear separately. Salvi, Vaitkus and Várady §3.2 give the common-plane
      // direction plus scalar rate and shear representation.
      // https://doi.org/10.1016/j.cag.2023.05.020
      const axis = Vec.unit(Vec.add(Vec.unit(a)!, Vec.unit(b)!))!;
      return [
        Vec.sub(Vec.scale(axis, Vec.norm(a)), a),
        Vec.sub(Vec.scale(axis, Vec.norm(b)), b),
      ];
    };
  }

  /**
   * Extend only the line-owned angular derivative into the unchanged sector. The
   * cubic Hermite endpoint basis is the lowest degree preserving both line values
   * and imposing one edge derivative. Gregory's u/(u+v) corner factor protects
   * the other boundary's original first derivative for incompatible mixed jets.
   * Partition by the two original course endpoint distances.
   * https://bura.brunel.ac.uk/bitstream/2438/1959/1/TR_47.pdf §2.1
   */
  export function prepareCourseRibbon(
    before: ReturnType<typeof prepareCoursePlane>,
    after: ReturnType<typeof prepareCoursePlane>,
  ): Ribbon {
    return (u) => {
      if (u === 0 || u === 1) return () => [0, 0, 0];
      const start = before(u)[1];
      const end = after(u)[0];
      const e = 1 - u;
      const weight = (v: number): number =>
        v * (1 - v) ** 2 * ((e * u) / (u + v) + (u * e) / (e + v));
      return (v) =>
        Vec.combine([
          [weight(v), start],
          [-weight(1 - v), end],
        ]);
    };
  }
}
