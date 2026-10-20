import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";

/** Continue an implicit level along one declared constant physical direction.
 * Seed and target first derivatives use the caller's same parameter domain.
 * Optional second derivatives are propagated analytically for curve consumers.
 * Four level homotopy steps start at the seed's own level. Newton backtracking
 * accepts only decreasing level residuals inside the caller's physical search
 * distance. A singular direction, unsupported query or failed solve throws;
 * the seed is never returned as replacement geometry after a failed solve.
 * This local continuation does not certify a unique root or an embedded chart.
 * Failed solves retain their physical query and bounded ray samples in the
 * error message. Those samples diagnose the selected ray; they do not prove
 * existence or absence of roots between samples or on another ray.
 *
 * @evidence contracts/common.md#principled-implementation Applies bounded Newton continuation to F(P+a*d)=R and differentiates that same implicit equation through its analytic gradient and Hessian.
 * @evidence contracts/common.md#clear-and-simple-design Owns only a constant-direction implicit solve and jet chain rule; field coefficients, domains, topology and canonical boundaries belong to callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest source point, mesh fallback, geometric clipping or finite-difference derivative replaces an unsupported or singular solve.
 * @evidence contracts/common.md#meaningful-documentation States physical units, constant direction, parameter units, second-derivative layout, failure effects and lack of global root qualification.
 * @evidence contracts/performance.md#efficient-algorithms At most four times twelve Newton steps with eight backtracking candidates bound field queries; derivative propagation is quadratic in the caller's at most two parameters.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses each accepted field jet for the next residual and the final gradient and Hessian for every parameter derivative.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Query-local vectors and arrays are bounded by two parameters; no cache, process or external resource survives the call.
 */
export function evaluateAutoMovieImplicitProjection64(props: {
  point: M.V;
  partials: readonly M.V[];
  seconds?: readonly (readonly M.V[])[];
  direction: M.V;
  target: {
    value: number;
    partials: readonly number[];
    seconds?: readonly (readonly number[])[];
  };
  field: (point: M.V) => {
    value: number;
    gradient: M.V;
    hessian: readonly M.V[];
  };
  maxDistanceMm: number;
}): {
  point: M.V;
  partials: M.V[];
  seconds: M.V[][];
  offsetMm: number;
  residual: number;
  directionalDerivative: number;
} {
  const count: number = props.partials.length;
  if (
    count < 1 ||
    count > 2 ||
    props.target.partials.length !== count ||
    !(props.maxDistanceMm > 0) ||
    !Number.isFinite(props.maxDistanceMm) ||
    !Number.isFinite(props.target.value) ||
    !props.point.every(Number.isFinite) ||
    !props.partials.every((p: M.V): boolean => p.every(Number.isFinite)) ||
    !props.target.partials.every(Number.isFinite) ||
    (props.seconds !== undefined &&
      (props.seconds.length !== count ||
        props.seconds.some(
          (row: readonly M.V[]): boolean =>
            row.length !== count ||
            row.some((p: M.V): boolean => !p.every(Number.isFinite)),
        ) ||
        props.target.seconds?.length !== count ||
        props.target.seconds.some(
          (row: readonly number[]): boolean =>
            row.length !== count || !row.every(Number.isFinite),
        )))
  )
    throw new Error(
      "One or two finite implicit parameter jets and a positive physical search distance required",
    );
  const length: number = Math.hypot(...props.direction);
  if (!(length > 0) || !Number.isFinite(length))
    throw new Error("A finite implicit projection direction is required");
  const direction: M.V = M.scale(props.direction, 1 / length);
  type Field = ReturnType<typeof props.field>;
  let offset: number = 0;
  let point: M.V = M.clone(props.point);
  let jet: Field = props.field(point);
  const initial: number = jet.value;
  const tolerance: number = 1e-10;
  let currentStage: number = 0,
    currentIteration: number = 0,
    currentTarget: number = initial;
  let trials: {
    offsetMm: number;
    insideDomain: boolean;
    level: number | null;
    directionalDerivative: number | null;
  }[] = [];
  for (let stage: number = 1; stage <= 4; ++stage) {
    const target: number =
      initial + ((props.target.value - initial) * stage) / 4;
    currentStage = stage;
    currentTarget = target;
    let converged: boolean = false;
    for (let iteration: number = 0; iteration < 12; ++iteration) {
      currentIteration = iteration;
      trials = [];
      const residual: number = jet.value - target;
      if (Math.abs(residual) <= tolerance) {
        converged = true;
        break;
      }
      const denominator: number = dot(jet.gradient, direction);
      if (!Number.isFinite(denominator) || Math.abs(denominator) <= 1e-12)
        fail("singular-continuation-direction");
      const step: number = residual / denominator;
      let accepted: boolean = false;
      for (let trial: number = 0; trial < 8; ++trial) {
        const candidate: number = offset - step / 2 ** trial;
        if (Math.abs(candidate) > props.maxDistanceMm) {
          trials.push({
            offsetMm: candidate,
            insideDomain: false,
            level: null,
            directionalDerivative: null,
          });
          continue;
        }
        const position: M.V = M.add(props.point, M.scale(direction, candidate));
        const value: Field = props.field(position);
        trials.push({
          offsetMm: candidate,
          insideDomain: true,
          level: value.value,
          directionalDerivative: dot(value.gradient, direction),
        });
        if (
          Number.isFinite(value.value) &&
          Math.abs(value.value - target) < Math.abs(residual)
        ) {
          offset = candidate;
          point = position;
          jet = value;
          accepted = true;
          break;
        }
      }
      if (!accepted) fail("no-decreasing-step-in-domain");
    }
    if (!converged && Math.abs(jet.value - target) > tolerance)
      fail("bounded-iterations-exhausted");
  }
  const denominator: number = dot(jet.gradient, direction);
  if (Math.abs(denominator) <= 1e-12 || !Number.isFinite(denominator))
    fail("singular-final-jet-direction");
  const partials: M.V[] = props.partials.map(
    (p: M.V, axis: number): M.V =>
      M.add(
        p,
        M.scale(
          direction,
          (props.target.partials[axis]! - dot(jet.gradient, p)) / denominator,
        ),
      ),
  );
  const seconds: M.V[][] =
    props.seconds === undefined
      ? []
      : props.seconds.map((row: readonly M.V[], i: number): M.V[] =>
          row.map((p: M.V, j: number): M.V => {
            const h: M.V = [
              dot(jet.hessian[0]!, partials[j]!),
              dot(jet.hessian[1]!, partials[j]!),
              dot(jet.hessian[2]!, partials[j]!),
            ];
            const value: number =
              (props.target.seconds![i]![j]! -
                dot(jet.gradient, p) -
                dot(partials[i]!, h)) /
              denominator;
            return M.add(p, M.scale(direction, value));
          }),
        );
  return {
    point,
    partials,
    seconds,
    offsetMm: offset,
    residual: jet.value - props.target.value,
    directionalDerivative: denominator,
  };

  /** Preserve the actual failed continuation before the caller rejects geometry.
   * Ray samples use the unchanged declared domain and never select replacement
   * roots. Sampling cannot certify a continuous polynomial's attainable range.
   */
  function fail(reason: string): never {
    const raySamples: {
      offsetMm: number;
      level: number;
      directionalDerivative: number;
    }[] = [];
    for (let i: number = 0; i <= 16; ++i) {
      const distance: number = props.maxDistanceMm * (i / 8 - 1);
      const value: Field = props.field(
        M.add(props.point, M.scale(direction, distance)),
      );
      raySamples.push({
        offsetMm: distance,
        level: value.value,
        directionalDerivative: dot(value.gradient, direction),
      });
    }
    throw new Error(
      `Implicit continuation failure ${JSON.stringify({
        schema: "implicit-continuation-failure-v1",
        reason,
        seedPointMm: props.point,
        seedPartialsMm: props.partials,
        direction,
        maxDistanceMm: props.maxDistanceMm,
        initialLevel: initial,
        targetLevel: props.target.value,
        targetPartials: props.target.partials,
        stage: currentStage,
        iteration: currentIteration,
        stageTargetLevel: currentTarget,
        pointMm: point,
        offsetMm: offset,
        level: jet.value,
        gradientPerMm: jet.gradient,
        directionalDerivative: dot(jet.gradient, direction),
        stageResidual: jet.value - currentTarget,
        finalResidual: jet.value - props.target.value,
        trials,
        raySamples,
        qualification:
          "Bounded samples and one failed local continuation; no global root existence or absence certificate",
      })}`,
    );
  }

  /** Physical dot products keep field and parameter dimensions explicit. */
  function dot(a: M.V, b: M.V): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}
