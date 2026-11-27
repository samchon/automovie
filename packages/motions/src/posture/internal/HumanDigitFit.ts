import { AutoMovieEngineHumanoidJointAxes, AutoMovieEngineHumanoidRestFrame, AutoMovieEngineQuaternion, AutoMovieEngineRomTolerance, AutoMovieEngineVector3, AutoMovieEnginePhysics, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieFitDigitToTarget,
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePhysicalShape,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanGrip } from "../../handling/internal/HumanGrip";
import { HumanColliders } from "./HumanColliders";
import { HumanDigitReach } from "./HumanDigitReach";
import { HumanPosture } from "./HumanPosture";
import { HumanShapeFraming } from "./HumanShapeFraming";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { selectHumanDigitGoals } from "./selectHumanDigitGoals";

/*
 * A posture's digit goals fitted on a pose whose arms are already placed: each
 * digit with a goal, in `HumanPosture.DIGITS` order, brings its tip or pad to
 * its point by the engine's digit inverse kinematics (`fitDigitToTarget`), the
 * rest of the body held as the pose has it.
 *
 * The arm's goal never depends on a digit's (it places a hand frame from a
 * task, a grip socket or a palm), so fitting the digits after every limb is not
 * circular: the hand is where the arm put it and each digit reaches from there.
 * A goal on a bone (`on`) is carried into the world from the pose as fitted,
 * including any digit fitted before it, so a fingertip on the other hand's
 * thumb follows that thumb. A pad laid on a surface faces against the surface's
 * normal.
 *
 * A finger's distal joint follows its middle joint at two thirds as the fit's
 * second task, after the point (`COUPLING`); the thumb has none. A goal outside
 * a digit's workspace leaves the digit at the nearest point it reaches; the
 * residual is the audits' to report against the act's own bound. How deep a
 * hand's digits lie in the rest of the body is `depth`.
 */
export namespace HumanDigitFit {
  /*
   * The pose with every digit goal fitted.
   * Parameter body: The performer's body.
   * Parameter pose: The pose with its limbs fitted.
   * Parameter digits: The posture's digit goals.
   * Parameter source: Optional FK workspace or lazy supplier borrowed only for this
   * synchronous fit.
   * Parameter requested: Optional observational bone demand; independent unobserved
   * world digits may be omitted after ordered authored admission, while
   * unsupported/attached goals keep the full request.
   * Returns: The pose with the goals fitted; the same pose when there are none.
   */
  export function fitted(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    digits: IAutoMovieMotionHumanPosture["digits"],
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): IAutoMoviePose {
    if (digits === undefined) return pose;
    const prepared: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    if (requested !== undefined) {
      const selected: NonNullable<IAutoMovieMotionHumanPosture["digits"]> =
        selectHumanDigitGoals(body, digits, requested);
      if (selected !== digits) {
        poseBones(body, pose, prepared(), NO_BONES);
        digits = selected;
      }
    }
    let out: IAutoMoviePose = pose;
    for (const digit of HumanPosture.DIGITS) {
      const goal: IAutoMovieHumanDigitGoal | undefined = digits[digit];
      if (goal === undefined) continue;
      const workspace: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution> = prepared();
      const side: AutoMovieHumanSide = digit.startsWith("left")
        ? "left"
        : "right";
      const name: string = digit.slice(side.length);
      const Side: FittedSide = side === "left" ? "Left" : "Right";
      const region: IAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions[
          `${name.toLowerCase()}${goal.surface === "tip" ? "Tip" : "Pad"}${Side}` as AutoMovieHumanoidRegion
        ];

      // A goal on a bone is read in that bone's posed frame.
      const world: IFittedWorld =
        goal.on === undefined
          ? goal
          : carried(body, out, goal.on, goal, workspace);
      const result: IAutoMovieFitDigitToTarget.IResult = AutoMovieEngineKinematics.fitDigitToTarget({
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
          : { normal: AutoMovieEngineVector3.scale(AutoMovieEngineVector3.normalize(world.normal), -1) }),
        ...(name === "Thumb" ? {} : { coupling: COUPLING }),
        // A goal in free space is eased short near the digit's full reach,
        // where a joint's rate per millimetre has no bound; a goal on a bone
        // is a contact, which is met or it is no contact, so it is not eased.
        ...(goal.on === undefined && goal.contact !== true
          ? { rate: RATE }
          : {}),
        jointAxes: AutoMovieEngineHumanoidJointAxes,
        restFrames: AutoMovieEngineHumanoidRestFrame,
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

  /*
   * How deep a hand's digits lie in the rest of the body: the most any phalanx
   * (a capsule of the profile's radius, `HumanGrip.chain`) of that hand passes
   * into a collider of the body other than its own hand and forearm, metres;
   * zero or less when every digit is clear. The measure `stand.relaxed` hangs
   * the arm by.
   * Parameter body: The body.
   * Parameter bones: Its posed bones, world frame.
   * Parameter side: The hand; the deeper of both hands when absent.
   * Parameter placed: The body's colliders as these bones place them, when the
   * caller already holds them (a search that moves the arms alone places the
   * rest of the body once); absent, they are placed from `bones`, which must
   * then list every collider's bone. The depth is a greatest value, so their
   * order plays no part.
   * Returns: The depth, metres.
   */
  export function depth(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side?: AutoMovieHumanSide,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[] = HumanColliders.placed(
      body,
      bones,
    ),
  ): number {
    return side === undefined
      ? Math.max(
          depthAt(body, bones, placed, "left"),
          depthAt(body, bones, placed, "right"),
        )
      : depthAt(body, bones, placed, side);
  }

  /*
   * Whether either hand's finite posed phalanges penetrate a body collider.
   * Uses the same signed depth as depth(), with a strict zero boundary. A
   * positive witness decides the caller's predicate immediately.
   * Parameter body: The rig that owns both digit chains and their radii.
   * Parameter bones: Finite posed joint frames of that same body.
   * Parameter placed: Its collision shapes in the same frame, placed once when
   * omitted.
   * Returns: True if any phalanx penetrates a nearby collider from outside its
   * own hand and forearm. Tangency has zero depth.
   */
  export function penetrates(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[] = HumanColliders.placed(
      body,
      bones,
    ),
  ): boolean {
    return (
      depthAt(body, bones, placed, "left", 0) > 0 ||
      depthAt(body, bones, placed, "right", 0) > 0
    );
  }

  /*
   * Prepare the digit/body penetration predicate for a stance whose two
   * complete arms rotate rigidly about their shoulders. Digit capsule endpoints
   * and each hull stay in their original frames. Only the relative transform
   * between a hand and another shoulder or a static collider changes. A
   * numerically ambiguous contact asks its caller for the original world-space
   * predicate.
   */
  export function hanging(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    left: ReadonlySet<AutoMovieHumanoidBone>,
    right: ReadonlySet<AutoMovieHumanoidBone>,
  ):
    | ((
        shoulders: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      ) => boolean | undefined)
    | undefined {
    const hands: IHangingHand[] = [];
    for (const side of ["left", "right"] as const) {
      const carried: ReadonlySet<AutoMovieHumanoidBone> =
        side === "left" ? left : right;
      const joint: AutoMovieHumanoidBone = `${side}UpperArm`;
      if (!carried.has(`${side}Hand`)) return undefined;
      const digits: IHangingDigit[] = [];
      for (const digit of DIGIT_NAMES) {
        const chain: IAutoMovieCurlChainUntilContact.IChain = HumanGrip.chain(
          body,
          side,
          digit,
        );
        if (
          !chain.bones.every((bone: AutoMovieHumanoidBone): boolean =>
            carried.has(bone),
          )
        )
          return undefined;
        digits.push({ points: phalanges(bones, chain), radius: chain.radius });
      }
      const shapes: IHangingShape[] = [];
      for (const collider of placed) {
        if (
          collider.bone.startsWith(side) &&
          (OWN.test(collider.bone.slice(side.length)) ||
            collider.bone === `${side}LowerArm`)
        )
          continue;
        for (const shape of collider.shapes) {
          const sphere: ReturnType<typeof HumanShapeFraming.sphere> =
            HumanShapeFraming.sphere(collider.pose, shape);
          shapes.push({
            shape,
            pose: collider.pose,
            sphere,
            carrier: left.has(collider.bone)
              ? 0
              : right.has(collider.bone)
                ? 1
                : -1,
          });
        }
      }
      hands.push({
        shoulder: bones.get(joint)!,
        hand: bones.get(`${side}Hand`)!.worldPosition,
        digits,
        shapes,
      });
    }
    return (
      shoulders: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): boolean | undefined => {
      for (const hand of hands) {
        const before: IAutoMovieVector3 = hand.shoulder.worldPosition;
        const after: IAutoMovieVector3 | undefined = shoulders.get(
          hand.shoulder.bone,
        )?.worldPosition;
        if (
          after === undefined ||
          !Object.is(before.x, after.x) ||
          !Object.is(before.y, after.y) ||
          !Object.is(before.z, after.z)
        )
          return undefined;
      }
      const turns: IAutoMovieQuaternion[] = hands.map(
        (hand: IHangingHand): IAutoMovieQuaternion =>
          AutoMovieEngineQuaternion.multiply(
            shoulders.get(hand.shoulder.bone)!.worldRotation,
            AutoMovieEngineQuaternion.inverse(hand.shoulder.worldRotation),
          ),
      );
      for (const [index, hand] of hands.entries()) {
        const back: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(turns[index]!);
        const origin: IAutoMovieVector3 = hand.shoulder.worldPosition;
        for (const item of hand.shapes) {
          const point: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
            p: IAutoMovieVector3,
          ): IAutoMovieVector3 => {
            if (item.carrier === index) return p;
            const moved: IAutoMovieVector3 =
              item.carrier < 0
                ? p
                : about(
                    p,
                    hands[item.carrier]!.shoulder.worldPosition,
                    turns[item.carrier]!,
                  );
            return about(moved, origin, back);
          };
          const centre: IAutoMovieVector3 = point(item.sphere.centre);
          const distance: number = AutoMovieEngineVector3.distance(centre, hand.hand);
          const reach: number = item.sphere.radius + body.measure.hand;
          // A shoulder bin of the original bisection moves a point at radius r
          // by at most 2 r sin(bin/2). Resolve that entire contact neighbourhood
          // with the original world predicate, including frames too distant to
          // represent one such displacement at the running world coordinates.
          const radius: number =
            AutoMovieEngineVector3.distance(hand.hand, origin) + body.measure.hand;
          const roundoff: number =
            2 * radius * Math.sin((AutoMovieEngineRomTolerance * Math.PI) / 360);
          if (
            !(
              roundoff >
              Number.EPSILON *
                Math.max(AutoMovieEngineVector3.length(origin), AutoMovieEngineVector3.length(centre))
            )
          )
            return undefined;
          if (Math.abs(distance - reach) <= roundoff) return undefined;
          if (distance >= reach) continue;
          const pose: IAutoMovieRigidTransform =
            item.carrier === index
              ? item.pose
              : {
                  position: point(item.pose.position),
                  rotation: AutoMovieEngineQuaternion.multiply(
                    back,
                    item.carrier < 0
                      ? item.pose.rotation
                      : AutoMovieEngineQuaternion.multiply(
                          turns[item.carrier]!,
                          item.pose.rotation,
                        ),
                  ),
                };
          const segmentDistance: ReturnType<
            typeof AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance
          > = AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance(pose, item.shape);
          for (const digit of hand.digits)
            for (let i: number = 1; i < digit.points.length; ++i) {
              const depth: number =
                digit.radius -
                segmentDistance(digit.points[i - 1]!, digit.points[i]!);
              if (Math.abs(depth) <= roundoff)
                return undefined;
              if (depth > 0) return true;
            }
        }
      }
      return false;
    };
  }
  /*
   * The joints of a digit, proximal to distal.
   * Parameter side: The hand.
   * Parameter name: The digit, capitalised as the rig spells it.
   * Returns: The bones.
   */
  export function bones(
    side: AutoMovieHumanSide,
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

/*
 * The record of `IFittedWorld`'s site.
 */
type IFittedWorld = { point: IAutoMovieVector3; normal?: IAutoMovieVector3 };

/*
 * The alternatives of `FittedSide`'s site.
 */
type FittedSide = "Left" | "Right";

/*
 * The distal interphalangeal joint's flexion as a share of the proximal one's:
 * the coupling of hand animation, DIP = 2/3 PIP (Rijpkema and Girard 1991,
 * SIGGRAPH 25(4):339-348, as relayed by the hand-animation literature).
 * Provisional until read at the source.
 */
const COUPLING: number = 2 / 3;

/*
 * The radial extension rate soft IK is derived for, degrees per metre: 5
 * degrees per millimetre, third acceptance line (`fitDigitToTarget`'s `rate`).
 * The target is eased only near full extension, with the distance traded away
 * left in the residual; a goal on a bone, a contact, is not eased.
 */
const RATE: number = 5000;

/*
 * Ordered clinical admission with no unobserved output frames or numerical
 * digit solve.
 */
const NO_BONES: ReadonlySet<AutoMovieHumanoidBone> = new Set();

const DIGIT_NAMES: typeof HumanDigitReach.DIGIT_NAMES =
  HumanDigitReach.DIGIT_NAMES;
const OWN: typeof HumanDigitReach.OWN = HumanDigitReach.OWN;
const depthAt: typeof HumanDigitReach.depthAt = HumanDigitReach.depthAt;
const phalanges: typeof HumanDigitReach.phalanges = HumanDigitReach.phalanges;
const carried: typeof HumanDigitReach.carried = HumanDigitReach.carried;

/*
 * A hand and its original posed digit capsules under the standing shoulder.
 */
interface IHangingHand {
  shoulder: IAutoMovieResolvedBone;
  hand: IAutoMovieVector3;
  digits: IHangingDigit[];
  shapes: IHangingShape[];
}

/*
 * World-metre centres of successive phalanges and their capsule radius.
 */
interface IHangingDigit {
  points: readonly IAutoMovieVector3[];
  radius: number;
}

/*
 * A body's placed shape and its carrying shoulder index, or -1 for the fixed
 * trunk.
 */
interface IHangingShape {
  shape: IAutoMoviePhysicalShape;
  pose: IAutoMovieRigidTransform;
  sphere: ReturnType<typeof HumanShapeFraming.sphere>;
  carrier: number;
}

/*
 * Rotate a world point about an unchanged world origin.
 */
function about(
  point: IAutoMovieVector3,
  origin: IAutoMovieVector3,
  turn: IAutoMovieQuaternion,
): IAutoMovieVector3 {
  return AutoMovieEngineVector3.add(
    origin,
    AutoMovieEngineQuaternion.rotateVector(turn, AutoMovieEngineVector3.subtract(point, origin)),
  );
}
