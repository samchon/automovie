import { HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME, type IAutoMovieResolvedBone, preparePoseResolution, resolvePose } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanGaze, type IHumanBody, type IHumanPosture, resolveHumanPosture } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * Eyes-only recruitment still applies the original weighted zero-cervical
 * target before solving actual eye directions in that resulting head frame.
 *
 * Scenarios:
 * 1. Authored neck/head abduction10/-6 is blended toward zero by head
 *    weight0,1/2,1, giving10/-6,5/-3,0/0. These literals do not assume that
 *    the body's zero-head pitch correction is zero or redefine recruitment.
 * 2. Alternating/repeated reachable world targets retain those cervical
 *    values while each actually displayed eye forward reaches its current
 *    target. A supplied genuine FK operation and an ordinary call both work.
 * 3. Earlier issued joint-tuple edits cannot alter the source or replay;
 *    every new cervical tuple is independent of the previous issue.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines original eyes-only recruitment versus weighted cervical application, clinical-degree literals, current displayed world-direction oracle, same-body loan scope and fresh tuple/input ownership in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls real public HumanGaze.aim on a canonical Human with nonzero authored cervical joints and weights0/0.5/1 in changing order, with/without a genuine FK reader. Literal neck/head abduction catches an omitted cervical path in eyes mode; full raw displayed FK and independent forward/direction arithmetic require actual current eye solving. Previous-output poison and source equality expose leaked tuple storage.
 * @evidence contracts/development/testing.md#independent-expectations The original cervical writer targets abduction0 in every mode, so linear blending is base*(1-weight):10/-6 become5/-3 at1/2 and0/0 at1. Existing zero-head rest correction affects flexion/twist only and is not used as an expected value. A unit quaternion sends forwardZ to(2(xz+wy),2(yz-wx),1-2(x²+y²)); normalized target-minus-eye is its independent geometric expectation at1e-9 component precision. Clinical literals allow1e-12 degrees, without changing gaze limits or fitting bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers nonzero positive/negative cervical inputs, zero/partial/full head weight, eyes-only recruitment, target A/B/A and both FK-source forms, actual displayed eyes, fresh cervical tuples and prior-output poison. Broader recruitment ranges/timing and population coverage remain with gaze/look feature tests; no new eyes-mode policy is introduced.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable motion unit borrows an immutable canonical Human and owns all raw joints/targets/output edits. It uses public aiming/resolution plus full raw FK, patches no foreign method/global or shared ROM and starts no host, compiler or renderer.
 */
export function test_motion_gaze_eyes_cervical_blend(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const posture: IHumanPosture = { root: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0,
    joints: { neck: [6, 10, 4], head: [8, -6, -3] }, limbs: {} };
  const unchanged: string = JSON.stringify(posture);
  const neutral: IAutoMovieResolvedBone[] = displayed(body, { ...posture, joints: {} });
  const left: IAutoMovieVector3 = neutral.find((bone: IAutoMovieResolvedBone): boolean => bone.bone === "leftEye")!.worldPosition;
  const right: IAutoMovieVector3 = neutral.find((bone: IAutoMovieResolvedBone): boolean => bone.bone === "rightEye")!.worldPosition;
  const origin: IAutoMovieVector3 = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2, z: (left.z + right.z) / 2 };
  const operation: ReturnType<typeof preparePoseResolution> = preparePoseResolution();
  let previous: IHumanPosture | undefined;
  for (const borrowed of [false, true])
    for (const [weight, offset] of [[0.5, 0.4], [0, -0.3], [1, 0], [0.5, 0.4]] as const) {
      const target: IAutoMovieVector3 = { x: origin.x + offset, y: origin.y, z: origin.z + 3 };
      const actual: IHumanPosture = HumanGaze.aim(body, posture, target, "eyes", { eyes: 1, head: weight, trunk: 0 },
        borrowed ? operation : undefined);
      TestValidator.predicate(`eyes-only cervical blend preserves literal abduction at headweight${weight}, loan=${borrowed}`,
        nclose(actual.joints.neck![1], 10 * (1 - weight), 1e-12) && nclose(actual.joints.head![1], -6 * (1 - weight), 1e-12));
      for (const eye of displayed(body, actual).filter((bone: IAutoMovieResolvedBone): boolean => bone.bone === "leftEye" || bone.bone === "rightEye")) {
        const delta: IAutoMovieVector3 = { x: target.x - eye.worldPosition.x, y: target.y - eye.worldPosition.y, z: target.z - eye.worldPosition.z };
        const length: number = Math.hypot(delta.x, delta.y, delta.z);
        const { x, y, z, w }: IAutoMovieResolvedBone["worldRotation"] = eye.worldRotation;
        const forward: IAutoMovieVector3 = { x: 2 * (x * z + w * y), y: 2 * (y * z - w * x), z: 1 - 2 * (x * x + y * y) };
        TestValidator.predicate(`actual displayed${eye.bone} follows the current target after cervical blending`,
          vclose(forward, { x: delta.x / length, y: delta.y / length, z: delta.z / length }, 1e-9));
      }
      if (previous !== undefined)
        TestValidator.predicate("a later gaze cannot borrow or repair an earlier issued cervical tuple",
          actual.joints.head !== previous.joints.head && actual.joints.neck !== previous.joints.neck &&
          Object.is(previous.joints.head![1], 777));
      Object.defineProperty(actual.joints.head!, "1", { value: 777 });
      previous = actual;
      TestValidator.equals("gaze reads preserve the original authored cervical input", JSON.stringify(posture), unchanged);
    }
}

/** Resolve the actual displayed full hierarchy independently of the demanded trunk adapter. */
function displayed(body: IHumanBody, posture: IHumanPosture): IAutoMovieResolvedBone[] {
  return resolvePose(resolveHumanPosture(body, posture), body.skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME);
}
