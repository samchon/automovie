import {
  AutoMovieConicArc,
  AutoMovieConicArcField,
  AutoMovieConicFieldJet,
  AutoMovieConicHermite,
  AutoMovieConicHermiteField,
  type AutoMoviePolarSector,
} from "@automovie/engine";

import { ConstructionConicOracle } from "../../internal/construction/ConstructionConicOracle";

/**
 * A positive rational clock cannot change the geometric curve or its polar jet.
 *
 * Scenarios:
 * 1. Degree-elevated exact ellipse quarters cover seven aspects, reciprocal
 *    orientations and three scales. Multiplying weight i by k^i is precisely
 *    t=k*v/(1-v+k*v), so k from1e-100 to1e100 preserves every ellipse point.
 *    Radius and two angular derivatives have independent implicit expectations.
 * 2. Endpoints, near-end rays and interior rays retain the same expectations;
 *    the native clock can be closer to one than binary64 can represent.
 * 3. Actual G2 preparations with curvature ratios down to1e-240 retain their
 *    original conic point-error envelope and finite convex polar jets. This is
 *    an arithmetic observation, not an interval certificate for every input.
 * 4. Outside/nonfinite angles remain nonfinite. The independent reader rejects
 *    a made0.01-scale slope error with its unchanged2e-9 comparison limit.
 * 5. A query-local operation table bounds primal reads by four projective
 *    terms in NUMBER and AD. Ordered public log-sum readings retain all log
 *    components exactly; raw rays retain physical evaluation, tangent, radial
 *    guide and fresh-array results across reciprocal/scaled extreme shoulders.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production Hermite.radius on exact conics with projectively changed clocks and on actual admitted G2 ends; reads all three polar components, support endpoints, finite/count failures and convexity. Query-owned algebra counts observe projective primal work without replacing globals; raw rays are checked against physical kernel and public guide readings.
 * @evidence contracts/development/testing.md#independent-expectations The fixed ellipse controls are homogeneous degree elevation of [(a,0),(a,b),(0,b)] with weight1/sqrt(2). The identity weight_i*k^i follows by direct substitution of t=k*v/(1-v+k*v). Closed-form ellipse jets come from the implicit ellipse oracle; no production inverse, tangent or homogeneous determinant supplies those answers. Exact public-log and physical-kernel comparisons separately pin arithmetic compatibility; they are not independent geometry oracles.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes42 ellipse boxes, reciprocal/scaled shapes, seven clocks including both extreme directions, exact and near endpoints, actual tiny-curvature-ratio ends, invalid queries and a made slope error. Native t bisection loses these projective cases despite unchanged geometry. A repeated max/pivot traversal exceeds the four-read work budget; fewer reads remain allowed. Exact log and physical-point comparisons distinguish reordered normalization or restoration.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU question through --include construction_conic_projective; creates no person, browser, host, fixture or GPU work and joins the shared construction round.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Degree-elevated exact ellipse quarters cover seven aspects, reciprocal).
 */
export function test_construction_conic_projective(): void {
  const failures: string[] = [];
  const work: { projective: number; primalReads: number; raw: number } = {
    projective: 0,
    primalReads: 0,
    raw: 0,
  };
  const w: number = Math.SQRT1_2;
  const u: number = (1 + 2 * w) / 3;
  const q: number = (2 * w) / (1 + 2 * w);
  const angles: number[] = [
    0,
    1e-12,
    1 - 1e-12,
    1,
    ...Array.from(
      { length: 33 },
      (_: unknown, i: number): number => (i + 0.3) / 34,
    ),
  ];
  for (const aspect of [1, 2, 4, 8, 16, 32, 64])
    for (const reverse of [false, true])
      for (const scale of [0.001, 1, 1000]) {
        const a: number = scale * (reverse ? aspect : 1);
        const b: number = scale * (reverse ? 1 : aspect);
        for (const k of [1e-100, 1e-30, 1e-10, 1, 1e10, 1e30, 1e100]) {
          const patch: AutoMovieConicHermite.IPatch = {
            extent: a,
            deficit: a,
            height: b,
            native: 1,
            angle: Math.PI / 2,
            curvature: a / (b * b),
            points: [
              [0, 0],
              [0, q],
              [1 - q, 1],
              [1, 1],
            ],
            weights: [1, u * k, u * k * k, k ** 3],
          };
          projectiveReuse(patch, failures, work);
          for (const share of angles) {
            const angle: number = share * patch.angle;
            ConstructionConicOracle.compare(
              failures,
              `projective ellipse ${aspect}/${reverse}/${scale}/${k}/${share}`,
              AutoMovieConicHermite.radius(patch, angle),
              ConstructionConicOracle.ellipse(a, b, angle),
              scale,
              2e-9,
            );
          }
        }
      }

  const E: number = Math.SQRT2 - 1;
  for (const tau of [1e-12, 1e-30, 1e-60, 1e-120, 1e-240]) {
    const prepared: AutoMovieConicHermite.IPatch | string | null =
      AutoMovieConicHermite.create(1, 1, E, tau);
    if (prepared === null || typeof prepared === "string") {
      failures.push(`positive-weight G2 fixture ${tau}: ${prepared}`);
      continue;
    }
    for (const share of [0, 0.01, 0.1, 0.5, 0.9, 0.99, 1]) {
      const jet: AutoMoviePolarSector.Jet = AutoMovieConicHermite.radius(
        prepared,
        share * prepared.angle,
      );
      const turn: number = jet[0] ** 2 + 2 * jet[1] ** 2 - jet[0] * jet[2];
      const floor: number =
        256 *
        Number.EPSILON *
        (jet[0] ** 2 + 2 * jet[1] ** 2 + Math.abs(jet[0] * jet[2]));
      if (
        !(
          jet.every(Number.isFinite) &&
          Math.abs(jet[0] - 1) <= 1e-7 &&
          turn >= -floor
        )
      )
        failures.push(
          `positive-weight G2 ${tau}/${share}: ${jet}, numerator ${turn}`,
        );
    }
    for (const angle of [-prepared.angle, 2 * prepared.angle, NaN])
      if (AutoMovieConicHermite.radius(prepared, angle).some(Number.isFinite))
        failures.push(`outside projective query ${angle} became finite`);
  }

  const red: string[] = [];
  const expected: AutoMoviePolarSector.Jet = ConstructionConicOracle.ellipse(
    3,
    2,
    0.3,
  );
  ConstructionConicOracle.compare(
    red,
    "made slope",
    [expected[0], expected[1] + 0.01, expected[2]],
    expected,
    1,
    2e-9,
  );
  if (red.length === 0)
    failures.push("a made0.01 slope error passed the projective reader");
  rawReuse(failures, work);
  console.log({ conicReuseWork: work });
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} conic projective findings:\n${failures.join("\n")}`,
    );
}

/** Count actual primal reads while retaining the original public ordered log-sum as an arithmetic regression seam. */
function projectiveCheck<T>(
  ops: AutoMovieConicFieldJet.IAlgebra<T>,
  patch: AutoMovieConicHermite.IPatch<T>,
  clock: number,
  components: (value: T) => readonly number[],
  failures: string[],
  work: { projective: number; primalReads: number },
): void {
  let reads: number = 0;
  const counted: AutoMovieConicFieldJet.IAlgebra<T> = {
    ...ops,
    value: (value: T): number => {
      reads++;
      return ops.value(value);
    },
  };
  const weights: T[] = patch.weights.map((value: T): T => ops.log(value));
  const actual: AutoMovieConicHermiteField.IProjective<T> =
    AutoMovieConicHermiteField.projective(counted, patch, weights, clock);
  const raw: T[] = weights.map(
    (value: T, i: number): T =>
      ops.add(
        value,
        ops.constant((i === 1 || i === 2 ? Math.log(3) : 0) + i * clock),
      ),
  );
  const normalizer: T = AutoMovieConicHermiteField.logSum(ops, raw);
  work.projective++;
  work.primalReads += reads;
  if (reads > 4) failures.push(`projective primal reads ${reads}, budget4`);
  for (let i: number = 0; i < 4; i++) {
    const expected: readonly number[] = components(
      ops.subtract(raw[i]!, normalizer),
    );
    const value: readonly number[] = components(actual.logs[i]!);
    if (
      value.some((v: number, j: number): boolean => !Object.is(v, expected[j]))
    )
      failures.push(`ordered projective logs changed at ${clock}/${i}`);
  }
  const next: AutoMovieConicHermiteField.IProjective<T> =
    AutoMovieConicHermiteField.projective(ops, patch, weights, clock);
  if (actual.point === next.point || actual.logs === next.logs)
    failures.push("projective queries shared mutable result arrays");
}

/** Extreme projective weights exercise the same normalization in scalar and source-Hessian algebras. */
function projectiveReuse(
  patch: AutoMovieConicHermite.IPatch,
  failures: string[],
  work: { projective: number; primalReads: number },
): void {
  const ops: AutoMovieConicFieldJet.IAlgebra<AutoMovieConicFieldJet.IJet> =
    AutoMovieConicFieldJet.AD;
  const source: AutoMovieConicHermite.IPatch<AutoMovieConicFieldJet.IJet> = {
    ...patch,
    extent: ops.constant(patch.extent),
    deficit: ops.constant(patch.deficit),
    height: ops.constant(patch.height),
    native: ops.constant(patch.native),
    curvature: ops.constant(patch.curvature),
    points: patch.points.map(
      (
        p: readonly [number, number],
      ): readonly [
        AutoMovieConicFieldJet.IJet,
        AutoMovieConicFieldJet.IJet,
      ] => [ops.constant(p[0]), ops.constant(p[1])],
    ),
    weights: patch.weights.map(
      (v: number, i: number): AutoMovieConicFieldJet.IJet => [
        v,
        v * ((i + 1) / 8),
        v * ((i - 1) / 16),
        v / 32,
        v / 64,
        -v / 128,
      ],
    ),
  };
  for (const clock of [-700, 0, 700]) {
    projectiveCheck(
      AutoMovieConicFieldJet.NUMBER,
      patch,
      clock,
      (value: number): readonly number[] => [value],
      failures,
      work,
    );
    projectiveCheck(
      ops,
      source,
      clock,
      (value: AutoMovieConicFieldJet.IJet): readonly number[] => value,
      failures,
      work,
    );
  }
}

/** Reuse must preserve the old physical evaluation's binary64 point/T and the guide's radial arithmetic. */
function rawReuse(failures: string[], work: { raw: number }): void {
  for (const aspect of [0.001, 1, 1000])
    for (const scale of [0.001, 1, 1000])
      for (const r of [1e-12, 0.05, Math.SQRT2 - 1, 0.9, 1 - Number.EPSILON])
        for (const phi of [
          0,
          1e-12,
          0.3,
          Math.PI / 4,
          Math.PI / 2 - 1e-12,
          Math.PI / 2,
        ]) {
          const a: number = aspect * scale;
          const b: number = scale;
          const ray: AutoMovieConicArc.IRay | null = AutoMovieConicArc.locate(
            a,
            b,
            r,
            phi,
          );
          if (ray === null || ray.native === null) {
            failures.push(`raw reuse lost finite ray ${a}/${b}/${r}/${phi}`);
            continue;
          }
          const first: number = ray.reverse ? b : a;
          const second: number = ray.reverse ? a : b;
          const geometry: AutoMovieConicArcField.IGeometry<number> =
            AutoMovieConicArcField.orient(
              AutoMovieConicFieldJet.NUMBER,
              AutoMovieConicArcField.evaluate(
                AutoMovieConicFieldJet.NUMBER,
                first,
                second,
                AutoMovieConicArcField.weight(AutoMovieConicFieldJet.NUMBER, r),
                ray.native,
              ),
              ray.reverse,
            );
          const guide: AutoMoviePolarSector.IGuide = AutoMovieConicArc.guide(
            first,
            second,
            r,
            ray.native,
          );
          const expected: number[] = [
            ...geometry.point,
            ...geometry.tangent,
            guide.value,
            ray.reverse ? -guide.slope : guide.slope,
            guide.curvature,
          ];
          const actual: number[] = [
            ...ray.point,
            ...ray.tangent,
            ...ray.radial,
          ];
          if (
            actual.some(
              (v: number, i: number): boolean => !Object.is(v, expected[i]),
            )
          )
            failures.push(
              `raw normalized/physical arithmetic changed ${a}/${b}/${r}/${phi}`,
            );
          const next: AutoMovieConicArc.IRay | null = AutoMovieConicArc.locate(
            a,
            b,
            r,
            phi,
          );
          if (
            next === null ||
            ray.point === next.point ||
            ray.tangent === next.tangent ||
            ray.radial === next.radial
          )
            failures.push("raw ray queries shared mutable result arrays");
          work.raw++;
        }
}
