import {
  jointToQuaternionOnBasis,
  normalizeJointAxes,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../internal/qclose";
import { qunit } from "../internal/qunit";
import { throwsError } from "../internal/throwsError";

/**
 * Declared rig-angle factors can outlive a query without retaining its answer.
 *
 * On the admitted X/Y/Z basis the chosen frame maps clinical flexion c to
 * F=(c-10)/-1 degrees. Abduction is zero and twist T is already rig-relative.
 * Thus Rz(T)Rx(F) has components (sin(f)cos(t), sin(f)sin(t),
 * cos(f)sin(t), cos(f)cos(t)), with f and t the half angles in radians.
 * These independent components retain the existing quaternion precision.
 *
 * Scenarios:
 * 1. The operation declares F=-30/+30 and T=+20/-20, not the corresponding
 *    clinical values. First use does positive owned axis-input work. A fresh
 *    query at a previously read declared F needs no such input work; the
 *    second declared value is prepared on demand. Every output stays fresh.
 * 2. An undeclared F is still evaluated in each fresh query. Caller mutation
 *    of the first returned quaternion cannot change a declared private factor
 *    or another query's physical answer, and cannot be repaired by later reads.
 * 3. Warm declared factors cannot bypass F/A/T finite admission. Each actual
 *    invalid axis must throw, and a valid query must recover afterwards.
 * 4. A declaration of positive zero does not match the negative zero produced
 *    by clinical flexion 10 under the negative frame sign. Two independent
 *    queries therefore both do positive axis-input work for that reading.
 *
 * The owned X getter always returns the same admitted number. Its counts
 * observe only fixed-factor versus dynamic-factor scope, not elapsed time or
 * projection calls. Axes, frames and declared tuples stay unchanged. This
 * deferred math unit adds no representative performance or execution selection.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Derives the clinical map and two-factor quaternion, names declared/dynamic and signed-zero scope boundaries, fixed inputs, returned ownership, actual finite refusals and the limited meaning of owned getter work.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public independent query composers with declared rig coordinates, observes actual physical quaternions, owned input reads, current invalid coordinates, recovery and isolation after returned-data mutation.
 * @evidence contracts/development/testing.md#independent-expectations The declared affine map and cardinal quaternion factors supply physical answers. Exact resolved-angle declarations allow fixed-factor sharing; undeclared or Object.is-distinct signed-zero readings retain per-query work. No producer cache, candidate or returned snapshot supplies a geometric expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases Clinical-versus-rig coordinates, both declared factors, undeclared repeated angles, positive first reads, fresh queries, poisoned earlier output, ordered F/A/T admission and positive-zero versus negative-zero declaration distinguish scope and key mistakes.
 * @evidence contracts/development/testing.md#execution-ownership One deferred portable CPU unit owns numeric engine inputs, an observational getter, declared readonly tuples and returned mutations; it replaces no foreign method/global and starts no runner, compiler, renderer or host.
 */
export function test_motion_joint_rotation_fixed_factors(): void {
  const findings: string[] = [];
  const admitted: IAutoMovieJointAxes = normalizeJointAxes({
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
  }, "declared factor basis");
  let reads: number = 0;
  const basis: IAutoMovieJointAxes = {
    ...admitted,
    flexion: {
      ...admitted.flexion,
      get x(): number {
        reads++;
        return admitted.flexion.x;
      },
    },
  };
  const frame: IAutoMovieRestFrame = {
    flexion: { sign: -1, neutral: 10 },
  };
  const fixed: jointToQuaternionOnBasis.IFixedAngles = {
    flexion: [-30, 30], abduction: [0], twist: [20, -20],
  };
  const queries: ReturnType<typeof jointToQuaternionOnBasis.prepareQueries> =
    jointToQuaternionOnBasis.prepareQueries(basis, frame, fixed);
  const halfFlexion: number = Math.PI / 12;
  const halfTwist: number = Math.PI / 18;
  const expectedA: IAutoMovieQuaternion = {
    x: -Math.sin(halfFlexion) * Math.cos(halfTwist),
    y: -Math.sin(halfFlexion) * Math.sin(halfTwist),
    z: Math.cos(halfFlexion) * Math.sin(halfTwist),
    w: Math.cos(halfFlexion) * Math.cos(halfTwist),
  };
  const expectedB: IAutoMovieQuaternion = {
    x: Math.sin(halfFlexion) * Math.cos(halfTwist),
    y: -Math.sin(halfFlexion) * Math.sin(halfTwist),
    z: -Math.cos(halfFlexion) * Math.sin(halfTwist),
    w: Math.cos(halfFlexion) * Math.cos(halfTwist),
  };

  /** Compare a fresh public read with the independently composed two factors. */
  function query(
    label: string,
    clinical: number,
    twist: number,
    factory: typeof queries = queries,
  ): IAutoMovieQuaternion {
    const compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> = factory();
    const actual: IAutoMovieQuaternion = compose({
      flexion: clinical, abduction: 0, twist,
    });
    const f: number = ((10 - clinical) * Math.PI) / 360;
    const t: number = (twist * Math.PI) / 360;
    const expected: IAutoMovieQuaternion = {
      x: Math.sin(f) * Math.cos(t),
      y: Math.sin(f) * Math.sin(t),
      z: Math.cos(f) * Math.sin(t),
      w: Math.cos(f) * Math.cos(t),
    };
    if (!(qunit(actual) && qclose(actual, expected)))
      findings.push(`${label}: the actual clinical rotation differs`);
    return actual;
  }

  if (reads !== 0) findings.push("declaring fixed factors eagerly read the axis");
  const first: IAutoMovieQuaternion = query("first declared A", 40, 20);
  if (!(reads > 0)) findings.push("the first declared factor was never evaluated");
  reads = 0;
  const again: IAutoMovieQuaternion = query("another declared A query", 40, 20);
  if (reads !== 0) findings.push("a declared rig factor was recomputed in another query");
  first.x = NaN;
  reads = 0;
  const b: IAutoMovieQuaternion = query("first declared B", -20, -20);
  if (!(reads > 0)) findings.push("the second declared factor was never evaluated");
  if (!qclose(again, expectedA))
    findings.push("changing the query also changed an earlier declared A result");
  reads = 0;
  const bAgain: IAutoMovieQuaternion = query("another declared B query", -20, -20);
  if (reads !== 0) findings.push("the second declared factor was not shared");
  reads = 0;
  query("first undeclared factor", 10, 20);
  if (!(reads > 0)) findings.push("an undeclared factor bypassed its actual evaluation");
  reads = 0;
  query("another undeclared query", 10, 20);
  if (!(reads > 0)) findings.push("an undeclared factor leaked across queries");
  query("restored declared A after caller mutation", 40, 20);
  if (!(new Set<IAutoMovieQuaternion>([first, again, b, bAgain]).size === 4 && Number.isNaN(first.x) &&
    qunit(again) && qclose(again, expectedA) &&
    qunit(b) && qclose(b, expectedB) && qunit(bAgain) && qclose(bAgain, expectedB)))
    findings.push("a returned quaternion aliases or was repaired by private factors");

  const invalid: IAutoMovieJointPose = {
    bone: "spine", flexion: NaN, abduction: Infinity, twist: NaN,
  };
  for (const axis of ["flexion", "abduction", "twist"] as const) {
    if (!throwsError((): IAutoMovieQuaternion => queries()(invalid),
      ["jointToQuaternion", `${axis} must be finite or null`]))
      findings.push(`warm declared factors bypassed current ${axis} admission`);
    if (axis === "flexion") invalid.flexion = 40;
    else if (axis === "abduction") invalid.abduction = 0;
    else invalid.twist = 20;
  }
  query("valid after all current-axis refusals", 40, 20);

  const positiveZero: jointToQuaternionOnBasis.IFixedAngles = { flexion: [0] };
  const signed: typeof queries = jointToQuaternionOnBasis.prepareQueries(
    basis, frame, positiveZero,
  );
  for (const label of ["first negative-zero query", "next negative-zero query"]) {
    reads = 0;
    query(label, 10, 20, signed);
    if (!(reads > 0)) findings.push(`${label}: positive zero matched negative zero`);
  }
  TestValidator.equals("declared rig factors keep dynamic queries independent", findings, []);
}
