import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qunit } from "../../../internal/qunit";

/**
 * A fixed-axis reader reuses its magnitude work without retaining rotations.
 *
 * A rotation through theta about unit direction u is (u sin(theta/2),
 * cos(theta/2)). The integer direction (2,-3,6) has length 7, while equal
 * positive components have unit direction (1,1,1)/sqrt(3), independently of
 * their common magnitude. These formulas give physical expectations; raw parity
 * with the direct entry separately checks its IEEE-754 policy.
 *
 * Scenarios:
 *
 * 1. Ordinary unequal axes and ordinary/tiny/huge/subnormal equal axes read
 *    A90/B-120/A90 degrees on one unchanged axis. Every finite result has the
 *    independently known components and unit length at the existing 1e-6
 *    quaternion precision. Earlier output mutation cannot escape.
 * 2. An owned getter returns the same X component throughout an operation.
 *    Construction reads none; the first angle performs positive input work and
 *    a later angle reads less. This observes magnitude-input work only, without
 *    claiming zero later component reads or elapsed-time speedup.
 * 3. Zero axes retain the declared fresh-identity convention even for a nonfinite
 *    angle. Nonzero axes with signed-zero/nonfinite angles, and nonfinite axes,
 *    preserve direct public component semantics. Direct and prepared entries
 *    share code, so this parity is not a physics oracle.
 *
 * Axes stay unchanged while each reader lives. No caller changes a shared axis,
 * production method or global, and no target-answer cache is assumed. This is a
 * deferred pure-math unit, not another representative execution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Derives both independent unit directions, degrees/half-angle components, three causes, immutable-axis lifetime, observed getter work and the limited meaning of raw parity.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public prepared primitive at changing angles and extreme finite scales, observes finite/unit physical components, mutates owned outputs, counts an owned input getter and checks zero/nonfinite raw behavior.
 * @evidence contracts/development/testing.md#independent-expectations The length-7 integer direction and equal-component direction supply closed-form physical quaternions. Zero-axis identity follows the declared convention; direct composition is used only for preserved raw-component semantics at signed-zero/nonfinite inputs.
 * @evidence contracts/development/testing.md#distinguishing-cases Non-cardinal unequal directions, normal/tiny/huge/subnormal magnitudes, A/B/A, returned-output mutation, lazy construction, positive first-versus-later work and zero/nonfinite cases distinguish stale answers, wrong scaling and moved arithmetic.
 * @evidence contracts/development/testing.md#execution-ownership One deferred in-memory math entry owns finite axis records, an observational getter and returned mutations. It starts no runner or host, changes no existing fixture or bound and replaces no foreign method.
 */
export function test_unit_engine_math_quaternion_prepared_axis_angle(): void {
  const findings: string[] = [];
  const equal: number = 1 / Math.sqrt(3);
  const unit: IAutoMovieVector3 = { x: equal, y: equal, z: equal };

  /** Check actual components against a geometric unit direction. */
  function physical(
    label: string,
    actual: IAutoMovieQuaternion,
    direction: IAutoMovieVector3,
    degrees: number,
  ): void {
    const half: number = (Math.PI * degrees) / 360;
    const sine: number = Math.sin(half);
    if (
      !(
        qunit(actual) &&
        nclose(actual.x, direction.x * sine) &&
        nclose(actual.y, direction.y * sine) &&
        nclose(actual.z, direction.z * sine) &&
        nclose(actual.w, Math.cos(half))
      )
    )
      findings.push(`${label}: physical axis-angle components differ`);
  }

  /** Raw identity is secondary equivalence, including NaN and signed zero. */
  function parity(
    label: string,
    actual: IAutoMovieQuaternion,
    direct: IAutoMovieQuaternion,
  ): void {
    if (
      !(["x", "y", "z", "w"] as const).every(
        (component: keyof IAutoMovieQuaternion): boolean =>
          Object.is(actual[component], direct[component]),
      )
    )
      findings.push(`${label}: direct raw semantics changed`);
  }

  for (const [label, axis, direction] of [
    ["unequal", { x: 2, y: -3, z: 6 }, { x: 2 / 7, y: -3 / 7, z: 6 / 7 }],
    ["equal normal", { x: 1, y: 1, z: 1 }, unit],
    ["equal tiny", { x: 1e-300, y: 1e-300, z: 1e-300 }, unit],
    ["equal huge", { x: 1e300, y: 1e300, z: 1e300 }, unit],
    [
      "equal subnormal",
      { x: Number.MIN_VALUE, y: Number.MIN_VALUE, z: Number.MIN_VALUE },
      unit,
    ],
  ] as const) {
    const read: ReturnType<typeof Quaternion.prepareAxisAngle> =
      Quaternion.prepareAxisAngle(axis);
    let first: IAutoMovieQuaternion | undefined;
    for (const [index, degrees] of [90, -120, 90].entries()) {
      const actual: IAutoMovieQuaternion = read(degrees);
      physical(`${label} ${degrees}`, actual, direction, degrees);
      parity(label, actual, Quaternion.fromAxisAngle(axis, degrees));
      if (index === 0) {
        first = actual;
        first.x = 999;
      } else if (actual === first)
        findings.push(`${label}: another angle borrowed the first output`);
    }
    if (!(first !== undefined && first.x === 999))
      findings.push(`${label}: later reads rewrote caller-owned output`);
  }

  let reads: number = 0;
  const observed: IAutoMovieVector3 = {
    get x(): number {
      reads++;
      return 2;
    },
    y: -3,
    z: 6,
  };
  const lazy: ReturnType<typeof Quaternion.prepareAxisAngle> =
    Quaternion.prepareAxisAngle(observed);
  if (reads !== 0)
    findings.push("constructing the reader eagerly inspected its axis");
  physical("first lazy angle", lazy(90), { x: 2 / 7, y: -3 / 7, z: 6 / 7 }, 90);
  const initialReads: number = reads;
  reads = 0;
  physical(
    "later lazy angle",
    lazy(-120),
    { x: 2 / 7, y: -3 / 7, z: 6 / 7 },
    -120,
  );
  if (!(initialReads > 0 && reads < initialReads))
    findings.push("unchanged-axis magnitude preparation was repeated");

  const axis: IAutoMovieVector3 = { x: 2, y: -3, z: 6 };
  const signed: ReturnType<typeof Quaternion.prepareAxisAngle> =
    Quaternion.prepareAxisAngle(axis);
  for (const degrees of [0, -0])
    parity(
      "signed-zero",
      signed(degrees),
      Quaternion.fromAxisAngle(axis, degrees),
    );
  TestValidator.equals(
    "fixed-axis quaternion readers preserve geometry and ownership",
    findings,
    [],
  );
}
