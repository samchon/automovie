import type {
  AutoMovieConicHermite,
  AutoMoviePolarSector,
  AutoMovieViewSection,
} from "@automovie/engine";

/**
 * Independent implicit conics and Taylor arithmetic for source-section tests.
 * Scalar expectations follow the implicit equation; rational cubic expectations
 * expand its mathematical Bernstein definition in power coefficients, rather
 * than copying the production quotient-derivative recurrence or its preparation.
 */
export namespace ConstructionConicOracle {
  /** Closed-form ellipse radius and two angular derivatives, in the half extents' units. */
  export function ellipse(
    a: number,
    b: number,
    phi: number,
  ): AutoMoviePolarSector.Jet {
    const c: number = Math.cos(phi);
    const s: number = Math.sin(phi);
    const f: number = (c / a) ** 2 + (s / b) ** 2;
    const first: number = 2 * s * c * (1 / (b * b) - 1 / (a * a));
    const second: number = 2 * (c * c - s * s) * (1 / (b * b) - 1 / (a * a));
    return [
      1 / Math.sqrt(f),
      -first / (2 * f ** 1.5),
      (3 * first * first) / (4 * f ** 2.5) - second / (2 * f ** 1.5),
    ];
  }

  /** Native rational Bernstein point; this expectation uses no production parameter inversion. */
  export function native(
    a: number,
    b: number,
    r: number,
    t: number,
  ): [number, number] {
    const left: number = (1 - t) ** 2;
    const middle: number = ((2 * r) / (1 - r)) * t * (1 - t);
    const right: number = t * t;
    const sum: number = left + middle + right;
    return [(a * (left + middle)) / sum, (b * (middle + right)) / sum];
  }

  /** Implicit-conic polar jet from its gradient/Hessian, independent of native quotient differentiation. */
  export function implicit(
    a: number,
    b: number,
    r: number,
    point: [number, number],
  ): AutoMoviePolarSector.Jet {
    const rho: number = Math.hypot(...point);
    const c: number = point[0] / rho;
    const s: number = point[1] / rho;
    const X: number = point[0] / a;
    const Y: number = point[1] / b;
    const w2: number = (r / (1 - r)) ** 2;
    const gx: number = 2 * (X + Y - 1) + 4 * w2 * (1 - Y);
    const gy: number = 2 * (X + Y - 1) + 4 * w2 * (1 - X);
    const radial: number = (gx * c) / a + (gy * s) / b;
    const angular: number = (-gx * s) / a + (gy * c) / b;
    const first: number = (-rho * angular) / radial;
    const dx: number = (first * c - rho * s) / a;
    const dy: number = (first * s + rho * c) / b;
    const hessian: number =
      2 * (dx * dx + dy * dy) + 2 * (2 - 4 * w2) * dx * dy;
    return [
      rho,
      first,
      (rho * radial - 2 * first * angular - hessian) / radial,
    ];
  }

  /** The specified rational endpoint curvature, independently written in the input shoulder. */
  export function endpoint(a: number, b: number, r: number): number {
    return (a * (1 - r) ** 2) / (2 * r * r * b * b);
  }

  /** Finite three-component comparison with a unit-consistent absolute/relative observation limit. */
  export function compare(
    failures: string[],
    label: string,
    actual: AutoMoviePolarSector.Jet,
    expected: AutoMoviePolarSector.Jet,
    scale: number,
    tolerance: number,
  ): void {
    if (
      actual.length !== 3 ||
      expected.length !== 3 ||
      ![...actual, ...expected].every(Number.isFinite)
    ) {
      failures.push(`${label}: nonfinite/count ${actual} versus ${expected}`);
      return;
    }
    for (let k: number = 0; k < 3; k++)
      if (
        Math.abs(actual[k]! - expected[k]!) >
        tolerance * Math.max(scale, Math.abs(expected[k]!))
      )
        failures.push(
          `${label}: jet ${k} ${actual[k]}, expected ${expected[k]}`,
        );
  }

  /** Generic asymmetric and unchanged consumer counterexamples, created by each test invocation. */
  export function cases(): {
    extents: number[];
    shoulders: [number, number, number, number];
  }[] {
    const E: number = Math.SQRT2 - 1;
    return [
      {
        extents: [20, 20, 20, 20],
        shoulders: [
          0.5199895822679248, 0.47998958226792476, 0.5099895822679248,
          0.4899895822679248,
        ],
      },
      {
        extents: [30, 20, 30, 20],
        shoulders: [
          0.4899804245626718, 0.5199804245626718, 0.4799804245626718,
          0.5099804245626718,
        ],
      },
      ...[
        [30, 12, 18, 25],
        [12, 40, 20, 8],
        [30, 20, 30, 20],
      ].map(
        (
          extents: number[],
        ): {
          extents: number[];
          shoulders: [number, number, number, number];
        } => ({ extents, shoulders: [0.25, 0.45, 0.6, 0.35] }),
      ),
      {
        extents: [
          2.893147277441873, 0.09726195800858761, 2.893147277441873,
          0.09726195800858761,
        ],
        shoulders: [
          0.4142059835008284, 0.4142059835008284, 0.4142059835008284,
          0.4142059835008284,
        ],
      },
      ...[
        [
          6.327956778537732, 6.638172274351374, 6.3279567785377315,
          6.638172274351374,
        ],
        [
          6.32795677853773, 6.638172274351374, 6.3279567785377315,
          6.638172274351374,
        ],
        [
          4.237989402139946, 4.445748403923397, 4.237989402139949,
          4.445748403923397,
        ],
        [
          6.327956513656927, 6.638172860984743, 6.327956513656925,
          6.638172860984743,
        ],
        [
          6.3279565136569245, 6.638172860984743, 6.327956513656925,
          6.638172860984743,
        ],
        [
          5.42810948648553, 5.694212500019024, 5.428109486485529,
          5.694212500019024,
        ],
        [
          4.237989224742716, 4.445748796806296, 4.237989224742712,
          4.445748796806296,
        ],
        [
          2.6902866344627423, 0.17770772092196505, 2.6902866344627423,
          1.3712700180437851,
        ],
        [
          5.328458913001896, 0.35298282964450106, 5.328458913001896,
          2.723768942984253,
        ],
        [
          7.862402479691163, 0.5233927139679991, 7.862402479691163,
          4.038725681716698,
        ],
        [
          10.240002978607231, 0.6865047616930491, 10.240002978607231,
          5.297369141137946,
        ],
        [
          12.409146053825465, 0.8398863606201536, 12.409146053825465,
          6.4809282281441565,
        ],
        [
          2.7906853389556385, 1.3714511221401706, 2.7906853389556385,
          0.17832135075579308,
        ],
        [
          5.526469297679587, 2.72414111660414, 5.526469297679587,
          0.35420330751867346,
        ],
        [
          8.15245049594183, 4.039308855716533, 8.15245049594183,
          0.525206476295836,
        ],
        [
          10.613727553510925, 5.298193211801276, 10.613727553510925,
          0.6888914630943842,
        ],
        [
          12.855399090155508, 6.482033057182321, 12.855399090155508,
          0.8428188739214255,
        ],
        [
          14.822563725644875, 7.572067264183962, 14.822563725644875,
          0.9845493147841121,
        ],
        [
          16.460320079747696, 8.54953470513017, 16.460320079747696,
          1.1116433916895532,
        ],
        [
          2.604276829172118, 0.17758723657057554, 2.604276829172118,
          1.3703403084180756,
        ],
        [
          2.6977723628364574, 1.370507417227271, 2.6977723628364574,
          0.17819864661266593,
        ],
        [
          5.344111600215742, 2.722291587232421, 5.344111600215742,
          0.35396282459478157,
        ],
        [
          7.887584586679069, 4.036629262792511, 7.887584586679069,
          0.5248580653156901,
        ],
        [
          10.276758196769096, 5.294797196685339, 10.276758196769096,
          0.6884499001448309,
        ],
        [
          12.460199305027325, 6.478072141688099, 12.460199305027325,
          0.8423038604515644,
        ],
      ].map(
        (
          extents: number[],
        ): {
          extents: number[];
          shoulders: [number, number, number, number];
        } => ({ extents, shoulders: [E, E, E, E] }),
      ),
    ];
  }

  /**
   * The rational cubic's defining polynomials as Taylor coefficients about t.
   * Endpoint-curvature tests independently verify preparation; this observer
   * verifies evaluation of the supplied controls through power-series division.
   */
  export function rational(
    patch: AutoMovieConicHermite.IPatch,
    t: number,
  ): [number, number, number, number, number, number] {
    const [x, y]: [number[], number[]] = coefficients(patch, t);
    return [x[0]!, y[0]!, x[1]!, y[1]!, 2 * x[2]!, 2 * y[2]!];
  }

  /** Cartesian Taylor coefficients through degree four, sharing one independent power-series division. */
  function coefficients(
    patch: AutoMovieConicHermite.IPatch,
    t: number,
  ): [number[], number[]] {
    const powers: readonly (readonly number[])[] = [
      [1, -3, 3, -1],
      [0, 3, -6, 3],
      [0, 0, 3, -3],
      [0, 0, 0, 1],
    ];
    const d: number[] = [0, 0, 0, 0];
    const n: number[][] = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    for (let i: number = 0; i < 4; i++)
      for (let k: number = 0; k < 4; k++) {
        const coefficient: number = patch.weights[i]! * powers[i]![k]!;
        d[k]! += coefficient;
        for (let coordinate: number = 0; coordinate < 2; coordinate++)
          n[coordinate]![k]! += coefficient * patch.points[i]![coordinate]!;
      }
    const shifted: (p: readonly number[]) => number[] = (
      p: readonly number[],
    ): number[] => [
      p[0]! + t * (p[1]! + t * (p[2]! + t * p[3]!)),
      p[1]! + t * (2 * p[2]! + 3 * t * p[3]!),
      p[2]! + 3 * t * p[3]!,
      p[3]!,
      0,
    ];
    const denominator: number[] = shifted(d);
    const result: number[][] = n.map((p: number[]): number[] => {
      const numerator: number[] = shifted(p);
      const q: number[] = [0, 0, 0, 0, 0];
      for (let k: number = 0; k < 5; k++) {
        let remainder: number = numerator[k]!;
        for (let j: number = 1; j <= k; j++)
          remainder -= denominator[j]! * q[k - j]!;
        q[k] = remainder / denominator[0]!;
      }
      return q;
    });
    return [
      result[0]!.map(
        (v: number, k: number): number =>
          (k === 0 ? patch.extent : 0) - patch.deficit * v,
      ),
      result[1]!.map((v: number): number => patch.height * v),
    ];
  }

  /**
   * Fourth polar derivative at a vertical-tangent start, by series reversion.
   * With x=a+x2*t^2+..., y=y1*t+..., expand sqrt(x^2+y^2) and atan(y/x).
   * Reverting phi=f1*t+f2*t^2+f3*t^3+... gives b1=1/f1,
   * b2=-f2/f1^3 and b3=2*f2^2/f1^5-f3/f1^4. This diagnostic exposes the
   * fixed-h observer's missing scale; an endpoint value is not a supremum
   * bound on a finite interval or a new tolerance for that observer.
   */
  export function fourth(patch: AutoMovieConicHermite.IPatch): number {
    const [x, y]: [number[], number[]] = coefficients(patch, 0);
    if (x[1] !== 0 || y[0] !== 0) return NaN;
    const a: number = x[0]!;
    const y1: number = y[1]!;
    const r2: number = x[2]! + y1 ** 2 / (2 * a);
    const r3: number = x[3]! + (y1 * y[2]!) / a;
    const r4: number =
      x[4]! +
      (2 * y1 * y[3]! + y[2]! ** 2) / (2 * a) -
      (x[2]! * y1 ** 2) / (2 * a ** 2) -
      y1 ** 4 / (8 * a ** 3);
    const f1: number = y1 / a;
    const f2: number = y[2]! / a;
    const f3: number =
      y[3]! / a - (y1 * x[2]!) / a ** 2 - y1 ** 3 / (3 * a ** 3);
    const b1: number = 1 / f1;
    const b2: number = -f2 / f1 ** 3;
    const b3: number = (2 * f2 ** 2) / f1 ** 5 - f3 / f1 ** 4;
    return (
      24 * (r2 * (2 * b1 * b3 + b2 ** 2) + 3 * r3 * b1 ** 2 * b2 + r4 * b1 ** 4)
    );
  }

  /** Independent closed-form ellipse checks of the fourth-derivative observer. */
  export function fourthChecks(): string[] {
    const failures: string[] = [];
    const w: number = Math.SQRT1_2;
    const u: number = (1 + 2 * w) / 3;
    const q: number = (2 * w) / (1 + 2 * w);
    for (const [a, b] of [
      [1, 1],
      [3, 2],
      [2, 3],
    ]) {
      const patch: AutoMovieConicHermite.IPatch = {
        extent: a!,
        deficit: a!,
        height: b!,
        native: 1,
        angle: Math.PI / 2,
        curvature: a! / b! ** 2,
        points: [
          [0, 0],
          [0, q],
          [1 - q, 1],
          [1, 1],
        ],
        weights: [1, u, u, 1],
      };
      const d: number = a! ** 2 / b! ** 2 - 1;
      const expected: number = a! * (4 * d + 9 * d * d);
      const actual: number = fourth(patch);
      if (
        !(
          Number.isFinite(actual) &&
          Math.abs(actual - expected) <= 2e-8 * Math.max(1, Math.abs(expected))
        )
      )
        failures.push(
          `fourth derivative oracle ${a}/${b}: ${actual} against ${expected}`,
        );
    }
    return failures;
  }

  /** Oriented geometric curvature from a Cartesian native jet, inverse length. */
  export function curvature(jet: readonly number[]): number {
    return (
      (jet[2]! * jet[5]! - jet[3]! * jet[4]!) /
      Math.hypot(jet[2]!, jet[3]!) ** 3
    );
  }

  /**
   * True one-sided polar limits from the defining controls, independently of
   * the production radial evaluator and its declared shared-curvature field.
   * Rational cubic endpoint curvature is 2*w0*w2/(3*w1^2) times the control
   * triangle cross product over the first edge length cubed. Raw quadratic
   * limits instead use the original input endpoint law above.
   */
  export function limits(
    section: AutoMovieViewSection.ISection,
  ): [AutoMoviePolarSector.Jet, AutoMoviePolarSector.Jet][] {
    return section.conics.quarters.map(
      (
        _: unknown,
        g: number,
      ): [AutoMoviePolarSector.Jet, AutoMoviePolarSector.Jet] => {
        const one: (q: number, reverse: boolean) => AutoMoviePolarSector.Jet = (
          q: number,
          reverse: boolean,
        ): AutoMoviePolarSector.Jet => {
          const arc: (typeof section.conics.quarters)[number] =
            section.conics.quarters[q]!;
          const patch: AutoMovieConicHermite.IPatch | null = reverse
            ? arc.end
            : arc.start;
          const e: number = section.box.extents[g]!;
          let slope: number = 0;
          let kappa: number = endpoint(
            e,
            arc.extents[reverse ? 0 : 1],
            arc.shoulder,
          );
          if (patch !== null) {
            const x1: number = -patch.deficit * patch.points[1]![0];
            const y1: number = patch.height * patch.points[1]![1];
            const x2: number = -patch.deficit * patch.points[2]![0];
            const y2: number = patch.height * patch.points[2]![1];
            kappa =
              (2 *
                patch.weights[0]! *
                patch.weights[2]! *
                (x1 * y2 - y1 * x2)) /
              (3 * patch.weights[1]! ** 2 * Math.hypot(x1, y1) ** 3);
            slope = ((reverse ? -1 : 1) * e * x1) / y1;
          }
          return [
            e,
            slope,
            (e * e + 2 * slope * slope - kappa * Math.hypot(e, slope) ** 3) / e,
          ];
        };
        return [one((g + 3) % 4, true), one(g, false)];
      },
    );
  }
}
