import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  getConstraint,
  normalizeJointAxes,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieJointRotationFrame,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanHand,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { jointRotationOracle as O } from "../internal/jointRotationOracle";
import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

/**
 * A projected canonical wrist must place its actual hand-carried frame.
 *
 * Scenarios:
 * 1. Both wrists use the actual Human constraint, declared basis and clinical
 *    rest frame. A reachable midpoint articulation remains physically exact.
 * 2. Full FK composes the unchanged parent and fixed rest with that requested
 *    articulation. Its grip point, a second point along the grip normal and
 *    the normal itself must match the displayed hand.
 *
 * The two quaternion signs share the same physical expectation. These are
 * actual canonical-Human FK checks, not a synthetic skeleton or a claim about
 * unreachable tool contact. Standard nclose/qclose/vclose precision applies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both real wrists, grip-frame observations, units and oracle limits.
 * @evidence contracts/development/testing.md#behavioral-verification Projects with the actual wrist contract, inserts the returned joint into full Human FK and measures world rotation, direction and two hand-carried points.
 * @evidence contracts/development/testing.md#independent-expectations Independently composed reachable axis-angle targets and unchanged parent/rest transforms supply world geometry; no reached effector or producer candidate replaces the expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases Left and right clinical conventions, a translated turned real body, quaternion signs, a grip point and a forearm-length lever. Boxes and degeneracies are separate entries.
 * @evidence contracts/development/testing.md#execution-ownership One portable CPU entry uses one existing canonical Human fixture, immutable pose copies and public FK; no viewer, host, patch or timing assertion is involved.
 */
export function test_motion_joint_rotation_consumer(): void {
  const checks: O.IChecks = O.of();
  checks.scenario("canonical Human wrists and held points", (): void => {
    const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
    const original: IAutoMoviePose = resolveHumanPosture(
      body,
      stand.posture(body, { x: 0.4, y: 0, z: -0.3 }, 27),
    );
    const before: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, original);
    for (const side of ["left", "right"] as const) {
      const name: AutoMovieHumanoidBone = `${side}Hand`;
      const bone: IAutoMovieBone | undefined = body.skeleton.bones.find(
        (candidate: IAutoMovieBone): boolean => candidate.bone === name,
      );
      if (bone === undefined || bone.parent === null)
        throw new Error(`Canonical ${name} has no parent`);
      const constraint: IAutoMovieJointConstraint | null = getConstraint(
        name,
        bone.constraint,
      );
      const actualRig: IAutoMovieJointRotationFrame | undefined = swingTwistRange.of(
        name,
        body.skeleton,
      );
      if (constraint === null || actualRig === undefined)
        throw new Error(`Canonical ${name} has no resolved joint domain`);
      const basis: IAutoMovieJointAxes = normalizeJointAxes(
        bone.axes ?? HUMANOID_JOINT_AXES[name] ?? actualRig.axes,
        `actual ${name}`,
      );
      const rig: O.IRig = {
        bone: name,
        constraint,
        basis,
        frame: HUMANOID_REST_FRAME[name],
      };
      const coordinates: number[] = O.AXES.map(
        (axis: "flexion" | "abduction" | "twist"): number =>
          constraint[axis] === null
            ? 0
            : (constraint[axis]!.min + constraint[axis]!.max) / 2,
      );
      const wanted: IAutoMovieQuaternion = O.compose(
        [coordinates[0]!, coordinates[1]!, coordinates[2]!],
        rig,
      );
      const joint: IAutoMovieJointPose = checks.run(
        `actual ${name}`,
        rig,
        wanted,
        wanted,
      );
      const placed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, {
          ...original,
          joints: [
            ...original.joints.filter(
              (entry: IAutoMovieJointPose): boolean => entry.bone !== name,
            ),
            joint,
          ],
        });
      const expected: IAutoMovieQuaternion = Quaternion.multiply(
        before.get(bone.parent)!.worldRotation,
        Quaternion.multiply(bone.rest.rotation, wanted),
      );
      const observed: IAutoMovieResolvedBone = placed.get(name)!;
      checks.check(
        `${name} full FK orientation`,
        qclose(observed.worldRotation, expected) &&
          nclose(Quaternion.angle(observed.worldRotation, expected), 0),
      );
      const grip: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(body, side, "grip");
      const second: IAutoMovieVector3 = Vector3.add(
        grip.point,
        Vector3.scale(grip.normal, body.measure.forearm),
      );
      for (const point of [grip.point, second]) {
        const expectedPoint: IAutoMovieVector3 = Vector3.add(
          before.get(name)!.worldPosition,
          Quaternion.rotateVector(expected, point),
        );
        const actualPoint: IAutoMovieVector3 = Vector3.add(
          observed.worldPosition,
          Quaternion.rotateVector(observed.worldRotation, point),
        );
        checks.check(
          `${name} held-frame physical point ${JSON.stringify(point)}`,
          vclose(actualPoint, expectedPoint),
        );
      }
      checks.check(
        `${name} held-frame direction`,
        vclose(
          Quaternion.rotateVector(observed.worldRotation, grip.normal),
          Quaternion.rotateVector(expected, grip.normal),
        ),
      );
    }
  });
  checks.assert();
}
