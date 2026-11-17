import { preparePoseResolution } from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { resolveHumanPosture } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { throwsError } from "../internal/throwsError";

/**
 * Reusable FK source proof recognizes actual factory provenance without
 * executing an unknown supplier or treating that proof as joint admission.
 *
 * Scenarios:
 * 1. Exact engine readers stay native with their original frozen data
 *    methods. Their actual operation givesX90, refuses current NaN and
 *    issues a fresh quaternion after caller edits. Copies/proxy wrappers
 *    carry no private identity and are refused without metadata effects.
 * 2. Public posture preparation of directly authored head10 needs no FK.
 *    A caller-owned supplier therefore has zero calls, even though its
 *    hypothetical return is a real native reader; inspection cannot demand it.
 * 3. An owned callable Proxy supplier has throwing application/metadata traps.
 *    The same real public preparation still gives10, and a transported current
 *    head20 resolves to20 beside an ordinary solve without probing that loan.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines engine factory identity, unchanged frozen descriptors, unknown-source non-invocation at an actual no-FK public consumer, separate numerical admission and fresh raw output in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public engine isNative alongside actual joint composition and public resolveHumanPosture.prepare/translated/current resolution. Exact/frozen readers pass, structural/proxy readers fail without metadata traps, and no-FK authored preparation cannot execute arbitrary or callable-Proxy suppliers. LiteralX90, NaN refusal, old-output poison and current head10/20 prevent source proof from masquerading as numerical admission or a retained whole-pose answer.
 * @evidence contracts/development/testing.md#independent-expectations Only an exact factory-owned reader carries its declared producer proof; copying/wrapping identity cannot create it. A direct head clinical projection needs no bone observation, so its unknown FK supplier has zero calls. Explicit F=X,A=Y,T=Z withF90 gives(sqrt(1/2),0,0,sqrt(1/2)); raw head10/current20 remain those angles within the canonical range. Quaternion comparison allows1e-12 binary64 dot error and clinical comparisons1e-12 degrees; NaN must still fail finite admission. No internal predicate is imported to manufacture test access.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers exact/frozen/copy/proxy engine readers, actual current joint failure/recovery/output ownership, ordinary unknown and Proxy suppliers at a real public no-FK source, prepared/transported/current raw head values and cold parity. Reader methods and global prototypes are never replaced. Private lazy-parent implementation shapes and physical free-leg source reuse retain their consumer entries.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns operation readers, supplier counter, proxy targets/traps and raw authoring, borrowing an immutable canonical Human through a fresh facade. It invokes only public factories/consumers, creates no fake registration flag or test-only export, imports no private helper and starts no host, renderer or compiler.
 */
export function test_motion_pose_resolution_native_loans(): void {
  const reader: ReturnType<typeof preparePoseResolution> = preparePoseResolution();
  TestValidator.predicate("an exact actual engine factory reader carries native provenance", preparePoseResolution.isNative(reader));
  Object.freeze(reader);
  TestValidator.predicate("unchanged owned data methods stay native when descriptor flags freeze", preparePoseResolution.isNative(reader));
  const axes: IAutoMovieJointAxes = { flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 }, twist: { x: 0, y: 0, z: 1 }, twistPlacement: "proximal" };
  const earlier: IAutoMovieQuaternion = reader.joint({ bone: "head", flexion: 90, abduction: 0, twist: 0 }, axes, undefined);
  TestValidator.predicate("native proof retains actual literal quarter-turn computation",
    qclose(earlier, { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }, 1e-12));
  earlier.x = 999;
  TestValidator.predicate("native proof never replaces current admission or lends an earlier issued quaternion",
    throwsError((): unknown => reader.joint({ bone: "head", flexion: NaN, abduction: 0, twist: 0 }, axes, undefined), ["flexion", "finite"]) &&
    qclose(reader.joint({ bone: "head", flexion: 90, abduction: 0, twist: 0 }, axes, undefined),
      { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }, 1e-12) && Object.is(earlier.x, 999));
  const copy: ReturnType<typeof preparePoseResolution> = { ...reader };
  const proxy: ReturnType<typeof preparePoseResolution> = new Proxy(reader, {
    get(): never { throw new Error("foreign reader metadata is unused"); },
    getOwnPropertyDescriptor(): never { throw new Error("foreign reader descriptors are unused"); },
    getPrototypeOf(): never { throw new Error("foreign reader prototype is unused"); },
    ownKeys(): never { throw new Error("foreign reader keys are unused"); },
  });
  TestValidator.predicate("copies and proxy wrappers gain no native identity or metadata inspection",
    !preparePoseResolution.isNative(copy) && !preparePoseResolution.isNative(proxy));

  const body: IAutoMovieMotionHumanBody = { ...motionHumanBody("m-average") };
  const raw: IAutoMovieMotionHumanPosture = { root: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0,
    joints: { head: [10, 0, 0] }, limbs: {} };
  let calls: number = 0;
  const supplied: () => ReturnType<typeof preparePoseResolution> = (): ReturnType<typeof preparePoseResolution> => { calls++; return reader; };
  const proxyGetter: typeof supplied = new Proxy(supplied, {
    apply(): never { throw new Error("foreign supplier has no actual FK demand"); },
    get(): never { throw new Error("foreign supplier metadata is unused"); },
    getPrototypeOf(): never { throw new Error("foreign supplier prototype is unused"); },
    getOwnPropertyDescriptor(): never { throw new Error("foreign supplier descriptors are unused"); },
  });
  for (const source of [supplied, proxyGetter]) {
    const prepared: resolveHumanPosture.IPrepared = resolveHumanPosture.prepare(body, raw, source);
    const initial: IAutoMoviePose = prepared.pose;
    const transported: IAutoMovieMotionHumanPosture = resolveHumanPosture.translated(prepared, { x: 1, y: 2, z: 3 });
    transported.joints.head = [20, 0, 0];
    const current: IAutoMoviePose = resolveHumanPosture(body, transported);
    const cold: IAutoMoviePose = resolveHumanPosture(body, structuredClone(transported));
    TestValidator.predicate("public no-FK source inspection cannot invoke an unknown supplier or retain an old head demand",
      calls === 0 && nclose(head(initial), 10, 1e-12) && nclose(head(current), 20, 1e-12) && nclose(head(cold), 20, 1e-12));
  }
}

/** Read the actual clinical head result, without an internal source-proof predicate. */
function head(pose: IAutoMoviePose): number {
  return pose.joints.find((joint: IAutoMovieJointPose): boolean => joint.bone === "head")!.flexion!;
}
