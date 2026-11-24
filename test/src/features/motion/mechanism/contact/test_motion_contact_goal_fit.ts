import {
  Quaternion,
  Vector3,
  closestPointsBetweenSegments,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance, HumanVerdicts } from "@automovie/motions";
import {
  HumanBodyFit,
  HumanLimbFit,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionComplaints } from "../../../internal/motionComplaints";
import { motionHumanBody } from "../../../internal/motionHumanBody";
import { nclose } from "../../../internal/nclose";

/**
 * Bone-carried goals remain attached while other hard goals move the body; a
 * physical point radius is a Euclidean maximum, including its boundary.
 *
 * Scenarios:
 *
 * 1. On small, average and short-armed bodies, translated and turned above the
 *    floor, recover a known posture with world head/chest goals and a hand
 *    point and rotation relative to the moving chest. The other hand's relative
 *    normal and a head point carried by the head stay invariant.
 * 2. A root translation and physical mass-centre goal move a point inside a 20 mm
 *    ball; the final FK distance must actually lie inside it.
 * 3. Rigid points inside, exactly on and diagonally outside the same radius
 *    distinguish a sphere from an XYZ box and prevent a numerical equality
 *    tolerance from enlarging the requested radius. A negative radius throws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States all three scenarios and the measured frames, units and physical bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real whole-body fit and independently reads its final FK and segmental mass centre, then compares actual Euclidean distances with the declared radius.
 * @evidence contracts/development/testing.md#independent-expectations A separately authored reachable posture supplies rigid-transform goals; the root displacement is specified in metres, and sqrt(x*x+z*z) distinguishes the ball's interior, axis boundary and box corner.
 * @evidence contracts/development/testing.md#distinguishing-cases Three different body geometries and masses, rotated translated roots, a moving anchor, point and orientation constraints, normal-only rotation, same-bone cancellation, a mobile ball, a rigid boundary and an impossible diagonal corner.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU tests on the existing real-body fixtures through public package imports; no patched global, private compiler or renderer.
 */
export function test_motion_contact_goal_fit(): void {
  checkSelectedFallback();
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const all: motionComplaints.IGatherer = motionComplaints();
  const tolerance: number = HumanBodyFit.TOLERANCE;
  const shown: (
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ) => Bones = (
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): Bones => poseBones(body, resolveHumanPosture(body, posture));
  const relative: (
    bones: Bones,
    bone: AutoMovieHumanoidBone,
    on: AutoMovieHumanoidBone,
  ) => IGoalFrame = (
    bones: Bones,
    bone: AutoMovieHumanoidBone,
    on: AutoMovieHumanoidBone,
  ): IGoalFrame => {
    const anchor: IAutoMovieResolvedBone = bones.get(on)!;
    const effector: IAutoMovieResolvedBone = bones.get(bone)!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      anchor.worldRotation,
    );
    return {
      point: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(effector.worldPosition, anchor.worldPosition),
      ),
      rotation: Quaternion.multiply(inverse, effector.worldRotation),
    };
  };
  for (const name of ["f-small", "m-average", "m-short-armed"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const entry: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanStance.stand.posture(
        body,
        { x: 0.7, y: body.measure.stature, z: -0.4 },
        name === "m-short-armed" ? 90 : 25,
      );
    try {
      const wanted: IAutoMovieMotionHumanPosture = {
        ...entry,
        root: Vector3.add(entry.root, { x: 0.03, y: 0, z: 0.02 }),
        joints: {
          ...entry.joints,
          chest: [8, 0, 0],
          leftLowerArm: [(entry.joints.leftLowerArm?.[0] ?? 0) + 12, 0, 0],
        },
        limbs: {},
      };
      const expected: Bones = shown(body, wanted);
      const hand: ReturnType<typeof relative> = relative(
        expected,
        "leftHand",
        "chest",
      );
      const right: ReturnType<typeof relative> = relative(
        expected,
        "rightHand",
        "chest",
      );
      const normal: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
      const pinned: IAutoMovieVector3 = { x: 0.03, y: 0.02, z: 0.01 };
      const fitted: IAutoMovieMotionHumanBodyFitTypes.IResult =
        HumanBodyFit.fit({
          body,
          posture: entry,
          variables: [
            { kind: "place", axis: "x" },
            { kind: "place", axis: "z" },
            { kind: "angle", bone: "chest", axis: 0 },
            { kind: "angle", bone: "leftLowerArm", axis: 0 },
          ],
          targets: [
            { bone: "head", goal: expected.get("head")!.worldPosition },
            {
              bone: "chest",
              goal: expected.get("chest")!.worldPosition,
              axes: [],
              rotation: expected.get("chest")!.worldRotation,
            },
            {
              bone: "leftHand",
              on: "chest",
              goal: hand.point,
              rotation: hand.rotation,
            },
            {
              bone: "rightHand",
              on: "chest",
              goal: right.point,
              axes: [],
              normal: {
                local: normal,
                world: Quaternion.rotateVector(right.rotation, normal),
              },
            },
            {
              bone: "head",
              point: pinned,
              on: "head",
              goal: pinned,
              rotation: Quaternion.identity(),
            },
          ],
        });
      const bones: Bones = shown(body, fitted.posture);
      const got: ReturnType<typeof relative> = relative(
        bones,
        "leftHand",
        "chest",
      );
      const gotRight: ReturnType<typeof relative> = relative(
        bones,
        "rightHand",
        "chest",
      );
      all.check(
        `${name} relative goals converged (${fitted.reason})`,
        fitted.converged,
      );
      all.check(
        `${name} attached hand actual position`,
        Vector3.length(Vector3.subtract(got.point, hand.point)) <=
          Math.sqrt(3) * tolerance,
      );
      all.check(
        `${name} attached hand actual orientation`,
        Quaternion.angle(got.rotation, hand.rotation) <=
          Math.sqrt(3) * tolerance,
      );
      all.check(
        `${name} other-hand attached normal`,
        Vector3.length(
          Vector3.subtract(
            Quaternion.rotateVector(gotRight.rotation, normal),
            Quaternion.rotateVector(right.rotation, normal),
          ),
        ) <=
          Math.sqrt(2) * tolerance,
      );
      all.check(
        `${name} world head goal survives the relative solve`,
        Vector3.length(
          Vector3.subtract(
            bones.get("head")!.worldPosition,
            expected.get("head")!.worldPosition,
          ),
        ) <=
          Math.sqrt(3) * tolerance,
      );
      all.check(
        `${name} analytical root displacement`,
        Math.abs(fitted.posture.root.x - wanted.root.x) <= tolerance &&
          Math.abs(fitted.posture.root.z - wanted.root.z) <= tolerance,
      );
    } catch (error) {
      all.check(`${name} relative solve threw: ${String(error)}`, false);
    }

    const bones: Bones = shown(body, entry);
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile),
      bones,
    );
    const radius: number = 0.02;
    try {
      const moved: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit(
        {
          body,
          posture: entry,
          variables: [
            { kind: "place", axis: "x" },
            { kind: "place", axis: "z" },
          ],
          targets: [
            {
              bone: "head",
              goal: bones.get("head")!.worldPosition,
              bound: radius,
            },
          ],
          centre: {
            point: Vector3.add(centre, { x: 0.012, y: 0, z: 0.012 }),
            axes: ["x", "z"],
          },
        },
      );
      const actual: Bones = shown(body, moved.posture);
      const distance: number = Vector3.length(
        Vector3.subtract(
          actual.get("head")!.worldPosition,
          bones.get("head")!.worldPosition,
        ),
      );
      const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
        resolveAutoMovieCenterOfMass(body.skeleton, body.profile),
        actual,
      );
      all.check(
        `${name} mobile point ball (${moved.reason}, ${distance} m)`,
        moved.converged && distance <= radius,
      );
      all.check(
        `${name} mobile ball preserves physical centre goal`,
        Math.abs(com.x - centre.x - 0.012) <= tolerance &&
          Math.abs(com.z - centre.z - 0.012) <= tolerance,
      );
      for (const [label, goal, feasible] of [
        ["inside", { x: 0.012, y: 0, z: 0.012 }, true],
        ["boundary", { x: radius, y: 0, z: 0 }, true],
        ["diagonal outside", { x: 0.018, y: 0, z: 0.018 }, false],
      ] as const) {
        const rigid: IAutoMovieMotionHumanBodyFitTypes.IResult =
          HumanBodyFit.fit({
            body,
            posture: entry,
            variables: [{ kind: "place", axis: "x" }],
            targets: [{ bone: "head", on: "head", goal, bound: radius }],
          });
        const actualDistance: number = Math.sqrt(
          goal.x ** 2 + goal.y ** 2 + goal.z ** 2,
        );
        all.check(
          `${name} rigid ${label} sphere (${rigid.reason}, ${rigid.residuals[0]!.point} mm)`,
          rigid.converged === feasible &&
            (rigid.converged
              ? actualDistance <= radius &&
                rigid.residuals[0]!.point <= radius * 1000
              : actualDistance > radius),
        );
      }
      all.refuses(
        `${name} a negative physical radius`,
        (): IAutoMovieMotionHumanBodyFitTypes.IResult =>
          HumanBodyFit.fit({
            body,
            posture: entry,
            targets: [
              {
                bone: "head",
                on: "head",
                goal: { x: 0, y: 0, z: 0 },
                bound: -0.01,
              },
            ],
          }),
      );
    } catch (error) {
      all.check(`${name} point-ball solve threw: ${String(error)}`, false);
    }
  }
  all.assert("bone-carried goals and physical point radii");
}

/** The externally observed goal point and orientation. */
interface IGoalFrame {
  point: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
}

/**
 * Observational leg selection keeps the complete coupled solve whenever another
 * goal's reference or clearance context prevents independent omission.
 *
 * Scenarios:
 *
 * 1. Both hands rise4cm and move forward5cm while a foot rises5cm. A
 *    reference-bearing arm requires full fallback even when only the foot is
 *    requested; both wrists and the foot still meet their actual goals.
 * 2. Selecting either wrist retains both arms and the leg. The forearms keep the
 *    actual body's two-radius separation less its existing skin allowance, and
 *    full-cold joint/seed geometry remains numerically unchanged.
 * 3. A leg-only world goal remains correctly observed when independent omission is
 *    legal; the full raw goal record is retained for its caller.
 */
function checkSelectedFallback(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const raw: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const rest: IAutoMoviePose = resolveHumanPosture(body, raw);
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    indexed(rest, body);
  const left: IAutoMovieVector3 = bones.get("leftHand")!.worldPosition;
  const right: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
  const foot: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
  const goals: IAutoMovieMotionHumanPosture["limbs"] = {
    leftArm: {
      point: { x: left.x, y: left.y + 0.04, z: left.z + 0.05 },
      bend: { ...bones.get("leftLowerArm")!.worldPosition },
      reference: HumanLimbFit.reference(rest, "leftArm"),
    },
    rightArm: {
      point: { x: right.x, y: right.y + 0.04, z: right.z + 0.05 },
      bend: { ...bones.get("rightLowerArm")!.worldPosition },
    },
    leftLeg: {
      point: { x: foot.x, y: foot.y + 0.05, z: foot.z + 0.04 },
      bend: {
        x: bones.get("leftLowerLeg")!.worldPosition.x,
        y: bones.get("leftLowerLeg")!.worldPosition.y,
        z: bones.get("leftLowerLeg")!.worldPosition.z + 0.3,
      },
    },
  };
  const posture: IAutoMovieMotionHumanPosture = { ...raw, limbs: goals };
  const full: IAutoMoviePose = resolveHumanPosture(body, posture);
  for (const name of ["leftFoot", "leftHand", "rightHand"] as const) {
    const actual: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      undefined,
      undefined,
      new Set([name]),
    ).pose;
    sameJoints(actual, full);
    const shown: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      indexed(actual, body);
    for (const [limb, bone] of [
      ["leftArm", "leftHand"],
      ["rightArm", "rightHand"],
      ["leftLeg", "leftFoot"],
    ] as const) {
      const point: IAutoMovieVector3 = shown.get(bone)!.worldPosition;
      const target: IAutoMovieVector3 = goals[limb]!.point;
      TestValidator.predicate(
        "required complete fallback retains every current physical task",
        Math.hypot(
          point.x - target.x,
          point.y - target.y,
          point.z - target.z,
        ) <= 0.001,
      );
    }
    const separation: number = closestPointsBetweenSegments(
      shown.get("leftLowerArm")!.worldPosition,
      shown.get("leftHand")!.worldPosition,
      shown.get("rightLowerArm")!.worldPosition,
      shown.get("rightHand")!.worldPosition,
    ).distance;
    TestValidator.predicate(
      "both actual forearms retain their rival-arm clearance",
      separation >= 2 * body.measure.forearmRadius - HumanVerdicts.SKIN,
    );
  }
  const independent: IAutoMovieMotionHumanPosture = {
    ...raw,
    limbs: { leftLeg: goals.leftLeg! },
  };
  const selected: IAutoMoviePose = resolveHumanPosture.seeded(
    body,
    independent,
    undefined,
    undefined,
    undefined,
    new Set(["leftFoot"]),
  ).pose;
  const current: IAutoMovieVector3 = indexed(selected, body).get(
    "leftFoot",
  )!.worldPosition;
  const target: IAutoMovieVector3 = goals.leftLeg!.point;
  TestValidator.predicate(
    "legal independent leg selection still meets its actual asked point",
    Math.hypot(
      current.x - target.x,
      current.y - target.y,
      current.z - target.z,
    ) <= 0.001 && independent.limbs.leftLeg === goals.leftLeg,
  );
}

/** Observe ordinary canonical FK with no selected-output shortcut. */
function indexed(
  pose: IAutoMoviePose,
  body: IAutoMovieMotionHumanBody,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return poseBones(body, pose);
}

/** Full-fallback contexts preserve every actual cold clinical coordinate. */
function sameJoints(actual: IAutoMoviePose, expected: IAutoMoviePose): void {
  TestValidator.predicate(
    "conservative fallback preserves the complete cold joint solve",
    actual.joints.length === expected.joints.length &&
      actual.joints.every((value: IAutoMovieJointPose, i: number): boolean => {
        const other: IAutoMovieJointPose = expected.joints[i]!;
        return (
          value.bone === other.bone &&
          same(value.flexion, other.flexion) &&
          same(value.abduction, other.abduction) &&
          same(value.twist, other.twist)
        );
      }),
  );
}

/** Preserve null rest independently from degree-valued cold parity. */
function same(a: number | null, b: number | null): boolean {
  return a === null || b === null ? a === b : nclose(a, b, 1e-7);
}
