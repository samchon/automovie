import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  curlChainUntilContact,
  fitDigitToTarget,
  physicalShapeSegmentDistance,
  type preparePoseResolution,
  type resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieJointPose,
  IAutoMoviePhysicalProfile,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanGrip } from "../handling/HumanGrip";
import { HumanColliders } from "./HumanColliders";
import { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { selectHumanDigitGoals } from "./selectHumanDigitGoals";

/**
 * A posture's digit goals fitted on a pose whose arms are already placed:
 * each digit with a goal, in `IHumanPosture.DIGITS` order, brings its tip or
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
   * @param source Optional FK workspace or lazy supplier borrowed only for this synchronous fit.
   * @param requested Optional observational bone demand; independent unobserved world digits may be omitted after ordered authored admission, while unsupported/attached goals keep the full request.
   * @returns The pose with the goals fitted; the same pose when there are none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the order and the unchanged case.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's digit fit on the canonical forward kinematics (the same axes and rest frames as the display), after the limbs, as procedural animation runs finger IK on the placed hand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the digits with goals, one fit each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Full resolution retains every goal and residual. Explicit observational demand omits only independent world goals that cannot change a requested ancestor frame; malformed/attached/unsupported context keeps full fitting and all authored records still enter ordered FK admission before omission.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each retained digit requests only effector ancestry per candidate. Explicit demand can omit independent unobserved digits after one ordered authored admission with empty output demand; selector parent metadata is O(B) and no requested digit solver is weakened. Full default remains unchanged, with unmeasured speedup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One lazy operation reader is borrowed by carried targets and every digit fit together with the body's canonical immutable rig snapshot; actual poses and exact scalar dependencies are reread, with no cached goal or result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader is created only at the first actual goal and releases with this synchronous call; a parent's supplier and reader never enter the returned pose.
   */
  export function fitted(
    body: IHumanBody,
    pose: IAutoMoviePose,
    digits: IHumanPosture["digits"],
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): IAutoMoviePose {
    if (digits === undefined) return pose;
    const prepared: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
    if (requested !== undefined) {
      const selected: NonNullable<IHumanPosture["digits"]> = selectHumanDigitGoals(body, digits, requested);
      if (selected !== digits) {
        poseBones(body, pose, prepared(), NO_BONES);
        digits = selected;
      }
    }
    let out: IAutoMoviePose = pose;
    for (const digit of IHumanPosture.DIGITS) {
      const goal: IHumanPosture.IDigitGoal | undefined = digits[digit];
      if (goal === undefined) continue;
      const workspace: ReturnType<typeof preparePoseResolution> = prepared();
      const side: "left" | "right" = digit.startsWith("left")
        ? "left"
        : "right";
      const name: string = digit.slice(side.length);
      const Side: "Left" | "Right" = side === "left" ? "Left" : "Right";
      const region: resolveAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions[
          `${name.toLowerCase()}${goal.surface === "tip" ? "Tip" : "Pad"}${Side}` as AutoMovieHumanoidRegion
        ];

      // A goal on a bone is read in that bone's posed frame.
      const world: { point: IAutoMovieVector3; normal?: IAutoMovieVector3 } =
        goal.on === undefined ? goal : carried(body, out, goal.on, goal, workspace);
      const result: fitDigitToTarget.IResult = fitDigitToTarget({
        skeleton: body.skeleton,
        pose: out,
        topology: body.topology,
        prepared: workspace,
        rig: body.poseResolution,
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
   * @param side The hand; the deeper of both hands when absent.
   * @returns The depth, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measure, its unit, its sign and who reads it.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's exact segment-to-shape distance (`physicalShapeSegmentDistance`) from each phalanx's axis, less the phalanx's radius, against the body's own profile colliders.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One collider placement, then each requested hand's near colliders and three segments per digit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every digit and every near collider is read; none is skipped but those beyond a hand's length of the hand.
   * @evidence contracts/development/implementation.md#efficient-algorithms Both hands share the same posed collider records; bounds cull distant shapes, and direct segment loops allocate no per-collider slices or callbacks.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The optional paired query reuses only one placement of the same supplied bones within this call.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function depth(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side?: "left" | "right",
  ): number {
    const placed: HumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
    return side === undefined
      ? Math.max(depthAt(body, bones, placed, "left"), depthAt(body, bones, placed, "right"))
      : depthAt(body, bones, placed, side);
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
const DIGIT_NAMES: readonly HumanGrip.Digit[] = [
  "Thumb",
  "Index",
  "Middle",
  "Ring",
  "Little",
];

/** The bones of a side's own hand, after the side: the hand and its digits. */
const OWN: RegExp = /^(Hand|Thumb|Index|Middle|Ring|Little)/;

/** Ordered clinical admission with no unobserved output frames or numerical digit solve. */
const NO_BONES: ReadonlySet<AutoMovieHumanoidBone> = new Set();

/** One hand's unchanged phalanx-depth reduction over a caller-owned body placement. */
function depthAt(body: IHumanBody, bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>, placed: readonly HumanColliders.IPlaced[], side: "left" | "right"): number {
  const near: curlChainUntilContact.ICollider[] = nearBody(body, bones, placed, side);
  let deepest: number = -Infinity;
  for (const digit of DIGIT_NAMES) {
    const chain: curlChainUntilContact.IChain = HumanGrip.chain(body, side, digit);
    const points: IAutoMovieVector3[] = phalanges(bones, chain);
    for (const collider of near)
      for (let i: number = 1; i < points.length; i++)
        deepest = Math.max(deepest, chain.radius - physicalShapeSegmentDistance(
          collider.frame, collider.shape, points[i - 1]!, points[i]!,
        ));
  }
  return deepest;
}

/** The body's colliders near a hand, in the world: every shape but its own hand's and forearm's whose bounding sphere lies within a hand's length of the hand. */
const nearBody: (
  body: IHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  placed: readonly HumanColliders.IPlaced[],
  side: "left" | "right",
) => curlChainUntilContact.ICollider[] = (
  body: IHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  placed: readonly HumanColliders.IPlaced[],
  side: "left" | "right",
): curlChainUntilContact.ICollider[] => {
  const hand: IAutoMovieVector3 = bones.get(`${side}Hand`)!.worldPosition;
  return placed
    .filter(
      (p: HumanColliders.IPlaced): boolean =>
        !p.bone.startsWith(side) ||
        !(OWN.test(p.bone.slice(side.length)) || p.bone === `${side}LowerArm`),
    )
    .flatMap((p: HumanColliders.IPlaced): curlChainUntilContact.ICollider[] =>
      p.shapes
        .filter((shape: IAutoMoviePhysicalProfile.IShape): boolean => {
          const ball: HumanColliders.IBall = HumanColliders.bound(shape);
          const centre: IAutoMovieVector3 = Vector3.add(
            p.pose.position,
            Quaternion.rotateVector(
              p.pose.rotation,
              Vector3.add(
                shape.transform.position,
                Quaternion.rotateVector(shape.transform.rotation, ball.centre),
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
            shape: IAutoMoviePhysicalProfile.IShape,
          ): curlChainUntilContact.ICollider => ({ shape, frame: p.pose }),
        ),
    );
};

/** A digit's phalanges as the points of its joints and its tip, world metres, on posed bones. */
const phalanges: (
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  chain: curlChainUntilContact.IChain,
) => IAutoMovieVector3[] = (
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  chain: curlChainUntilContact.IChain,
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
  body: IHumanBody,
  pose: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
  goal: IHumanPosture.IDigitGoal,
  prepared: ReturnType<typeof preparePoseResolution>,
) => { point: IAutoMovieVector3; normal?: IAutoMovieVector3 } = (
  body: IHumanBody,
  pose: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
  goal: IHumanPosture.IDigitGoal,
  prepared: ReturnType<typeof preparePoseResolution>,
): { point: IAutoMovieVector3; normal?: IAutoMovieVector3 } => {
  const placed: IAutoMovieResolvedBone = poseBones(
    body,
    pose,
    prepared,
    new Set([bone]),
  ).get(bone)!;
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
