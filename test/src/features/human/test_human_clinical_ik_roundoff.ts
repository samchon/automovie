import {
  AutoMovieHumanClinicalIk as Ik,
  type AutoMovieHumanSkeleton as Skeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/** Independent plane construction and its separate movable tangent endpoint. */
interface PlaneCase {
  boundary: "lower" | "upper" | "zero";
  rotated: boolean;
  scale: number;
  translation: [number, number, number];
  intrusion: number;
  correctable: boolean;
  lineSpan: number;
  localOffsets: boolean;
}

/**
 * Float64-equivalent interval boundaries must not suppress a real point objective.
 *
 * Scenarios:
 * 1. Decimal identities produce a positive raw boundary residual independent of the moving target.
 * 2. Lower, upper, zero, rotated and translated/scaled planes retain plain/prepared parity.
 * 3. A fixed one-micrometre violation remains unresolved even when the target is already met.
 * 4. A correctable millimetre violation requires actual motion, rather than numerical admission.
 * 5. A short nondegenerate line fails closed; rotating local points retain cancellation operands.
 * 6. An exact channel violation remains false even when its squared merit underflows.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public ClinicalIk with a literal moving index endpoint and an independent plane interval. The target must improve while a positive raw roundoff receipt remains observable; treating every positive bit as infeasible stalls this target. Fixed meaningful violations must still refuse.
 * @evidence contracts/testing.md#independent-expectations In real arithmetic .1+.2 equals .3, the declared plane offset is -1.5mm or zero, and index MCP20 maps to tangent X.2m. Separate decimal constructions expose Float64 cancellation without deriving an acceptance epsilon from the solver. Explicit1um and1mm displacements are physical negative/control cases, not copies of implementation thresholds.
 * @evidence contracts/testing.md#distinguishing-cases Covers both interval endpoints, a zero endpoint, rigid rotation, translation and length scaling, plain/prepared public evaluators, preserved unselected controls, immutable input, constant meaningful infeasibility and an initially violated but reachable plane. Nonidentity rigid local-point transforms cancel large translation operands; a short nondegenerate line refuses numerical admission, and a tiny exact channel miss cannot disappear by squaring. Existing clinical admission and conditional-pose units own malformed descriptors, degenerate lines and original conditional ROM.
 * @evidence contracts/testing.md#execution-ownership One discoverable synchronous root test runs the public solver and existing Engine QP through a small arithmetic FK fixture. It constructs no Human body and starts no browser, process, renderer or installation. All cases finish before their collected assertion failures are thrown; the tracked focused executable also invokes the related existing units.
 */
export function test_human_clinical_ik_roundoff(): void {
  const failures: string[] = [];
  const base: PlaneCase = {
    boundary: "lower", rotated: false, scale: 1,
    translation: [0, 0, 0], intrusion: 0, correctable: false,
    lineSpan: 1, localOffsets: false,
  };
  const variants: PlaneCase[] = [
    base,
    { ...base, boundary: "upper" },
    { ...base, boundary: "zero" },
    { ...base, rotated: true },
    { ...base, scale: 0.1, translation: [0.75, 1.25, -0.5] },
    { ...base, scale: 10, translation: [-2, 3, 0.5] },
  ];
  for (const [index, options] of variants.entries())
    for (const prepared of [false, true])
      collect(`boundary-${index}-${prepared ? "prepared" : "plain"}`, (): void => {
        boundary(options, prepared, index < 3);
      }, failures);
  for (const boundary of ["lower", "upper"] as const)
    collect(`meaningful-${boundary}`, (): void => {
      meaningful({ ...base, boundary, intrusion: 0.000001 });
    }, failures);
  collect("correctable-millimetre", (): void => {
    boundary({ ...base, correctable: true }, false, false);
  }, failures);
  for (const prepared of [false, true])
    collect(`local-quaternion-${prepared ? "prepared" : "plain"}`, (): void => {
      boundary({ ...base, boundary: "upper", localOffsets: true }, prepared, true);
    }, failures);
  for (const boundary of ["lower", "upper"] as const)
    collect(`local-meaningful-${boundary}`, (): void => {
      meaningful({ ...base, boundary, localOffsets: true, intrusion: 0.000001 });
    }, failures);
  collect("short-line-fails-closed", (): void => {
    const options: PlaneCase = { ...base, lineSpan: 0.00000001 };
    const result: Ik.IResult = Ik.solve(evaluator(options, false), input(20), query(options));
    TestValidator.predicate("a nondegenerate but poorly resolved direction is not admitted", !result.constraintsSatisfied);
    TestValidator.predicate("the original positive projection reading remains", result.constraintValues[0]!.violation > 0);
  }, failures);
  collect("tiny-exact-channel", (): void => {
    const result: Ik.IResult = Ik.solve(evaluator(base, false), input(0), {
      ...query(base),
      targets: [{ bone: "rightIndexDistal", position: [0, 0.4, 0] }],
      constraints: [{ kind: "channel", channel: "arms.right.hand.index.mcpFlexion", minimum: 1e-200 }],
    });
    TestValidator.predicate("an exact positive channel miss is never numerical projection roundoff", !result.constraintsSatisfied);
    TestValidator.predicate("the positive unsquared diagnostic survives", result.constraintValues[0]!.violation > 0);
  }, failures);
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}

/** Finish every independent case before reporting this inspection round. */
function collect(name: string, run: () => void, failures: string[]): void {
  try {
    run();
    console.log(`PASS roundoff ${name}`);
  } catch (error) {
    failures.push(`${name}: ${String(error)}`);
    console.error(`FAIL roundoff ${name}:`, error);
  }
}

/** A reachable tangent target remains distinct from the interval receipt. */
function boundary(options: PlaneCase, prepared: boolean, rawPositive: boolean): void {
  const seed: IAutoMovieHumanPose = input(10);
  const request: Ik.IRequest = query(options);
  const original: string = JSON.stringify({ seed, request });
  const result: Ik.IResult = Ik.solve(evaluator(options, prepared), seed, request);
  console.log("roundoff observation", {
    options, prepared, error: result.error, iterations: result.iterations,
    constraintsSatisfied: result.constraintsSatisfied,
    constraints: result.constraintValues,
    angle: result.pose.arms?.right.hand?.index?.mcpFlexion,
  });
  TestValidator.predicate("literal moving target reached", result.error <= request.tolerance!);
  TestValidator.predicate("actual selected joint moved to its independent solution",
    nclose(result.pose.arms!.right.hand!.index!.mcpFlexion!, 20, 0.002));
  TestValidator.predicate("numerically equivalent original interval admitted", result.constraintsSatisfied);
  if (rawPositive)
    TestValidator.predicate("raw positive boundary diagnostic is retained", result.constraintValues[0]!.violation > 0);
  if (options.correctable)
    TestValidator.predicate("millimetre plane violation was actually removed", result.constraintValues[0]!.value >= -0.0015 - 1e-12);
  TestValidator.equals("unselected wrist retained", result.pose.arms!.right.wrist!.flexion, 7);
  TestValidator.equals("input remains owned", JSON.stringify({ seed, request }), original);
  TestValidator.predicate("original bounded work", result.iterations <= 16);
}

/** A true geometric interval miss cannot borrow the point tolerance. */
function meaningful(options: PlaneCase): void {
  const request: Ik.IRequest = query(options);
  const result: Ik.IResult = Ik.solve(evaluator(options, false), input(20), request);
  console.log("meaningful observation", {
    boundary: options.boundary, error: result.error,
    constraintsSatisfied: result.constraintsSatisfied, constraints: result.constraintValues,
  });
  TestValidator.predicate("target already met independently of plane", result.error <= request.tolerance!);
  TestValidator.predicate("one-micrometre miss remains unresolved", !result.constraintsSatisfied);
  TestValidator.predicate("meaningful raw violation remains visible", result.constraintValues[0]!.violation > 0.0000005);
}

/** A selected index coordinate and a visibly unrelated authored wrist. */
function input(degrees: number): IAutoMovieHumanPose {
  return { arms: { left: {}, right: { hand: { index: { mcpFlexion: degrees } }, wrist: { flexion: 7 } } } };
}

/** The fixture's original half-space, without any solver-derived rounding band. */
function query(options: PlaneCase): Ik.IRequest {
  const origin: number = options.boundary === "upper" ? 0.3 : 0.1 + 0.2;
  const target: [number, number, number] = transform([0.2, origin * options.scale + 0.1, 0], options);
  const interval: { minimum: number; maximum: number } = options.boundary === "upper"
    ? { minimum: -0.0025 * options.scale, maximum: -0.0015 * options.scale }
    : { minimum: (options.boundary === "zero" ? 0 : -0.0015) * options.scale, maximum: (options.boundary === "zero" ? 0.001 : -0.0005) * options.scale };
  const local: { localPoint?: [number, number, number] } = options.localOffsets
    ? { localPoint: [1024, 1024, 0] } : {};
  return {
    channels: ["arms.right.hand.index.mcpFlexion"],
    targets: [{ bone: "rightIndexDistal", position: target, ...local }],
    constraints: [{
      kind: "line-offset", point: { bone: "rightThumbDistal", ...local },
      line: { origin: { bone: "rightHand", ...local }, end: { bone: "rightThumbProximal", ...local } },
      normal: options.rotated ? [-1, 0, 0] : [0, 1, 0], ...interval,
    }],
    iterations: 16, tolerance: 0.00001,
  };
}

/** Both supported evaluator capabilities expose exactly the same arithmetic FK. */
function evaluator(options: PlaneCase, prepared: boolean): Skeleton.PoseEvaluator {
  const evaluate: Skeleton.PoseEvaluator = (pose: IAutoMovieHumanPose = {}): Skeleton.IOutput => geometry(pose, options);
  if (!prepared) return evaluate;
  return Object.assign(evaluate, {
    project: (_bones: readonly string[]): Skeleton.ProjectionEvaluator =>
      (pose: IAutoMovieHumanPose = {}): Skeleton.IProjection => geometry(pose, options),
  });
}

/** Decimal-identity planes and a separate X=degrees/100 target have hand-checkable solutions. */
function geometry(pose: IAutoMovieHumanPose, options: PlaneCase): Skeleton.IOutput {
  const degrees: number = pose.arms?.right.hand?.index?.mcpFlexion ?? 0;
  const origin: number = (options.boundary === "upper" ? 0.3 : 0.1 + 0.2) * options.scale;
  let surface: number = (options.boundary === "zero" ? 0.3 : options.boundary === "upper" ? 0.1 + 0.2 - 0.0015 : 0.3 - 0.0015) * options.scale;
  surface += options.boundary === "upper" ? options.intrusion : -options.intrusion;
  if (options.correctable) surface += (degrees - 20) / 10000;
  const placements: Skeleton.IPlacement[] = [
    { bone: "rightHand", position: transform([0, origin, 0], options), rotation: [0, 0, 0, 1] },
    { bone: "rightThumbProximal", position: transform([options.lineSpan * options.scale, origin, 0], options), rotation: [0, 0, 0, 1] },
    { bone: "rightThumbDistal", position: transform([0.02, surface, 0], options), rotation: [0, 0, 0, 1] },
    { bone: "rightIndexDistal", position: transform([degrees / 100, origin + 0.1, 0], options), rotation: [0, 0, 0, 1] },
  ];
  if (options.localOffsets)
    for (const placement of placements) {
      // A half-turn maps the declared local offset to -1024 on both axes.
      placement.position = [placement.position[0] + 1024, placement.position[1] + 1024, placement.position[2]];
      placement.rotation = [0, 0, 1, 0];
    }
  return {
    bones: placements.map((row: Skeleton.IPlacement): Skeleton.IBone => ({ bone: row.bone, parent: row.bone === "rightHand" ? null : "rightHand", position: [0, 0, 0], tip: null, radius: 0.01 })),
    posed: placements, clamped: [],
  };
}

/** Exact signed-permutation rotation avoids using the solver's frame arithmetic. */
function transform(point: [number, number, number], options: PlaneCase): [number, number, number] {
  const rotated: [number, number, number] = options.rotated ? [-point[1], point[0], point[2]] : [...point];
  return [rotated[0] + options.translation[0], rotated[1] + options.translation[1], rotated[2] + options.translation[2]];
}
