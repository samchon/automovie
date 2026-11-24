import {
  AutoMovieSolidBlend,
  AutoMovieSolidVector as V,
} from "@automovie/engine";
import type {
  IAutoMovieBlendCrossJet,
  IAutoMovieSolidSurface,
  AutoMovieVector2Tuple as Plane,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";

/** A value and its first two derivatives on one projected generating line. */
type Projection = [value: Plane, first: Plane, second: Plane];

/** Anchor the independent torso depth field to an explicit world rail. */
export namespace AutoMovieHumanTrunkCarrier {
  /**
   * Prepare one cross line. Its first direction is the parent's departure,
   * normalized in physical millimetres. Projection and differential use the
   * ordinary quotient rule. The starting second-derivative basis joins the
   * rail's actual projected curvature to a straight generated stock line.
   *
   * @param input World millimetres and the analytic jet of the stored (+Z)
   *   side. The plane distance fixes the chart, the length fixes the cross-line
   *   scale, and the optional anchor restricts the depth correction to its
   *   physical support.
   * @returns The scoped projection and a reader bound to a supplied independent
   *   chart. The reader preserves the incoming cross jet and consumes the chart
   *   directly beyond the correction support.
   * @see https://doi.org/10.1002/nme.1620070405
   */
  export function prepare(input: {
    origin: Point;
    reach: number;
    length: number;
    anchor?: number;
    rail: IAutoMovieSolidSurface.IJet;
  }) {
    const { origin, reach, length, rail } = input;
    const support: number = (input.anchor ?? length) / length;
    if (!(Number.isFinite(reach) && reach > 0 && support > 0 && support <= 1))
      throw new Error(
        "The torso rail correction needs a positive chart plane and support inside its generated line",
      );
    const scale: number = length / V.norm(rail.u);
    const raw: IAutoMovieBlendCrossJet = {
      point: V.sub(rail.p, origin),
      first: V.scale(rail.u, scale),
      second: V.scale(rail.uu, scale * scale),
    };
    const [z, dz, ddz] = [raw.point[2], raw.first[2], raw.second[2]];
    if (!(z > 0 && scale > 0 && Number.isFinite(scale)))
      throw new Error(
        "The explicit torso rail leaves its positive projective domain",
      );
    const project = (k: 0 | 1): Point => {
      const a: number = (reach * raw.point[k]) / z;
      const b: number = (reach * raw.first[k] - a * dz) / z;
      const c: number = (reach * raw.second[k] - a * ddz - 2 * b * dz) / z;
      return [a, b, c];
    };
    const [x, y]: [Point, Point] = [project(0), project(1)];
    const address = (t: number): Projection => {
      const h: number[][] = AutoMovieSolidBlend.basis(t);
      return [
        [
          x[0] + t * x[1] + h[0]![2]! * x[2],
          y[0] + t * y[1] + h[0]![2]! * y[2],
        ],
        [x[1] + h[1]![2]! * x[2], y[1] + h[1]![2]! * y[2]],
        [h[2]![2]! * x[2], h[2]![2]! * y[2]],
      ];
    };
    const expected: IAutoMovieBlendCrossJet = {
      point: rail.p,
      first: raw.first,
      second: raw.second,
    };
    const bind = (
      read: (x: number, y: number) => IAutoMovieSolidSurface.IJet | null,
    ): ((t: number) => IAutoMovieBlendCrossJet | null) | null => {
      const sample = (
        t: number,
      ): { depth: Point; chart: Projection } | null => {
        const chart: Projection = address(t);
        const [uv, a, b] = chart;
        const hit: IAutoMovieSolidSurface.IJet | null = read(...uv);
        if (hit === null) return null;
        const [hu, hv]: Plane = [hit.u[2], hit.v[2]];
        return {
          chart,
          depth: [
            hit.p[2] - origin[2],
            hu * a[0] + hv * a[1],
            hit.uu[2] * a[0] ** 2 +
              2 * hit.uv[2] * a[0] * a[1] +
              hit.vv[2] * a[1] ** 2 +
              hu * b[0] +
              hv * b[1],
          ],
        };
      };
      const start = sample(0);
      if (start === null) return null;
      const correction: Point = V.sub([z, dz, ddz], start.depth);
      return (t: number): IAutoMovieBlendCrossJet | null => {
        const measured = sample(t);
        if (measured === null) return null;
        const h: number[][] | null =
          t < support ? AutoMovieSolidBlend.basis(t / support) : null;
        const a: Point =
          h === null
            ? measured.depth
            : ([0, 1, 2].map(
                (i): number =>
                  measured.depth[i]! +
                  (h[i]![0]! * correction[0] +
                    h[i]![1]! * correction[1] * support +
                    h[i]![2]! * correction[2] * support * support) /
                    support ** i,
              ) as Point);
        const [[p, q], [dp, dq], [ddp, ddq]] = measured.chart;
        const d: Point = [p / reach, q / reach, 1];
        const dd: Point = [dp / reach, dq / reach, 0];
        const ddd: Point = [ddp / reach, ddq / reach, 0];
        return {
          point: V.add(origin, V.scale(d, a[0])),
          first: V.combine([
            [a[1], d],
            [a[0], dd],
          ]),
          second: V.combine([
            [a[2], d],
            [2 * a[1], dd],
            [a[0], ddd],
          ]),
        };
      };
    };
    return { address, bind, expected };
  }
}
