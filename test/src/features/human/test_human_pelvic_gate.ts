import { AutoMovieHumanWeightField as F } from "../../../../packages/human/src/skeleton/AutoMovieHumanWeightField";

/** Model-space vector in metres, or the labelled per-metre derivative. */
type V = [number, number, number];
/** Existing xyzw unit-quaternion convention. */
type Q = [number, number, number, number];
/** Independent physical inputs of a median-contacting thigh. */
interface Anatomy {
  /** Input circumference in metres. */
  girth: number;
  /** Pelvic parent segment in metres. */
  parentLength: number;
  /** Femoral child segment in metres. */
  childLength: number;
}
/** A real thrown query, retained with the address that actually reached it. */
interface QueryError {
  /** Actual source operation at the exception. */
  operation: string;
  /** Actual coordinate passed to the source, null before a point exists. */
  coordinates: V | null;
  /** Whether a valid query was expected at this fixture address. */
  expectedNormalAvailability: boolean;
  /** Exact JavaScript thrown value classification. */
  type: string;
  /** Constructor class of the actual thrown value. */
  className: string;
  /** Actual exception name, when present. */
  name: string;
  /** Actual reason without replacing it with a generic invariant. */
  reason: string;
  /** Original diagnostic stack when supplied by the thrown value. */
  stack: string | null;
}
/** Every failing interior address, numeric finding or actual query error. */
interface PointFinding {
  /** Longitudinal station index; null for a median or pre-grid check. */
  stationIndex: number | null;
  /** Angular phase index, null outside the interior grid. */
  phaseIndex: number | null;
  /** Physical station in metres, null before point construction. */
  station: number | null;
  /** Phase in radians, null outside the interior grid. */
  phase: number | null;
  /** Actual evaluated skin coordinate, in metres. */
  point: V | null;
  /** Actual nonzero source field and its per-metre derivatives, when returned. */
  field: F.IInfluence[] | null;
  /** Numeric measurements with their independent expectations and units. */
  measurements: Record<string, unknown>;
  /** Actual failure, not an invented exception label. */
  error: QueryError | null;
}
/** Complete observations survive all preceding case and point failures. */
interface Observation {
  /** Actual physical inputs; no person selector exists. */
  anatomy: Anatomy;
  /** Common rigid or actual articulated rotation. */
  mode: "rigid" | "small" | "full";
  /** Anatomical side, mirrored about the model median. */
  side: 1 | -1;
  /** Capacity reported by the real source; absent when its query threw. */
  support: F.ISupport | null;
  /** Complete-source versus explicitly unavailable query results. */
  availability: "complete" | "point-query-failure" | "case-query-failure";
  /** All attempted half-grid points, including malformed/rejected points. */
  inspected: number;
  /** Points whose entire numeric query sequence returned. */
  completed: number;
  /** Invalid or negative/unbalanced exported influences. */
  invalidWeights: number;
  /** Largest relative jet error against independent scalar central differences. */
  gradientError: number;
  /** Largest actual finite tangent-map singular value. */
  stretch: number;
  /** Exact first maximum tie, addressed in physical and grid coordinates. */
  worst: { point: V; station: number; phase: number; field: F.IInfluence[] } | null;
  /** Every bad point remains visible even after the first failure. */
  failedPoints: PointFinding[];
}

/**
 * Verify the composite pelvic gate between anatomical keys without early exit.
 *
 * Scenarios:
 * 1. Three circumference scales on both sides retain the same 48 by 64 grid
 *    under common rigid, 15 degree and 132.1 degree motion. Independently
 *    derived h=3r admits isolated pi-rotation support at its exact capacity
 *    boundary: parent length h and femur length 2h include its full transition.
 * 2. A proper rigid isometry is green at one; articulated skin must retain the
 *    unchanged twofold strain ceiling, including every intermediate address.
 * 3. Real scalar/jet source queries agree under 1e-7 metre central differences;
 *    weights remain finite, nonnegative, normalized and fixed at the median.
 * 4. Every case and every point catches an actual source exception, preserving
 *    its input, query coordinates, type, reason and stack while later work runs.
 * 5. A deliberately malformed first skin coordinate invokes the real source
 *    rejection; the remaining 3071 points still complete. Invalid physical
 *    capacity input also rejects through the actual F.support before all 18
 *    ordinary cases run. Neither negative control changes their expectations.
 * 6. The former short-parent dimensions are separately observed as three
 *    unsupported-capacity controls. Required half-width 3r, capped available
 *    width and unsupported status are checked; they are never geometry passes.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual WeightField.support/evaluate over 18 complete physical skin cases, retaining every bad point and real thrown query before one final failure. Tangent singular values, weight mass, finite jets and the fixed median are checked at interior coordinates. A malformed coordinate and physical input exercise real rejection paths and prove later valid observations survive.
 * @evidence contracts/testing.md#independent-expectations A rigid Euclidean map has singular values one; the unchanged anatomy stretch specification is two. Circumference/(2 pi) independently supplies radius. The pi-angle DQ derivative is four and the existing cubic ramp derivative is 3/(4h), so radius times their product requires h=3r for unit excess stretch. Every ordinary case supplies parent h and child 2h; isolated support admission is checked before claiming a composite counterexample. Scalar central differences independently cross-check jets within relative 1e-6 at 1e-7 metre step. Rigid roundoff is 1e-7 and unit mass allowance 1e-12. Unsupported short-parent inputs remain separate capacity controls, and real invalid-input rejections must have the intended Error class/name and exact cause. This synthetic domain is not whole-person or clinical equivalence.
 * @evidence contracts/testing.md#distinguishing-cases Covers thin/intermediate/broad dimensions, both sides, common rigid versus small/full child rotation, all station/phase interiors and the median. Negative controls cover a real first-point error and a real pre-grid capacity error; complete reports preserve anatomy, side, motion, coordinates, source field, expected value, tolerance and units rather than hiding failed queries. Whole-person geometry, other joints, collision and visual verification remain separate consumers.
 * @evidence contracts/testing.md#execution-ownership Synchronous discoverable CPU entry test_human_pelvic_gate owns all 18 cases and the two rejection controls. Case capture frees subsequent cases; point capture frees subsequent points. Only after both controls and all cases complete does it throw one serialized report. It starts no generator, rig, process, browser, native plugin or GPU.
 */
export function test_human_pelvic_gate(): void {
  const anatomy: Anatomy = admitted(0.56);
  const rejectedCase: Observation = capture({ ...anatomy, girth: NaN }, 1, "rigid", false, false);
  const rejectedPoint: Observation = capture(anatomy, 1, "rigid", true);
  const reports: Observation[] = [];
  for (const girth of [0.44, 0.56, 0.72]) for (const side of [1, -1] as const) for (const mode of ["rigid", "small", "full"] as const) reports.push(capture(admitted(girth), side, mode));
  const controlFindings: object[] = [];
  const capacityReports: object[] = [];
  for (const input of [{ girth: 0.44, parentLength: 0.14, childLength: 0.40 }, { girth: 0.56, parentLength: 0.15, childLength: 0.43 }, { girth: 0.72, parentLength: 0.18, childLength: 0.46 }]) {
    const radius: number = input.girth / (2 * Math.PI);
    const expected: { required: number; available: number; supported: boolean } = { required: 3 * radius, available: Math.min(input.parentLength, input.childLength), supported: false };
    try {
      const actual: F.ISupport = F.support(radius, Math.PI, expected.available, 1);
      const report: object = { anatomy: input, purpose: "unsupported capacity, never a geometry pass", actual, expected, tolerance: 1e-12, unit: "m" };
      capacityReports.push(report);
      if (![actual.required, actual.available, actual.half, actual.stretchBound ?? NaN].every(Number.isFinite) || actual.supported || Math.abs(actual.required - expected.required) > 1e-12 || Math.abs(actual.available - expected.available) > 1e-12 || Math.abs(actual.half - expected.available) > 1e-12 || Math.abs((actual.stretchBound ?? NaN) - (1 + expected.required / expected.available)) > 1e-12) controlFindings.push(report);
    } catch (error: unknown) {
      const report: object = { anatomy: input, expectedAvailability: "available unsupported-capacity observation", actualError: thrown(error, "WeightField.support unsupported capacity", null, true), expected, tolerance: 1e-12, unit: "m" };
      capacityReports.push(report); controlFindings.push(report);
    }
  }
  if (rejectedCase.availability !== "case-query-failure" || rejectedCase.failedPoints[0]?.error?.operation !== "WeightField.support" || !intended(rejectedCase.failedPoints[0]?.error, "A binding support needs finite geometry and an excess-stretch budget of at least one")) controlFindings.push({ control: "invalid physical capacity", expected: "actual intended capacity Error", observed: rejectedCase, tolerance: 0, unit: "availability/class/cause" });
  if (rejectedPoint.inspected !== 3072 || rejectedPoint.completed !== 3071 || rejectedPoint.failedPoints.length !== 1 || rejectedPoint.failedPoints[0]?.stationIndex !== 0 || rejectedPoint.failedPoints[0]?.phaseIndex !== 0 || rejectedPoint.failedPoints[0]?.error?.operation !== "WeightField.evaluate jet" || !intended(rejectedPoint.failedPoints[0]?.error, "A weight field needs a finite model-space triple")) controlFindings.push({ control: "one rejected coordinate then valid geometry", expected: { inspected: 3072, completed: 3071, actualErrors: 1, errorAddress: [0, 0], errorClass: "Error", reason: "A weight field needs a finite model-space triple" }, observed: rejectedPoint, tolerance: 0, unit: "count/address/class/cause" });
  const failed: Observation[] = reports.filter((report: Observation): boolean => report.availability !== "complete" || report.inspected !== 3072 || report.completed !== 3072 || report.failedPoints.length !== 0 || report.invalidWeights !== 0 || !Number.isFinite(report.gradientError) || report.gradientError > 1e-6 || !Number.isFinite(report.stretch) || report.stretch > (report.mode === "rigid" ? 1 + 1e-7 : 2));
  if (failed.length !== 0 || controlFindings.length !== 0) throw new Error(`Composite pelvic gate failed ${failed.length}/${reports.length} complete cases:\n${JSON.stringify({ expectedNormalAvailability: "complete and independently admitted isolated support", controls: { findings: controlFindings, unsupportedCapacity: capacityReports, rejectedCase, rejectedPoint }, reports }, (_key: string, value: unknown): unknown => typeof value === "number" && !Number.isFinite(value) ? String(value) : value, 2)}`);
}

/** Capture a pre-grid source failure without suppressing the next case. */
function capture(anatomy: Anatomy, side: 1 | -1, mode: Observation["mode"], malformedFirstPoint: boolean = false, expectedCaseAvailability: boolean = true): Observation {
  const result: Observation = { anatomy, mode, side, support: null, availability: "complete", inspected: 0, completed: 0, invalidWeights: 0, gradientError: 0, stretch: 0, worst: null, failedPoints: [] };
  try { observe(result, malformedFirstPoint); }
  catch (error: unknown) {
    result.availability = "case-query-failure";
    result.failedPoints.push({ stationIndex: null, phaseIndex: null, station: null, phase: null, point: null, field: null, measurements: { expectedAvailability: expectedCaseAvailability ? "available" : "rejected", tolerance: 0, unit: "availability" }, error: thrown(error, result.support === null ? "WeightField.support" : "case setup", null, expectedCaseAvailability) });
  }
  return result;
}

/** Inspect every point, preserving the original field and deformation arithmetic. */
function observe(result: Observation, malformedFirstPoint: boolean): void {
  const { anatomy, side, mode }: Observation = result;
  const radius: number = anatomy.girth / (2 * Math.PI);
  const support: F.ISupport = F.support(radius, Math.PI, Math.min(anatomy.parentLength, anatomy.childLength), 1);
  result.support = support;
  const required: number = 3 * radius;
  const available: number = Math.min(anatomy.parentLength, anatomy.childLength);
  if (!(available >= required) || !support.supported || ![support.required, support.available, support.half, support.stretchBound ?? NaN].every(Number.isFinite) || Math.abs(support.required - required) > 1e-12 || Math.abs(support.available - available) > 1e-12 || Math.abs(support.half - required) > 1e-12 || Math.abs((support.stretchBound ?? NaN) - 2) > 1e-12) result.failedPoints.push({ stationIndex: null, phaseIndex: null, station: null, phase: null, point: null, field: null, measurements: { isolatedSupportAdmission: { observed: support, expectedRequired: required, expectedAvailable: available, expectedSupported: true, expectedIsolatedBound: 2, tolerance: 1e-12, unit: "m / x for dimensionless bound" } }, error: null });
  const tree: F.ITree = pelvis(radius, anatomy.childLength, side, support.half);
  const hip: V = [0, 0, side * radius];
  const angle: number = mode === "full" ? 132.1 : 15;
  const rotation: Q = [0, 0, Math.sin(angle * Math.PI / 360), Math.cos(angle * Math.PI / 360)];
  let operation: string = "case setup";
  let queryPoint: V | null = null;
  const weight: (point: V) => number = (point: V): number => {
    operation = "WeightField.evaluate scalar"; queryPoint = point;
    return F.evaluate(point, tree, false).find((entry: F.IInfluence): boolean => entry.slot === 1)?.weight ?? 0;
  };
  const move: (point: V) => V = (point: V): V => {
    if (mode === "rigid") return rotate(rotation, point);
    const amount: number = weight(point);
    const blend: Q = [amount * rotation[0], amount * rotation[1], amount * rotation[2], 1 - amount + amount * rotation[3]];
    const length: number = Math.hypot(...blend);
    const q: Q = blend.map((value: number): number => value / length) as Q;
    return add(hip, rotate(q, sub(point, hip)));
  };
  for (let stationIndex: number = 0; stationIndex < 48; stationIndex++) for (let phaseIndex: number = 0; phaseIndex < 64; phaseIndex++) {
    const station: number = (stationIndex + 0.5) / 48 * anatomy.childLength;
    const phase: number = 2 * Math.PI * (phaseIndex + 0.5) / 64;
    const point: V = [radius * Math.cos(phase), -station, side * radius * (1 + Math.sin(phase))];
    if (malformedFirstPoint && stationIndex === 0 && phaseIndex === 0) point[0] = NaN;
    let field: F.IInfluence[] | null = null;
    result.inspected++;
    try {
      operation = "WeightField.evaluate jet"; queryPoint = point;
      field = F.evaluate(point, tree, true);
      const tangents: [V, V] = [[0, -1, 0], [-Math.sin(phase), 0, side * Math.cos(phase)]];
      const total: number = field.reduce((sum: number, entry: F.IInfluence): number => sum + entry.weight, 0);
      const invalid: boolean = !Number.isFinite(total) || Math.abs(total - 1) > 1e-12 || field.some((entry: F.IInfluence): boolean => entry.weight < 0 || !entry.gradient.every(Number.isFinite));
      if (invalid) result.invalidWeights++;
      const own: F.IInfluence | undefined = field.find((entry: F.IInfluence): boolean => entry.slot === 1);
      let gradientError: number = 0;
      for (const tangent of tangents) {
        const step: number = 1e-7;
        const finite: number = (weight(add(point, times(tangent, step))) - weight(sub(point, times(tangent, step)))) / (2 * step);
        const exact: number = dot(own?.gradient ?? [0, 0, 0], tangent);
        gradientError = Math.max(gradientError, Math.abs(finite - exact) / Math.max(1, Math.abs(exact)));
      }
      result.gradientError = Math.max(result.gradientError, gradientError);
      const differential: V[] = tangents.map((tangent: V): V => {
        const step: number = 1e-7;
        return times(sub(move(add(point, times(tangent, step))), move(sub(point, times(tangent, step)))), 1 / (2 * step));
      });
      const stretch: number = singular(differential[0]!, differential[1]!);
      const limit: number = mode === "rigid" ? 1 + 1e-7 : 2;
      result.completed++;
      if (stretch > result.stretch) { result.stretch = stretch; result.worst = { point, station, phase, field }; }
      if (invalid || !Number.isFinite(gradientError) || gradientError > 1e-6 || !Number.isFinite(stretch) || stretch > limit) result.failedPoints.push({ stationIndex, phaseIndex, station, phase, point, field, measurements: { finiteNonnegativeInfluences: { observed: !invalid, expected: true, tolerance: 0, unit: "boolean" }, normalizedMass: { observed: total, expected: 1, tolerance: 1e-12, unit: "unit mass" }, gradient: { observedRelativeError: gradientError, expected: 0, tolerance: 1e-6, unit: "relative derivative error" }, stretch: { observed: stretch, low: 0, high: limit, tolerance: 0, unit: "x" }, expectedAvailability: "available" }, error: null });
    } catch (error: unknown) {
      result.availability = "point-query-failure";
      const expectedAvailability: boolean = !(malformedFirstPoint && stationIndex === 0 && phaseIndex === 0);
      result.failedPoints.push({ stationIndex, phaseIndex, station, phase, point, field, measurements: { expectedAvailability: expectedAvailability ? "available" : "rejected", tolerance: 0, unit: "availability" }, error: thrown(error, operation, queryPoint, expectedAvailability) });
    }
  }
  for (const station of [0, anatomy.childLength / 2, anatomy.childLength]) {
    const point: V = [radius, -station, 0];
    try {
      const field: F.IInfluence[] = F.evaluate(point, tree, true);
      if (field.some((entry: F.IInfluence): boolean => entry.slot === 1 && entry.weight !== 0)) {
        result.invalidWeights++;
        result.failedPoints.push({ stationIndex: null, phaseIndex: null, station, phase: null, point, field, measurements: { expectedLegMass: 0, tolerance: 0, unit: "unit mass", expectedAvailability: "available" }, error: null });
      }
    } catch (error: unknown) {
      result.availability = "point-query-failure";
      result.failedPoints.push({ stationIndex: null, phaseIndex: null, station, phase: null, point, field: null, measurements: { expectedAvailability: "available", tolerance: 0, unit: "availability" }, error: thrown(error, "WeightField.evaluate median jet", point, true) });
    }
  }
}

/** Preserve the real thrown value and actual operation address. */
function thrown(error: unknown, operation: string, coordinates: V | null, expectedNormalAvailability: boolean): QueryError {
  return { operation, coordinates, expectedNormalAvailability, type: typeof error, className: error instanceof Error ? error.constructor.name : Object.prototype.toString.call(error), name: error instanceof Error ? error.name : Object.prototype.toString.call(error), reason: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack ?? null : null };
}

/** Independently admitted boundary support: h=3r and a child spanning both h halves. */
function admitted(girth: number): Anatomy { const radius: number = girth / (2 * Math.PI); return { girth, parentLength: 3 * radius, childLength: 6 * radius }; }

/** Unrelated TypeError or another invariant cannot satisfy an intended rejection. */
function intended(error: QueryError | null | undefined, reason: string): boolean { return error?.type === "object" && error.className === "Error" && error.name === "Error" && error.reason === reason; }

/** Actual anatomical plane, fixed median and distal release on two explicit bones. */
function pelvis(radius: number, length: number, side: 1 | -1, half: number): F.ITree {
  const hip: V = [0, 0, side * radius];
  const normal: V = unit([0, -1, side * 0.7]);
  const child: F.ILimb = { slot: 1, from: hip, to: add(hip, [0, -length, 0]), near: radius, far: radius, planes: [{ at: hip, normal, half }], lips: null, midline: half, clear: { at: add(hip, [0, -1.7 * radius, 0]), normal: [0, -1, 0], half }, side, rivals: [], own: [], contest: 0, kids: [] };
  const root: F.ILimb = { slot: 0, from: [0, 0, 0], to: [0, length, 0], near: radius, far: radius, planes: [], lips: null, midline: 0, clear: null, side: 0, rivals: [], own: [], contest: 0, kids: [child] };
  return { root, chest: 0, arms: [] };
}
/** Larger singular value of the evaluated three-by-two tangent map. */
function singular(a: V, b: V): number { const aa: number = dot(a, a); const ab: number = dot(a, b); const bb: number = dot(b, b); return Math.sqrt((aa + bb) / 2 + Math.sqrt((aa - bb) ** 2 / 4 + ab * ab)); }
/** Unit-quaternion vector rotation, independent of the production field. */
function rotate(q: Q, p: V): V { const t: V = times(cross([q[0], q[1], q[2]], p), 2); return add(p, add(times(t, q[3]), cross([q[0], q[1], q[2]], t))); }
/** Registered-frame scalar product. */
function dot(a: V, b: V): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
/** Registered-frame cross product. */
function cross(a: V, b: V): V { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
/** Vector sum. */
function add(a: V, b: V): V { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
/** Vector difference. */
function sub(a: V, b: V): V { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
/** Vector scaling. */
function times(a: V, factor: number): V { return [a[0] * factor, a[1] * factor, a[2] * factor]; }
/** Unit physical direction. */
function unit(a: V): V { return times(a, 1 / Math.hypot(...a)); }
