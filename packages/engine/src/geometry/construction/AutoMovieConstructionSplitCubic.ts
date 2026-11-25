import type {
  AutoMovieVector3Tuple as P3,
  IAutoMovieSolidSurface as Solid,
} from "@automovie/interface";

import { AutoMovieBernsteinAlgebra64 as Bernstein } from "../curve/AutoMovieBernsteinAlgebra64";
import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

/** Bounded generating curves and shared cubic saddles for split branches. */
export namespace AutoMovieConstructionSplitCubic {
  /** Four world-space cubic Bézier controls, in millimetres. */
  export type Cubic = [P3, P3, P3, P3];
  /**
   * A cubic or a quintic with source-owned normal accelerations, in
   * millimetres.
   */
  export type Controls = Cubic | [P3, P3, P3, P3, P3, P3];
  /** Geometric polar correspondence for one fixed native receiving rail. */
  export type Clock = {
    /** Physical angle in radians around the receiving plane. */
    phase: (p: P3) => number;
    /** Physical angle derivative under the supplied world-space direction. */
    rate: (p: P3, d: P3) => number;
    /** Exact native receiving jet and its chart phase in radians. */
    read: (angle: number) => Solid.IJet & { phase: number };
  };
  /** One generating curve and its exact receiving address. */
  export type Course = {
    /** World-space Bézier controls in course order. */
    controls: Controls;
    /** Native receiving chart phase in radians. */
    phase: number;
  };
  /** The bounded cubic saddle with its jointly owned endpoint tangent planes. */
  export function prepareSaddle(
    end: readonly Solid.IJet[],
    separating: P3,
    forward: P3,
    railReach: number,
    estimatedReach: number,
  ) {
    const positive = (d: P3): P3 =>
      Vec.dot(d, forward) < 0 ? Vec.scale(d, -1) : d;
    const normals = end.map(({ u, v }): P3 => Vec.unit(Vec.cross(u, v))!);
    const rays = normals.map(
      (n): P3 => positive(Vec.unit(Vec.cross(n, separating))!),
    );
    const across = normals.map((n): P3 => {
      const t: P3 = Vec.unit(Vec.cross(n, forward))!;
      return Vec.dot(t, separating) >= 0 ? t : Vec.scale(t, -1);
    });
    // ESTIMATE. A tip outside the existing receiving domain cannot constrain
    // this web. Bisect its measured admissible interval, reserving positive
    // forward course both for the saddle and for the native continuation.
    const bounded = !(estimatedReach > 0 && estimatedReach < railReach);
    const depth: number = bounded ? railReach / 2 : estimatedReach;
    // Equal forward inner controls give z = 3 h t (1 - t). Their apex
    // is 3 h / 4 at t = 1 / 2, so h = 4 depth / 3.
    const height: number = (4 * depth) / 3;
    const seam: Cubic = [
      end[0]!.p,
      Vec.add(
        end[0]!.p,
        Vec.scale(rays[0]!, height / Vec.dot(rays[0]!, forward)),
      ),
      Vec.add(
        end[1]!.p,
        Vec.scale(rays[1]!, height / Vec.dot(rays[1]!, forward)),
      ),
      end[1]!.p,
    ];
    const span: P3 = Vec.sub(seam[3], seam[0]);
    const length: number = Vec.norm(span);
    const chord: P3 = Vec.scale(span, 1 / length);
    const increments = seam
      .slice(1)
      .map((p, i): number => Vec.dot(Vec.sub(p, seam[i]!), chord));
    // Equal forward heights occur only at complementary parameters. Their
    // chord gap is (1 - 2t) [L + (3M - L)t(1 - t)], where L and M are the
    // endpoint and middle-control chord spans. Its normalized factor has the
    // following exact lower bound, including the derivative at the apex.
    const pairedChordBound: number = Math.min(
      length,
      (3 * (length + increments[1]!)) / 4,
    );
    const transverse = (s: number): P3 =>
      // ESTIMATE. The two measured transverse directions have no independent
      // interior samples. Their linear interpolation holds both fork planes.
      Vec.combine([
        [1 - s, across[0]!],
        [s, across[1]!],
      ]);
    const medial = (s: number, side: number): P3 => {
      const t: P3 = Vec.unit(first(seam, s))!;
      // The quadratic is the least-degree lateral factor zero at both forks.
      // It has unit value at the apex where the linear tangential term is zero.
      return Vec.unit(
        Vec.combine([
          [1 - 2 * s, t],
          [side * 4 * s * (1 - s), transverse(s)],
        ]),
      )!;
    };
    return {
      cubic: seam,
      rays,
      increments,
      pairedChordBound,
      depth,
      bounded,
      departure: medial,
      transverse,
    };
  }

  /**
   * Minimum cubic holding two end tangent rays. Its forward handles cannot
   * overrun the gap.
   */
  export function connection(
    p: P3,
    q: Solid.IJet & { phase: number },
    z: P3,
    end: (j: Solid.IJet) => P3,
    start: (reach: number) => P3,
  ): Course & { controls: Cubic } {
    const reach: number = Vec.dot(Vec.sub(q.p, p), z) / 3;
    return {
      controls: [
        p,
        Vec.add(p, Vec.scale(start(reach), reach)),
        Vec.sub(q.p, Vec.scale(end(q), reach)),
        q.p,
      ],
      phase: q.phase,
    };
  }

  /**
   * Carry the two native normal accelerations using the minimum Hermite degree.
   *
   * @see https://www2.mathematik.tu-darmstadt.de/~ehartmann/cdgen.pdf Section 11.3.
   * @see https://doi.org/10.1090/S0025-5718-1989-0962209-1 Positive and monotone quintic control bounds.
   */
  export function withCurvature(
    { controls: [p, b, c, q], phase }: Course & { controls: Cubic },
    start: (speed: P3) => P3,
    finish: Solid.IJet,
  ): Course {
    // The old tangent handle is D/3. The second quintic control uses 2D/5,
    // so 5/6 is the exact speed conversion that preserves that reach budget.
    const d0: P3 = Vec.scale(Vec.sub(b, p), 2.5);
    const d1: P3 = Vec.scale(Vec.sub(q, c), 2.5);
    return {
      phase,
      controls: [
        p,
        Vec.add(p, Vec.scale(d0, 1 / 5)),
        Vec.add(b, Vec.scale(start(d0), 1 / 20)),
        Vec.add(c, Vec.scale(normalSecond(finish, d1), 1 / 20)),
        Vec.sub(q, Vec.scale(d1, 1 / 5)),
        q,
      ],
    };
  }

  /** The normal acceleration of a selected world tangent in an original surface. */
  export function normalSecond(
    { u, v, uu, uv, vv }: Solid.IJet,
    speed: P3,
  ): P3 {
    const mix: number = Vec.dot(u, v);
    const [a, b] = Vec.solve2(Vec.dot(u, u), mix, mix, Vec.dot(v, v), [
      Vec.dot(u, speed),
      Vec.dot(v, speed),
    ])!;
    const n: P3 = Vec.unit(Vec.cross(u, v))!;
    const second: P3 = Vec.combine([
      [a * a, uu],
      [2 * a * b, uv],
      [b * b, vv],
    ]);
    return Vec.scale(n, Vec.dot(second, n));
  }

  /** Evaluate a course point in world millimetres at a normalized parameter. */
  export function value(controls: Controls, t: number): P3 {
    const e: number = 1 - t;
    if (controls.length === 6) {
      const [a, b, c, d, f, g] = controls;
      return Vec.combine([
        [e ** 5, a],
        [5 * e ** 4 * t, b],
        [10 * e ** 3 * t ** 2, c],
        [10 * e ** 2 * t ** 3, d],
        [5 * e * t ** 4, f],
        [t ** 5, g],
      ]);
    }
    const [a, b, c, d] = controls;
    return Vec.combine([
      [e ** 3, a],
      [3 * e * e * t, b],
      [3 * t * t * e, c],
      [t ** 3, d],
    ]);
  }

  /** Evaluate the world-space course derivative per normalized parameter. */
  export function first(controls: Controls, t: number): P3 {
    if (controls.length !== 4)
      return Bernstein.value(Bernstein.tangent(controls), t);
    const [a, b, c, d] = controls;
    const e: number = 1 - t;
    return Vec.combine([
      [3 * e * e, Vec.sub(b, a)],
      [6 * t * e, Vec.sub(c, b)],
      [3 * t * t, Vec.sub(d, c)],
    ]);
  }

  /** A native station derivative with the boundary's tangential speed removed. */
  export function unitCross(j: Solid.IJet): P3 {
    return Vec.unit(
      Vec.sub(j.u, Vec.scale(j.v, Vec.dot(j.u, j.v) / Vec.dot(j.v, j.v))),
    )!;
  }
}
