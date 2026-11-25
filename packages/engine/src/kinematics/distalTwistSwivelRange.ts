import type {
  IAutoMovieSwivelArcs,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { sphericalBoxMiss } from "./sphericalBoxMiss";
import { swivelArcs } from "./swivelArcs";

/**
 * The swivels at which the mid segment of a chain that twists distally (a
 * forearm) can take, inside its own twist range, the twist a requested end
 * rotation leaves it, as breakpoints of the swivel and a closed-form test.
 *
 * The end joint cannot twist: its twist reads its fixed zero. With the mid
 * segment twisted by `r` about its long axis `u`, the end joint's local
 * rotation is `rest^-1 T(u, -r) K(s)`, `K(s)` the requested rotation seen from
 * the untwisted mid segment at swivel `s`, and its twist is the angle `atan2(P,
 * Q)` of two components of `T(u, -r) x(s)`, `x(s) = K(s) e` with `e` the end
 * joint's flexion axis (`solveDistalTwist` states the reading). That twist
 * stands at its zero where
 *
 *     normal . T(u, -r) x(s) = 0   and   ahead . T(u, -r) x(s) > 0
 *
 * With `normal` and `ahead` the two fixed combinations of the end joint's
 * rest-carried axes that the zero's sine and cosine give. The first is `A + B
 * cos r + C sin r = 0` in the twist (Rodrigues' formula), at most two twists,
 * and the second keeps the one of them whose reading is the zero itself, not
 * the zero plus a half turn. So every swivel asks one twist `r*(s)` of the mid
 * segment, or none where `|A| > hypot(B, C)`.
 *
 * `K(s)` is a fixed rotation, the swivel's turn about the root-to-target line,
 * and another fixed rotation, so every component of `x(s)` is `a + b cos s + c
 * sin s`, fitted exactly from three swivels. The twist asked reaches an end
 * `r0` of the range where `(T(u, r0) normal) . x(s) = 0`, a sinusoid of the
 * swivel with at most two roots, and the twist stops existing where `|u .
 * x(s)|` passes `|normal across u| / |normal|`, two more sinusoids. The root
 * kept changes only where both components of the reading vanish, the twisted
 * axis lying along `normal x ahead`, which needs `|u . x(s)| = |u . (normal x
 * ahead)| / |normal x ahead|`, two more. Between two neighbouring breakpoints
 * the twist asked stays inside the range or stays outside it, so one test at a
 * point of an interval decides the whole interval (the joint-limit intervals of
 * the swivel, Tolani, Goswami and Badler 2000, section 3.2).
 */
export namespace distalTwistSwivelRange {
  /** What the reader is given. */
  export interface IProps {
    /** The mid segment's twist axis in its own articulation frame, unit. */
    axis: IAutoMovieVector3;

    /**
     * The direction the twisted carried axis must be perpendicular to for the
     * end joint's twist to read its zero or its zero plus a half turn, in the
     * mid segment's twisted frame.
     */
    normal: IAutoMovieVector3;

    /**
     * The direction the twisted carried axis must have a positive component on
     * for the reading to be the zero itself, same frame.
     */
    ahead: IAutoMovieVector3;

    /**
     * The end joint's flexion axis under the requested rotation, seen from the
     * untwisted mid segment at a swivel, degrees (`K(s) e`), unit.
     */
    carried: (swivel: number) => IAutoMovieVector3;

    /**
     * The mid segment's twist range about `axis`, rest-relative degrees, the
     * lesser first.
     */
    range: readonly [number, number];
  }

  /** The swivels' admission by the twist range. */
  export interface IRange {
    /** The swivels, degrees in [0, 360), at which the admission may change. */
    breaks: number[];

    /**
     * Whether the twist asked at a swivel, degrees, exists and lies inside the
     * range.
     */
    admits: (swivel: number) => boolean;

    /**
     * A certified lower bound, degrees, of how far any pose the two joints can
     * show misses the requested end rotation over the swivels from `low` to
     * `high` degrees, never negative. Given the end joint's middle-angle
     * interval (its abduction, rest-relative degrees within a quarter turn
     * either way) and the sense of `axis` along the mid segment (1 when it
     * points toward the end joint, -1 when away from it), where the end joint's
     * rest carries its right-handed twist axis onto the mid segment's direction
     * (`distalEndSwivelReadings`' own premise): with the mid segment twisted by
     * `r` and the end joint abducted by `a`, the shown rotation carries the end
     * joint's flexion axis to `T(axis, r) (cos a ahead - sense sin a axis)`, a
     * rectangle of latitudes `a` about `axis` and longitudes `r` from `ahead`,
     * while the requested rotation carries it to the carried axis `x(s)`. A
     * rotation by an angle moves no unit vector by more than that angle, so the
     * miss is at least the spherical distance from `x(s)` to that rectangle
     * (`sphericalBoxMiss`); `x(s)` moves by at most its circle's radius per
     * unit of swivel, so over an interval the bound is its value at the middle
     * less the radius times the half width, lowered by twice the joints'
     * tolerance (`ROM_TOLERANCE`), within which each of the two angles may
     * stand past its interval. Its premise is `ahead` unit and perpendicular to
     * `axis`.
     */
    miss: (
      middle: readonly [number, number],
      sense: 1 | -1,
    ) => (low: number, high: number) => number;
  }

  /**
   * Read the twist range over a turn of the swivel.
   *
   * @param props The twist axis, the zero-twist directions, the carried axis by
   *   swivel and the range.
   * @returns The breakpoints and the admission test.
   */
  export function of(props: IProps): IRange {
    const u: IAutoMovieVector3 = props.axis;
    const D: number = Quaternion.DEG2RAD;

    // x(s) = a + b cos s + c sin s, component by component.
    const carried: IProps["carried"] = props.carried;
    const zero: IAutoMovieVector3 = carried(0);
    const quarter: IAutoMovieVector3 = carried(90);
    const half: IAutoMovieVector3 = carried(180);
    const fit = (
      pick: (v: IAutoMovieVector3) => number,
    ): IAutoMovieSwivelArcs.ISinusoid =>
      swivelArcs.fitted(pick(zero), pick(quarter), pick(half));
    const onX: IAutoMovieSwivelArcs.ISinusoid = fit(
      (v: IAutoMovieVector3): number => v.x,
    );
    const onY: IAutoMovieSwivelArcs.ISinusoid = fit(
      (v: IAutoMovieVector3): number => v.y,
    );
    const onZ: IAutoMovieSwivelArcs.ISinusoid = fit(
      (v: IAutoMovieVector3): number => v.z,
    );
    const along = (n: IAutoMovieVector3): IAutoMovieSwivelArcs.ISinusoid => ({
      a: n.x * onX.a + n.y * onY.a + n.z * onZ.a,
      b: n.x * onX.b + n.y * onY.b + n.z * onZ.b,
      c: n.x * onX.c + n.y * onY.c + n.z * onZ.c,
    });

    // The twist asked reaches an end r0 where (T(u, r0) normal) . x(s) = 0,
    // and stops existing where |u . x(s)| passes the cone's half width.
    const breaks: number[] = [];
    for (const end of props.range)
      breaks.push(
        ...swivelArcs.roots(
          along(
            Quaternion.rotateVector(
              Quaternion.fromAxisAngle(u, end),
              props.normal,
            ),
          ),
        ),
      );
    const length: number = Vector3.length(props.normal);
    const across: number = Vector3.length(
      Vector3.subtract(
        props.normal,
        Vector3.scale(u, Vector3.dot(props.normal, u)),
      ),
    );
    const onAxis: IAutoMovieSwivelArcs.ISinusoid = along(u);
    const level = (height: number): void => {
      for (const sign of [1, -1])
        breaks.push(
          ...swivelArcs.roots({ ...onAxis, a: onAxis.a - sign * height }),
        );
    };
    if (length > 0) level(across / length);

    // The reading itself is undefined where the twisted axis lies along the
    // line perpendicular to both directions (both components vanish): past
    // such a swivel the twist kept is the other root.
    const pole: IAutoMovieVector3 = Vector3.cross(props.normal, props.ahead);
    if (Vector3.length(pole) > 0)
      level(Math.abs(Vector3.dot(u, Vector3.normalize(pole))));
    const middle: number = (props.range[0] + props.range[1]) / 2;

    // n . T(u, -r) x = alpha + beta cos r + gamma sin r (Rodrigues).
    const harmonic = (
      n: IAutoMovieVector3,
      x: IAutoMovieVector3,
    ): [number, number, number] => {
      const alpha: number = Vector3.dot(n, u) * Vector3.dot(u, x);
      return [
        alpha,
        Vector3.dot(n, x) - alpha,
        -Vector3.dot(n, Vector3.cross(u, x)),
      ];
    };
    // The carried axis's circle and the rectangle's frame, for the miss.
    const reach: number = Math.max(
      Math.hypot(onX.b, onY.b, onZ.b),
      Math.hypot(onX.c, onY.c, onZ.c),
    );
    const meridian: IAutoMovieVector3 = Vector3.normalize(props.ahead);
    const side: IAutoMovieVector3 = Vector3.cross(u, meridian);
    const outer: readonly [number, number] | null =
      props.range[1] - props.range[0] >= 360 ? null : props.range;
    return {
      breaks,
      miss:
        (
          inner: readonly [number, number],
          sense: 1 | -1,
        ): ((low: number, high: number) => number) =>
        (low: number, high: number): number => {
          const swivel: number = (low + high) / 2;
          const cos: number = Math.cos(swivel * D);
          const sin: number = Math.sin(swivel * D);
          const value = (f: IAutoMovieSwivelArcs.ISinusoid): number =>
            f.a + f.b * cos + f.c * sin;
          const x: IAutoMovieVector3 = {
            x: value(onX),
            y: value(onY),
            z: value(onZ),
          };
          const length: number = Vector3.length(x);
          if (!(length > 1e-9)) return 0;
          return Math.max(
            0,
            sphericalBoxMiss(
              (sense * Vector3.dot(u, x)) / length,
              Vector3.dot(side, x) / length,
              Vector3.dot(meridian, x) / length,
              inner,
              outer,
            ) -
              (reach * (high - low)) / 2 -
              2 * ROM_TOLERANCE,
          );
        },
      admits: (swivel: number): boolean => {
        const cos: number = Math.cos(swivel * D);
        const sin: number = Math.sin(swivel * D);
        const value = (f: IAutoMovieSwivelArcs.ISinusoid): number =>
          f.a + f.b * cos + f.c * sin;
        const x: IAutoMovieVector3 = {
          x: value(onX),
          y: value(onY),
          z: value(onZ),
        };
        const [A, B, C]: [number, number, number] = harmonic(props.normal, x);
        const radius: number = Math.hypot(B, C);
        if (!(radius > 1e-12) || Math.abs(A) > radius) return false;
        const centre: number = Math.atan2(C, B);
        const spread: number = Math.acos(-A / radius);
        const [A1, B1, C1]: [number, number, number] = harmonic(props.ahead, x);
        for (const r of [centre + spread, centre - spread]) {
          if (!(A1 + B1 * Math.cos(r) + C1 * Math.sin(r) > 0)) continue;

          // The alias of the twist nearest the range's middle.
          const degrees: number = r / D;
          const twist: number =
            degrees - 360 * Math.round((degrees - middle) / 360);
          if (twist >= props.range[0] && twist <= props.range[1]) return true;
        }
        return false;
      },
    };
  }
}
