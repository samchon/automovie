import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  fitDigitToTarget,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieFitDigitToTarget,
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanGrip,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePhysicalShape,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanGrip } from "../handling/HumanGrip";
import { HumanColliders } from "./HumanColliders";
import { HumanPosture } from "./HumanPosture";
import { poseBones } from "./poseBones";

/**
 * A posture's digit goals fitted on a pose whose arms are already placed:
 * each digit with a goal, in `HumanPosture.DIGITS` order, brings its tip or
 * pad to its point by the engine's digit inverse kinematics
 * (`fitDigitToTarget`), the rest of the body held as the pose has it.
 *
 * The arm's goal never depends on a digit's (it places a hand frame from a
 * task, a grip socket or a palm), so fitting the digits after every limb is
 * not circular: the hand is where the arm put it and each digit reaches
 * from there. A goal on a bone (`on`) is carried into the world from the
 * pose as fitted, including any digit fitted before it, so a fingertip on
 * the other hand's thumb follows that thumb. A pad laid on a surface faces
 * against the surface's normal.
 *
 * A finger's distal joint follows its middle joint at two thirds as the
 * fit's second task, after the point (`COUPLING`); the thumb has none. A goal
 * outside a digit's workspace leaves the digit at the nearest point it
 * reaches; the residual is the audits' to report against the act's own bound.
 * How deep a hand's digits lie in the rest of the body is `depth`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order, why it is not circular, the frames, the facing, the coupling and the out-of-reach behaviour.
 * @evidence contracts/development/design.md#principled-representation Functions of a body, a pose and the posture's digit goals, over the interface's poses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The fit `resolveHumanPosture` calls and the digit's joints it and the laws read; the solver is the engine's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No digit is special but the thumb's joint names and its lack of coupling, both the rig's anatomy.
 */
export namespace HumanDigitFit {
  /**
   * The pose with every digit goal fitted.
   *
   * @param body The performer's body.
   * @param pose The pose with its limbs fitted.
   * @param digits The posture's digit goals.
   * @returns The pose with the goals fitted; the same pose when there are none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the order and the unchanged case.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's digit fit on the canonical forward kinematics (the same axes and rest frames as the display), after the limbs, as procedural animation runs finger IK on the placed hand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the digits with goals, one fit each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No residual is hidden: an unreached goal is left for the audits.
   * @evidence contracts/development/implementation.md#efficient-algorithms One engine fit per digit with a goal, each a bounded number of forward kinematics; nothing for a posture without digit goals.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input; the performance's caches hold the pose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function fitted(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    digits: IAutoMovieMotionHumanPosture["digits"],
  ): IAutoMoviePose {
    if (digits === undefined) return pose;
    let out: IAutoMoviePose = pose;
    for (const digit of HumanPosture.DIGITS) {
      const goal: IAutoMovieHumanDigitGoal | undefined = digits[digit];
      if (goal === undefined) continue;
      const side: "left" | "right" = digit.startsWith("left")
        ? "left"
        : "right";
      const name: string = digit.slice(side.length);
      const Side: "Left" | "Right" = side === "left" ? "Left" : "Right";
      const region: IAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions[
          `${name.toLowerCase()}${goal.surface === "tip" ? "Tip" : "Pad"}${Side}` as AutoMovieHumanoidRegion
        ];

      // A goal on a bone is read in that bone's posed frame.
      const world: { point: IAutoMovieVector3; normal?: IAutoMovieVector3 } =
        goal.on === undefined ? goal : carried(body, out, goal.on, goal);
      const result: IAutoMovieFitDigitToTarget.IResult = fitDigitToTarget({
        skeleton: body.skeleton,
        pose: out,
        bones: bones(side, name),
        effector: {
          bone: region.bone,
          point: region.point,
          normal: region.normal,
        },
        target: world.point,
        ...(world.normal === undefined
          ? {}
          : { normal: Vector3.scale(Vector3.normalize(world.normal), -1) }),
        ...(name === "Thumb" ? {} : { coupling: COUPLING }),
        rate: RATE,
        jointAxes: HUMANOID_JOINT_AXES,
        restFrames: HUMANOID_REST_FRAME,
      });
      const fitted: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose> =
        new Map(
          result.joints.map(
            (
              j: IAutoMovieJointPose,
            ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j],
          ),
        );
      out = {
        ...out,
        joints: out.joints.map(
          (j: IAutoMovieJointPose): IAutoMovieJointPose =>
            fitted.get(j.bone) ?? j,
        ),
      };
    }
    return out;
  }

  /**
   * How deep a hand's digits lie in the rest of the body: the most any
   * phalanx (a capsule of the profile's radius, `HumanGrip.chain`) of that
   * hand passes into a collider of the body other than its own hand and
   * forearm, metres; zero or less when every digit is clear. The measure
   * `stand.relaxed` hangs the arm by.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @param side The hand.
   * @returns The depth, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measure, its unit, its sign and who reads it.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's exact segment-to-shape distance (`physicalShapeSegmentDistance`) from each phalanx's axis, less the phalanx's radius, against the body's own profile colliders.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The near colliders, then three segments per digit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every digit and every near collider is read; none is skipped but those beyond a hand's length of the hand.
   * @evidence contracts/development/implementation.md#efficient-algorithms Colliders whose bounding sphere lies beyond a hand's length of the hand are skipped.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function depth(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: "left" | "right",
  ): number {
    const near: IAutoMovieCurlChainUntilContact.ICollider[] = nearBody(
      body,
      bones,
      HumanColliders.placed(body, bones),
      side,
    );
    let deepest: number = -Infinity;
    for (const digit of DIGIT_NAMES) {
      const chain: IAutoMovieCurlChainUntilContact.IChain = HumanGrip.chain(
        body,
        side,
        digit,
      );
      const points: IAutoMovieVector3[] = phalanges(bones, chain);
      for (const c of near)
        points.slice(1).forEach((b: IAutoMovieVector3, i: number): void => {
          deepest = Math.max(
            deepest,
            chain.radius -
              physicalShapeSegmentDistance(c.frame, c.shape, points[i]!, b),
          );
        });
    }
    return deepest;
  }

  /**
   * The joints of a digit, proximal to distal.
   *
   * @param side The hand.
   * @param name The digit, capitalised as the rig spells it.
   * @returns The bones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order and the spelling.
   * @evidence contracts/development/implementation.md#principled-implementation The rig's bone names: a finger's three phalanges, the thumb's metacarpal and two phalanges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One table choice and one map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bones(
    side: "left" | "right",
    name: string,
  ): AutoMovieHumanoidBone[] {
    const segments: readonly string[] =
      name === "Thumb"
        ? ["Metacarpal", "Proximal", "Distal"]
        : ["Proximal", "Intermediate", "Distal"];
    return segments.map(
      (s: string): AutoMovieHumanoidBone =>
        `${side}${name}${s}` as AutoMovieHumanoidBone,
    );
  }
}

/**
 * The distal interphalangeal joint's flexion as a share of the proximal
 * one's: the coupling of hand animation, DIP = 2/3 PIP (Rijpkema and Girard
 * 1991, SIGGRAPH 25(4):339-348, as relayed by the hand-animation literature).
 * Provisional until read at the source.
 */
const COUPLING: number = 2 / 3;

/** The radial extension rate soft IK is derived for, degrees per metre: 5 degrees per millimetre, #3444's third acceptance line (`fitDigitToTarget`'s `rate`). The target is eased only near full extension, with the distance traded away left in the residual. */
const RATE: number = 5000;
/** A hand's digits as the rig names them, thumb first. */
const DIGIT_NAMES: readonly IAutoMovieMotionHumanGrip.Digit[] = [
  "Thumb",
  "Index",
  "Middle",
  "Ring",
  "Little",
];

/** The bones of a side's own hand, after the side: the hand and its digits. */
const OWN: RegExp = /^(Hand|Thumb|Index|Middle|Ring|Little)/;

/** The body's colliders near a hand, in the world: every shape but its own hand's and forearm's whose bounding sphere lies within a hand's length of the hand. */
const nearBody: (
  body: IAutoMovieMotionHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  side: "left" | "right",
) => IAutoMovieCurlChainUntilContact.ICollider[] = (
  body: IAutoMovieMotionHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  side: "left" | "right",
): IAutoMovieCurlChainUntilContact.ICollider[] => {
  const hand: IAutoMovieVector3 = bones.get(`${side}Hand`)!.worldPosition;
  return placed
    .filter(
      (p: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
        !p.bone.startsWith(side) ||
        !(OWN.test(p.bone.slice(side.length)) || p.bone === `${side}LowerArm`),
    )
    .flatMap(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
      ): IAutoMovieCurlChainUntilContact.ICollider[] =>
        p.shapes
          .filter((shape: IAutoMoviePhysicalShape): boolean => {
            const ball: IAutoMovieMotionHumanColliders.IBall =
              HumanColliders.bound(shape);
            const centre: IAutoMovieVector3 = Vector3.add(
              p.pose.position,
              Quaternion.rotateVector(
                p.pose.rotation,
                Vector3.add(
                  shape.transform.position,
                  Quaternion.rotateVector(
                    shape.transform.rotation,
                    ball.centre,
                  ),
                ),
              ),
            );
            return (
              Vector3.length(Vector3.subtract(centre, hand)) <
              ball.radius + body.measure.hand
            );
          })
          .map(
            (
              shape: IAutoMoviePhysicalShape,
            ): IAutoMovieCurlChainUntilContact.ICollider => ({
              shape,
              frame: p.pose,
            }),
          ),
    );
};

/** A digit's phalanges as the points of its joints and its tip, world metres, on posed bones. */
const phalanges: (
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  chain: IAutoMovieCurlChainUntilContact.IChain,
) => IAutoMovieVector3[] = (
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  chain: IAutoMovieCurlChainUntilContact.IChain,
): IAutoMovieVector3[] => {
  const points: IAutoMovieVector3[] = chain.bones.map(
    (b: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      bones.get(b)!.worldPosition,
  );
  const last: IAutoMovieResolvedBone = bones.get(chain.bones.at(-1)!)!;
  points.push(
    Vector3.add(
      last.worldPosition,
      Quaternion.rotateVector(last.worldRotation, chain.tip),
    ),
  );
  return points;
};

/** A goal's point and normal carried from a bone's posed frame into the world. */
const carried: (
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
  goal: IAutoMovieHumanDigitGoal,
) => { point: IAutoMovieVector3; normal?: IAutoMovieVector3 } = (
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
  goal: IAutoMovieHumanDigitGoal,
): { point: IAutoMovieVector3; normal?: IAutoMovieVector3 } => {
  const placed: IAutoMovieResolvedBone = poseBones(body, pose).get(bone)!;
  return {
    point: Vector3.add(
      placed.worldPosition,
      Quaternion.rotateVector(placed.worldRotation, goal.point),
    ),
    ...(goal.normal === undefined
      ? {}
      : {
          normal: Quaternion.rotateVector(placed.worldRotation, goal.normal),
        }),
  };
};
