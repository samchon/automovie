import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmCurveSpec,
} from "@automovie/interface";

/**
 * Typed curve specification for the arm experiment: every original arm curve
 * names its own local frame, its datums with their sources, its constraints,
 * its representation and handle rule, and its consumers. Frames are rigid
 * transforms relative to their parent, so a world placement exists only by
 * composing parents. Units are the public input's calibration millimetres.
 */
export namespace AutoMovieHumanArmCurveSpec {
  /** Apply a transform to a child point. */
  export function apply(
    t: IAutoMovieHumanArmCurveSpec.ITransform,
    p: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [0, 1, 2].map(
      (c: number): number =>
        t.origin[c]! +
        t.axes[0][c]! * p[0] +
        t.axes[1][c]! * p[1] +
        t.axes[2][c]! * p[2],
    ) as AutoMovieVector3Tuple;
  }

  /** Apply only the rotation to a child direction. */
  export function rotate(
    t: IAutoMovieHumanArmCurveSpec.ITransform,
    d: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [0, 1, 2].map(
      (c: number): number =>
        t.axes[0][c]! * d[0] + t.axes[1][c]! * d[1] + t.axes[2][c]! * d[2],
    ) as AutoMovieVector3Tuple;
  }

  /** Compose `parent ∘ child`: the child frame in the parent's parent. */
  export function compose(
    parent: IAutoMovieHumanArmCurveSpec.ITransform,
    child: IAutoMovieHumanArmCurveSpec.ITransform,
  ): IAutoMovieHumanArmCurveSpec.ITransform {
    return {
      origin: apply(parent, child.origin),
      axes: [
        rotate(parent, child.axes[0]),
        rotate(parent, child.axes[1]),
        rotate(parent, child.axes[2]),
      ],
    };
  }

  /** Inverse rigid transform. */
  export function inverse(
    t: IAutoMovieHumanArmCurveSpec.ITransform,
  ): IAutoMovieHumanArmCurveSpec.ITransform {
    const axes: [
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
    ] = [
      [t.axes[0][0], t.axes[1][0], t.axes[2][0]],
      [t.axes[0][1], t.axes[1][1], t.axes[2][1]],
      [t.axes[0][2], t.axes[1][2], t.axes[2][2]],
    ];
    const o: AutoMovieVector3Tuple = [0, 1, 2].map(
      (c: number): number =>
        -(
          axes[0][c]! * t.origin[0] +
          axes[1][c]! * t.origin[1] +
          axes[2][c]! * t.origin[2]
        ),
    ) as AutoMovieVector3Tuple;
    return { origin: o, axes };
  }

  /** Identity transform. */
  export const IDENTITY: IAutoMovieHumanArmCurveSpec.ITransform = {
    origin: [0, 0, 0],
    axes: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  };

  /** Dot product. */
  export function dot(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product. */
  export function cross(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /**
   * Point of a cubic Bézier chain at chain parameter `u = i + t` by de
   * Casteljau's algorithm; `u` is clamped to the chain's span range.
   */
  export function bezierPoint(
    chain: IAutoMovieHumanArmCurveSpec.IBezierChain,
    u: number,
  ): AutoMovieVector3Tuple {
    const spans: number = bezierSpans(chain);
    const i: number = Math.min(spans - 1, Math.max(0, Math.floor(u)));
    const t: number = Math.min(1, Math.max(0, u - i));
    const p: AutoMovieVector3Tuple[] = [0, 1, 2, 3].map(
      (k: number): AutoMovieVector3Tuple =>
        chain.points[(3 * i + k) % chain.points.length]!,
    );
    function lerp(
      a: AutoMovieVector3Tuple,
      b: AutoMovieVector3Tuple,
    ): AutoMovieVector3Tuple {
      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
      ];
    }
    const a: AutoMovieVector3Tuple[] = [
      lerp(p[0]!, p[1]!),
      lerp(p[1]!, p[2]!),
      lerp(p[2]!, p[3]!),
    ];
    const b: AutoMovieVector3Tuple[] = [lerp(a[0]!, a[1]!), lerp(a[1]!, a[2]!)];
    return lerp(b[0]!, b[1]!);
  }

  /**
   * Number of cubic spans in a chain; throws on a layout that is not 3n + 1
   * (open) or 3n (closed).
   */
  export function bezierSpans(
    chain: IAutoMovieHumanArmCurveSpec.IBezierChain,
  ): number {
    const n: number = chain.closed
      ? chain.points.length / 3
      : (chain.points.length - 1) / 3;
    if (!(Number.isInteger(n) && n >= 1))
      throw new Error(
        "A Bézier chain needs 3n + 1 points (open) or 3n (closed)",
      );
    return n;
  }

  /**
   * The six Bézier control points of the quintic Hermite span `a`..`b` in the
   * same parameter, exactly (human/curves.md "Preserve The Actual Parameter"):
   * with `h = b.q - a.q`, P1 = A + h A1 / 5, P2 = A + 2 h A1 / 5
   *
   * - H^2 A2 / 20, P3 = B - 2 h B1 / 5 + h^2 B2 / 20, P4 = B - h B1 / 5.
   */
  export function quinticControls(
    a: IAutoMovieHumanArmCurveSpec.IHermiteKnot,
    b: IAutoMovieHumanArmCurveSpec.IHermiteKnot,
  ): AutoMovieVector3Tuple[] {
    const h: number = b.q - a.q;
    if (!(h > 0)) throw new Error("A quintic Hermite span needs increasing q");
    function c(f: (k: number) => number): AutoMovieVector3Tuple {
      return [f(0), f(1), f(2)];
    }
    return [
      a.position,
      c((k: number): number => a.position[k]! + (h * a.first[k]!) / 5),
      c(
        (k: number): number =>
          a.position[k]! +
          (2 * h * a.first[k]!) / 5 +
          (h * h * a.second[k]!) / 20,
      ),
      c(
        (k: number): number =>
          b.position[k]! -
          (2 * h * b.first[k]!) / 5 +
          (h * h * b.second[k]!) / 20,
      ),
      c((k: number): number => b.position[k]! - (h * b.first[k]!) / 5),
      b.position,
    ];
  }

  /**
   * Point of a quintic Hermite chain at parameter `q` (clamped to the knot
   * range), from its Bézier form.
   */
  export function quinticPoint(
    curve: IAutoMovieHumanArmCurveSpec.IQuinticHermite,
    q: number,
  ): AutoMovieVector3Tuple {
    const k: IAutoMovieHumanArmCurveSpec.IHermiteKnot[] = curve.knots;
    if (k.length < 2)
      throw new Error("A quintic Hermite chain needs two knots");
    let i: number = 0;
    while (i < k.length - 2 && q > k[i + 1]!.q) ++i;
    const p: AutoMovieVector3Tuple[] = quinticControls(k[i]!, k[i + 1]!);
    const t: number = Math.min(
      1,
      Math.max(0, (q - k[i]!.q) / (k[i + 1]!.q - k[i]!.q)),
    );
    const w: number[] = [0, 1, 2, 3, 4, 5].map(
      (j: number): number =>
        BINOMIAL5[j]! * Math.pow(1 - t, 5 - j) * Math.pow(t, j),
    );
    return [0, 1, 2].map((c: number): number =>
      p.reduce(
        (s: number, x: AutoMovieVector3Tuple, j: number): number =>
          s + w[j]! * x[c]!,
        0,
      ),
    ) as AutoMovieVector3Tuple;
  }

  /** Binomial coefficients C(5, j). */
  const BINOMIAL5: number[] = [1, 5, 10, 10, 5, 1];

  /** Unit vector; throws on a zero vector instead of substituting one. */
  export function unit(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
    const n: number = Math.hypot(a[0], a[1], a[2]);
    if (!(n > 0)) throw new Error("Zero direction in an arm frame");
    return [a[0] / n, a[1] / n, a[2] / n];
  }
}
