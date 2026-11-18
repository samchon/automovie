import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The legs of a body seated on the floor with them folded: crossed in
 * front of it (tailor sitting), or both folded to its right with the
 * knees to its left and a hand on the floor at its left (side sitting).
 *
 * A folded leg is not a set of joint angles here but a place for its
 * ankle on the floor and a point its knee bends toward, which the leg
 * solve meets inside the hip's range: the thigh spreads by turning out as
 * it flexes. Places are in the pelvis's own frame on the floor, from the
 * point under the middle of the hip joints, in thigh lengths (`CROSSED`,
 * `SIDE`, all provisional: no measured foot placement of floor sitting was
 * read; Hemmerich et al. 2006, J Orthop Res 24:770, measure the knee of
 * cross-legged sitting near 130 to 150 degrees of flexion, which these
 * places give a leg of equal thigh and shank).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two sittings, why they are goals and not angles, the frame, the unit and that the shares are provisional.
 * @evidence contracts/development/design.md#principled-representation Ankle places and knee points in the pelvis's floor frame, scaled by the body's thigh, handed to the posture's limb goals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Raw placement and fixed-body/kind preparation share the same two authored tables and current-placement owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body is special-cased; every share is named and marked provisional.
 */
export namespace floorSeat {
  /** A folded sitting. */
  export type Kind = "crossed" | "side";

  /** A place in the pelvis's floor frame, from the floor point under the middle of the hip joints: to the body's left, up and ahead, thigh lengths. */
  export interface IPlace {
    /** To the body's left; negative to its right. */
    left: number;

    /** Above the floor. */
    up: number;

    /** Ahead of the hip joints. */
    ahead: number;
  }

  /** Tailor sitting, by leg: each ankle on the floor past the other hip, the left shank in front of the right, each knee out, ahead and a little up (provisional). */
  export const CROSSED: Readonly<
    Record<"left" | "right", { ankle: IPlace; knee: IPlace }>
  > = {
    left: {
      ankle: { left: -0.55, up: 0, ahead: 0.45 },
      knee: { left: 1.1, up: 0.35, ahead: 0.9 },
    },
    right: {
      ankle: { left: 0.55, up: 0, ahead: 0.25 },
      knee: { left: -1.1, up: 0.35, ahead: 0.9 },
    },
  };

  /** Side sitting, by leg: both ankles to the right, the left one ahead of the right hip and the right one out beside it, both knees ahead and to the left, low (provisional). */
  export const SIDE: Readonly<
    Record<"left" | "right", { ankle: IPlace; knee: IPlace }>
  > = {
    left: {
      ankle: { left: -0.3, up: 0, ahead: 0.4 },
      knee: { left: 1.2, up: 0.1, ahead: 0.8 },
    },
    right: {
      ankle: { left: -0.9, up: 0, ahead: -0.1 },
      knee: { left: 0.4, up: 0.1, ahead: 1 },
    },
  };

  /** The share of the arm's length, shoulder to wrist, at which the supporting hand of side sitting is set down: nearly straight, as an arm leant on is (provisional). */
  export const REACH: number = 0.95;

  /** The height of a folded leg's ankle joint over the floor, in standing ankle heights: the foot lies on its side, so the joint is about half the ankle's breadth up (provisional). */
  export const ANKLE: number = 0.5;

  /**
   * A posture's legs moved a share of the way from where its joints hold
   * them to a folded sitting, and for side sitting its left hand to the
   * floor.
   *
   * @param body The body.
   * @param posture The posture, its root placed and its legs set by joints.
   * @param kind The sitting.
   * @param share 0 where the joints hold the legs to 1 folded.
   * @param resolution Optional exact FK source borrowed only during this current placement.
   * @param projection Optional genuine same-body ROM metadata from the current query.
   * @returns The posture with the leg goals, and the hand's for side sitting; the posture itself at no share. The hand bears (`planted`) once it is down.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves, from where to where, and when the hand bears.
   * @evidence contracts/development/implementation.md#principled-implementation Each ankle and each knee's bend point travel a straight line from where the posture's own joints put them, so the legs are continuous with the joint posture at no share, to places on the floor the leg solve then meets inside the joints' ranges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward-kinematics pass, one frame, one pass over the legs and the hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A place out of a leg's reach is not checked here: the limb fit leaves the ankle short of it, which the contact audit reports.
   * @evidence contracts/development/implementation.md#efficient-algorithms The canonical solve remains; its FK requests only hips, knees and ankles, plus the left arm when side sitting needs its supporting hand.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows a synchronous parent FK/ROM source for actual complete current direct-joint/digit admission and final demanded frames; only raw limb goals are cleared as before, and no posed answer is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local reader and current bones end on return or throw, without entering the returned authored goals or retaining either parent loan.
   */
  export function place(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    kind: Kind,
    share: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    if (share <= 0) return posture;
    return prepare(body, kind)(posture, share, resolution, projection);
  }

  /**
   * Prepare a fixed body's folded-sitting targets and actual FK demand.
   * Each changing posture still supplies its own hips, limbs and heading.
   *
   * @param body The unchanged body/rest/surface geometry of this floor plan.
   * @param kind The unchanged authored crossed or side sitting.
   * @returns A current posture/share writer with optional nonescaping same-query FK/ROM loans; nonpositive share returns its input unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/kind provenance, current posture/share/heading, nonpositive identity branch, original world-metre goals and optional current-query metadata lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation The same native complete limb-cleared joint/digit solve supplies actual hip/knee/ankle frames and the supporting arm when required. The original table shares scale by the body's thigh into floor-frame targets; actual current hip midpoint/yaw then place every target before the same leg/hand interpolation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed table scaling and native FK name preparation precede one current-placement reader. A single current HumanFrame preparation serves all leg targets and side-hand directions; raw place delegates this owner after its original zero-share guard.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original share clamp, complete current direct/digit admission, raw limb clearing, arm reach formula, native hand rotation/Bend hint, goals and planted threshold. No achieved pose, endpoint shortcut, contact or tolerance is prepared.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed table products and FK name indexing prepare once across Q writes; each active write retains its complete current solve, demanded ancestor frames and actual goal construction. One yaw sine/cosine pair serves all original same-frame transforms instead of rebuilding them per target/direction; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged body measures, rig and sitting table establish static target/name equivalence. Every root, joint, goal, hip midpoint, current yaw, limb interpolation and supporting-arm reach remains evaluated; optional parent FK/ROM sources share only native checked prerequisites.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning plan retains four fixed local target vectors and one bounded name reader until release. Current frame/pose/map and borrowed FK/ROM end with each write; fresh goals retain neither reader nor prior-query data.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    kind: Kind,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    share: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanPosture {
    const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      kind === "side" ? SIDE_BONES : LEG_BONES,
    );
    const table: Readonly<
      Record<"left" | "right", { ankle: IPlace; knee: IPlace }>
    > = kind === "crossed" ? CROSSED : SIDE;
    const local: (point: IPlace, up: number) => IAutoMovieVector3 = (
      point: IPlace,
      up: number,
    ): IAutoMovieVector3 => ({
      x: point.left * body.measure.thigh,
      y: point.up * body.measure.thigh + up,
      z: point.ahead * body.measure.thigh,
    });
    const targets: Record<
      "left" | "right",
      { ankle: IAutoMovieVector3; knee: IAutoMovieVector3 }
    > = {
      left: {
        ankle: local(table.left.ankle, ANKLE * body.measure.ankleHeight),
        knee: local(table.left.knee, 0),
      },
      right: {
        ankle: local(table.right.ankle, ANKLE * body.measure.ankleHeight),
        knee: local(table.right.knee, 0),
      },
    };
    return (
      posture: IAutoMovieMotionHumanPosture,
      share: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => {
      if (share <= 0) return posture;
      const s: number = Math.min(1, share);
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = frames(
        resolveHumanPosture.seeded(
          body,
          { ...posture, limbs: {} },
          undefined,
          undefined,
          read,
          undefined,
          projection,
        ).pose,
        read(),
      );
      const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
        bones.get(bone)!.worldPosition;
      const hips: Record<"left" | "right", IAutoMovieVector3> = {
        left: at("leftUpperLeg"),
        right: at("rightUpperLeg"),
      };
      const frame: IAutoMovieMotionHumanFrame = {
        origin: {
          x: (hips.left.x + hips.right.x) / 2,
          y: 0,
          z: (hips.left.z + hips.right.z) / 2,
        },
        yaw: posture.yaw,
      };
      const floor: ReturnType<typeof HumanFrame.prepare> =
        HumanFrame.prepare(frame);
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      for (const side of ["left", "right"] as const)
        limbs[`${side}Leg`] = {
          point: Vector3.lerp(
            at(`${side}Foot`),
            floor.point(targets[side].ankle),
            s,
          ),
          bend: Vector3.lerp(
            at(`${side}LowerLeg`),
            floor.point(targets[side].knee),
            s,
          ),
        };
      if (kind === "side") {
        const hand: IAutoMovieResolvedBone = bones.get("leftHand")!;
        // The hand goes down beside the body where the arm, `REACH` of its length out, meets the floor from the shoulder; straight under the shoulder when even that is short.
        const shoulder: IAutoMovieVector3 = at("leftUpperArm");
        const arm: number =
          Vector3.length(Vector3.subtract(at("leftLowerArm"), shoulder)) +
          Vector3.length(
            Vector3.subtract(hand.worldPosition, at("leftLowerArm")),
          );
        const wrist: number = 0.2 * body.measure.hand;
        const out: number = Math.sqrt(
          Math.max(0, (REACH * arm) ** 2 - (shoulder.y - wrist) ** 2),
        );
        const aside: IAutoMovieVector3 = floor.direction({
          x: out,
          y: 0,
          z: 0,
        });
        limbs.leftArm = {
          point: Vector3.lerp(
            hand.worldPosition,
            { x: shoulder.x + aside.x, y: wrist, z: shoulder.z + aside.z },
            s,
          ),
          rotation: Quaternion.slerp(
            hand.worldRotation,
            HumanHand.rotation("left", {
              fingers: floor.direction({ x: 1, y: 0, z: 0 }),
              palm: { x: 0, y: -1, z: 0 },
            }),
            s,
          ),
          bend: AutoMovieMotionHumanBend.hang(body, posture, "left", 0.2),
          planted: s >= 1,
        };
      }
      return { ...posture, limbs };
    };
  }

  /** Joint-space origins needed by both folded-leg placements. */
  const LEG_BONES: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftUpperLeg",
    "rightUpperLeg",
    "leftLowerLeg",
    "rightLowerLeg",
    "leftFoot",
    "rightFoot",
  ]);

  /** Side sitting also measures its supporting shoulder, elbow and wrist. */
  const SIDE_BONES: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    ...LEG_BONES,
    "leftUpperArm",
    "leftLowerArm",
    "leftHand",
  ]);
}
