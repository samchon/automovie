import { GhoshConicApproximationBalance as balance } from "../internal/GhoshConicApproximationBalance";
import { GhoshConicApproximationDisplacement as displacement } from "../internal/GhoshConicApproximationDisplacement";
import { AutoMovieRecoveryConicApproximation as C } from "./AutoMovieRecoveryConicApproximation";

/**
 * Numerically reproduce the endpoint-bitangent equioscillation construction of
 * Ghosh, Petitjean and Vegter, Approximation by Conic Splines (2007), sections
 * 3.2–3.4 and 6, DOI 10.1007/s11786-007-0004-8.
 *
 * Source breaks are hard boundaries: piecewise Hermite input does not acquire
 * the paper's smoothness merely by supplying derivatives. On each smooth chart
 * we sample nonzero curvature and monotone affine curvature, construct the
 * endpoint triple-contact limits of the positive-weight bitangent family, and
 * bisect its weight until refined positive and negative normal extrema balance.
 * Located extrema are exchanged into the fitting nodes; independent held-out
 * nodes then validate the selected coefficient rather than driving its fit.
 * Endpoint bisection then selects an interval meeting the requested tolerance.
 * Unlike the paper's symbolic implementation, this experiment uses finite
 * admission/extremum samples, so neither Hausdorff certification nor global
 * minimum arc count is claimed. Collinear charts are an explicit line extension.
 * A zero-curvature chart endpoint uses the compactified infinite-weight limit
 * only to bracket finite positive weights. This is an explicit numerical
 * boundary extension, not a proof that the paper's theorem admits that endpoint.
 * Source callback failures refuse the whole call and discard all coefficients;
 * sampled mathematical admission failures may leave explicitly partial coverage.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States provenance, source-parameter units, preserved breaks, numerical admission, sampled errors, line extension and explicit refusal/partial coverage.
 * @evidence contracts/development/implementation.md#principled-implementation Sections 3.2–3.4 and 6 supply bitangent normal-displacement equioscillation and endpoint bisection; proposition 2.3 supplies affine curvature. Finite samples replace symbolic extrema and cannot certify the continuous premises.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Local helpers own source queries, differential admission, tangent-triangle algebra, displacement and the two nested bisections; no Human-specific data enters recovery.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source samples become output coefficients, no input smoothing or fixture branch is used, and unsupported intervals remain omitted with diagnostics.
 * @evidence contracts/development/implementation.md#efficient-algorithms Chart count, accepted arcs and caller depth bound interval visits. Each candidate alternates 32-step weight bisection with at most depth extremum exchanges; the balance helper bounds its witness/golden-search cost, and 64 independent nodes validate the result. A separate visit budget bounds unsuccessful subdivision.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each candidate caches its source points, normals and barycentric coordinates across coefficient bisection; accepted coefficients and measured error are reused when the endpoint search advances.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous pure call retains only its bounded interval stack, result arcs and one candidate's samples; no callback, handle or source array survives return.
 */
export function approximateAutoMovieRecoveryConicsGhosh(
  curve: C.ICurve,
  options: C.IOptions,
): C.IResult {
  /** A source point and its Euclidean unit normal, in the caller's frame. */
  interface Sample {
    point: C.Point;
    normal: C.Point;
  }
  /** Source and normal expressed in the endpoint tangent triangle. */
  interface Coordinate {
    value: readonly number[];
    normal: readonly number[];
  }
  /** A pending chart never crosses a caller-supplied source break. */
  interface Interval {
    a: number;
    b: number;
    depth: number;
  }
  const errors: string[] = C.validate(curve, options);
  const diagnostics: Set<string> = new Set(errors);
  const arcs: C.IArc[] = [];
  let queries: number = 0;
  let omitted: number = 0;
  let visits: number = 0;
  let sourceFailure: string | undefined;
  const roundoff: number = 128 * Number.EPSILON;

  /** Root-rounding residual admission changes the decision, never the source jet. */
  function zeroCurvature(
    t: number,
    v: C.Point,
    a: C.Point,
    j: C.Point,
  ): boolean {
    const width: number = curve.domain[1] - curve.domain[0];
    const parameterScale: number = Math.max(width, Math.abs(t));
    const scale: number =
      Math.hypot(...v) * (Math.hypot(...a) + parameterScale * Math.hypot(...j));
    return Math.abs(C.cross(v, a)) <= roundoff * scale;
  }

  /** Count every source callback and reject nonfinite data at its first use. */
  function point(
    t: number,
    order: 0 | 1 | 2 | 3 | 4 = 0,
    side?: "left" | "right",
  ): C.Point {
    ++queries;
    try {
      const p: C.Point =
        order === 0 ? curve.evaluate(t) : curve.derivative(t, order, side);
      if (p.length !== 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1]))
        throw new Error(
          `Nonfinite source ${order === 0 ? "point" : "derivative"} at parameter ${t}.`,
        );

      // Callbacks may reuse one mutable scratch tuple between successive queries.
      return [p[0], p[1]];
    } catch (error) {
      sourceFailure = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }
  /** Form a local vector without retaining or modifying the source tuple. */
  function subtract(a: C.Point, b: C.Point): C.Point {
    return [a[0] - b[0], a[1] - b[1]];
  }
  /** Keep admission separate from coefficient approximation and tolerance. */
  function finite(p: C.Point): boolean {
    return Number.isFinite(p[0]) && Number.isFinite(p[1]);
  }
  /** Sample proposition 2.3; this is evidence of admission, not a proof of it. */
  function admit(a: number, b: number): "regular" | "line" | string {
    let sign: number = 0;
    let trend: number = 0;
    let previous: number | undefined;
    let previousUncertainty: number = 0;
    let zero: number = 0;
    let boundary: number = 0;
    for (let i: number = 0; i <= 8; ++i) {
      const t: number = a + ((b - a) * i) / 8;
      const side: "left" | "right" | undefined =
        i === 0 ? "right" : i === 8 ? "left" : undefined;
      const v: C.Point = point(t, 1, side);
      const acceleration: C.Point = point(t, 2, side);
      const jerk: C.Point = point(t, 3, side);
      const fourth: C.Point = point(t, 4, side);
      if (
        ![v, acceleration, jerk, fourth].every(finite) ||
        Math.hypot(...v) === 0
      )
        return "Nonfinite or nonregular source jet.";
      const determinant: number = C.cross(v, acceleration);
      const determinantScale: number =
        Math.hypot(...v) * Math.hypot(...acceleration);
      if ((i === 0 || i === 8) && zeroCurvature(t, v, acceleration, jerk)) {
        ++boundary;
        ++zero;
        continue;
      }
      if (Math.abs(determinant) <= roundoff * determinantScale) {
        ++zero;
        continue;
      }
      if (sign !== 0 && Math.sign(determinant) !== sign)
        return "Inflection prevents a nonvanishing-curvature chart.";
      sign = Math.sign(determinant);

      // phi=det(alpha',alpha'')^(1/3); differentiate phi analytically.
      // Combining proposition 2.3 avoids subtraction of two phi derivatives.
      const first: number = C.cross(v, jerk);
      const second: number = C.cross(acceleration, jerk) + C.cross(v, fourth);
      const phi: number = Math.cbrt(determinant);
      const positiveTerm: number =
        (C.cross(acceleration, jerk) + second / 3) / phi ** 5;
      const negativeTerm: number = (5 * first * first) / (9 * phi ** 8);
      const curvature: number = positiveTerm - negativeTerm;
      const uncertainty: number =
        roundoff * (Math.abs(positiveTerm) + Math.abs(negativeTerm));
      if (!Number.isFinite(curvature)) return "Affine curvature overflow.";
      if (previous !== undefined) {
        const difference: number = curvature - previous;
        const threshold: number =
          128 *
            Math.sqrt(Number.EPSILON) *
            Math.max(
              Number.MIN_VALUE,
              Math.abs(curvature),
              Math.abs(previous),
            ) +
          uncertainty +
          previousUncertainty;
        if (Math.abs(difference) > threshold) {
          if (trend !== 0 && Math.sign(difference) !== trend)
            return "Affine curvature is not sample-monotone.";
          trend = Math.sign(difference);
        }
      }
      previous = curvature;
      previousUncertainty = uncertainty;
    }
    if (zero === 9) return "line";
    if (zero !== boundary)
      return "Interior zero curvature prevents a regular chart.";
    if (boundary !== 0)
      diagnostics.add(
        "Numerical boundary extension: a zero-curvature chart endpoint uses the infinite-weight family limit for bracketing only; the paper's nonzero-curvature theorem is not asserted there.",
      );
    return "regular";
  }
  /** Exact straight input is a declared extension beyond the paper's premise. */
  function line(a: number, b: number): C.IArc | undefined {
    const p: C.Point = point(a);
    const q: C.Point = point(b);
    const chord: C.Point = subtract(q, p);
    const length: number = Math.hypot(...chord);
    if (!finite(p) || !finite(q) || length === 0) return undefined;
    for (let i: number = 1; i < 16; ++i) {
      const v: C.Point = subtract(point(a + ((b - a) * i) / 16), p);
      const projection: number =
        (v[0] * chord[0] + v[1] * chord[1]) / length ** 2;
      if (
        !finite(v) ||
        Math.abs(C.cross(chord, v)) / length > roundoff * length ||
        projection < 0 ||
        projection > 1
      )
        return undefined;
    }
    diagnostics.add(
      "Exactly collinear sampled charts use a line extension, outside the paper's nonzero-curvature theorem.",
    );
    return {
      domain: [a, b],
      controls: [p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], q],
      weight: 1,
      maximumSampleErrorMm: 0,
    };
  }
  /** Fit the one-parameter bitangent family, never free least-squares controls. */
  function fit(a: number, b: number): C.IArc | undefined {
    const p: C.Point = point(a);
    const q: C.Point = point(b);
    const v: C.Point = point(a, 1, "right");
    const z: C.Point = point(b, 1, "left");
    const determinant: number = C.cross(v, z);
    if (
      ![p, q, v, z].every(finite) ||
      Math.abs(determinant) <= roundoff * Math.hypot(...v) * Math.hypot(...z)
    )
      return undefined;
    const factor: number = C.cross(subtract(q, p), z) / determinant;
    const corner: C.Point = [p[0] + factor * v[0], p[1] + factor * v[1]];
    const endDirection: C.Point = subtract(q, corner);
    if (factor <= 0 || endDirection[0] * z[0] + endDirection[1] * z[1] <= 0)
      return undefined;
    const x: C.Point = subtract(corner, p);
    const y: C.Point = subtract(q, p);
    const area: number = C.cross(x, y);
    if (!finite(corner) || area === 0) return undefined;

    /** Affine barycentric coordinates are linear, including along a normal. */
    function coordinates(sample: Sample): Coordinate {
      const delta: C.Point = subtract(sample.point, p);
      const l1: number = C.cross(delta, y) / area;
      const l2: number = C.cross(x, delta) / area;
      const n1: number = C.cross(sample.normal, y) / area;
      const n2: number = C.cross(x, sample.normal) / area;
      return { value: [1 - l1 - l2, l1, l2], normal: [-n1 - n2, n1, n2] };
    }
    /** Source evaluation is cached once across the coefficient bisections. */
    function sample(t: number): Coordinate | undefined {
      const position: C.Point = point(t);
      const tangent: C.Point = point(t, 1);
      const speed: number = Math.hypot(...tangent);
      if (!finite(position) || !finite(tangent) || speed === 0)
        return undefined;
      return coordinates({
        point: position,
        normal: [-tangent[1] / speed, tangent[0] / speed],
      });
    }
    // Section 3.1 defines endpoint limits by triple contact. For rational
    // Q=(A,B,E), Q'(0)=2w(B-A), so kappa(0)=|det(B-A,E-A)| /
    // (2w²|B-A|³). Matching each source endpoint curvature gives the exact
    // boundary weights of C_u, without truncating its interior contact range.
    const accelerationA: C.Point = point(a, 2, "right");
    const accelerationB: C.Point = point(b, 2, "left");
    const ka: number = zeroCurvature(a, v, accelerationA, point(a, 3, "right"))
      ? 0
      : Math.abs(C.cross(v, accelerationA)) / Math.hypot(...v) ** 3;
    const kb: number = zeroCurvature(b, z, accelerationB, point(b, 3, "left"))
      ? 0
      : Math.abs(C.cross(z, accelerationB)) / Math.hypot(...z) ** 3;
    const wa: number = Math.sqrt(
      Math.abs(area) / (2 * ka * Math.hypot(...x) ** 3),
    );
    const wb: number = Math.sqrt(
      Math.abs(area) / (2 * kb * Math.hypot(...endDirection) ** 3),
    );
    if (Number.isNaN(wa) || Number.isNaN(wb) || wa <= 0 || wb <= 0)
      return undefined;
    const left: number = Math.min(
      wa === Infinity ? 1 : wa / (1 + wa),
      wb === Infinity ? 1 : wb / (1 + wb),
    );
    const right: number = Math.max(
      wa === Infinity ? 1 : wa / (1 + wa),
      wb === Infinity ? 1 : wb / (1 + wb),
    );
    if (left === 1) return undefined;
    // Source-coordinate subtraction and barycentric arithmetic have a finite
    // roundoff floor. It controls extremum-search convergence, never tolerance.
    const uncertainty: number =
      roundoff *
      Math.max(
        C.distance(p, q),
        Math.abs(p[0]),
        Math.abs(p[1]),
        Math.abs(q[0]),
        Math.abs(q[1]),
      );
    const refined: readonly [number, number] | undefined = balance(
      sample,
      [a, b],
      [left, right],
      options.maximumDepth,
      uncertainty,
    );
    if (refined === undefined) return undefined;
    const rho: number = refined[0];
    const weight: number = rho / (1 - rho);
    if (!Number.isFinite(weight) || weight <= 0) return undefined;
    let maximum: number = refined[1];

    // These half-shifted nodes never participate in fitting the weight.
    for (let i: number = 0; i < 64; ++i) {
      const coordinate: Coordinate | undefined = sample(
        a + ((b - a) * (i + 0.5)) / 64,
      );
      const d: number | undefined =
        coordinate === undefined ? undefined : displacement(coordinate, rho);
      if (d === undefined) return undefined;
      maximum = Math.max(maximum, Math.abs(d));
    }
    return {
      domain: [a, b],
      controls: [p, corner, q],
      weight,
      maximumSampleErrorMm: maximum,
    };
  }
  /** Construct an immutable report, with omissions distinct from fit precision. */
  function result(): C.IResult {
    return {
      method:
        "ghosh-petitjean-vegter-2007-numerical-equioscillation-boundary-extension",
      status:
        omitted === 0 && errors.length === 0
          ? "complete"
          : arcs.length === 0
            ? "refused"
            : "partial",
      arcs,
      diagnostics: [...diagnostics],
      maximumSampleErrorMm: arcs.reduce(
        (value: number, arc: C.IArc): number =>
          Math.max(value, arc.maximumSampleErrorMm),
        0,
      ),
      certified: false,
      queries,
    };
  }
  if (errors.length !== 0) return result();
  diagnostics.add(
    "Numerical adaptation: sampled regularity, affine-curvature monotonicity and normal extrema do not certify the paper's smoothness/Hausdorff hypotheses or optimal arc count.",
  );
  const breaks: number[] = [
    curve.domain[0],
    ...new Set(curve.breaks),
    curve.domain[1],
  ].sort((a: number, b: number): number => a - b);
  const pending: Interval[] = [];
  for (let i: number = breaks.length - 2; i >= 0; --i)
    pending.push({ a: breaks[i]!, b: breaks[i + 1]!, depth: 0 });
  const visitBudget: number =
    (breaks.length + options.maximumArcs) * (options.maximumDepth + 1) * 2;
  try {
    while (pending.length !== 0) {
      if (
        arcs.length + omitted >= options.maximumArcs ||
        ++visits > visitBudget
      ) {
        omitted += pending.length;
        diagnostics.add(
          "Arc or admission-work budget exhausted; remaining source domains are omitted.",
        );
        break;
      }
      const interval: Interval = pending.pop()!;
      const { a, b, depth } = interval;
      const admission: string = admit(a, b);
      let candidate: C.IArc | undefined =
        admission === "regular"
          ? fit(a, b)
          : admission === "line"
            ? line(a, b)
            : undefined;
      if (
        candidate !== undefined &&
        candidate.maximumSampleErrorMm <= options.toleranceMm
      ) {
        arcs.push(candidate);
        continue;
      }

      // Proposition 3.4 permits endpoint bisection on an admitted affine spiral.
      // A failed numerical candidate is only an upper search bound, never a fit.
      if (admission === "regular" && candidate !== undefined) {
        let left: number = a;
        let right: number = b;
        let accepted: C.IArc | undefined;
        for (
          let iteration: number = 0;
          iteration < options.maximumDepth - depth;
          ++iteration
        ) {
          const middle: number = (left + right) / 2;
          candidate = fit(a, middle);
          if (
            candidate !== undefined &&
            candidate.maximumSampleErrorMm <= options.toleranceMm
          ) {
            left = middle;
            accepted = candidate;
          } else right = middle;
        }
        if (accepted !== undefined) {
          arcs.push(accepted);
          pending.push({ a: accepted.domain[1], b, depth: depth + 1 });
          continue;
        }
      }
      const middle: number = (a + b) / 2;
      if (depth >= options.maximumDepth || middle === a || middle === b) {
        ++omitted;
        diagnostics.add(
          admission === "regular" || admission === "line"
            ? "Unresolved bitangent triangle, normal intersection or tolerance at subdivision limit."
            : admission,
        );
      } else {
        pending.push(
          { a: middle, b, depth: depth + 1 },
          { a, b: middle, depth: depth + 1 },
        );
      }
    }
  } catch (error) {
    if (sourceFailure === undefined) throw error;
    errors.push(sourceFailure);
    diagnostics.add(`Source callback failure: ${sourceFailure}`);
    arcs.length = 0;
    ++omitted;
  }
  return result();
}
