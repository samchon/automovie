import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/** The record of `IPrepareTargetsEntry`'s site. */
type IPrepareTargetsEntry = {
  ankle: IAutoMovieVector3;
  knee: IAutoMovieVector3;
};

/**
 * The legs of a body seated on the floor with them folded: crossed in front of
 * it (tailor sitting), or both folded to its right with the knees to its left
 * and a hand on the floor at its left (side sitting).
 *
 * A folded leg is not a set of joint angles here but a place for its ankle on
 * the floor and a point its knee bends toward, which the leg solve meets inside
 * the hip's range: the thigh spreads by turning out as it flexes. Places are in
 * the pelvis's own frame on the floor, from the point under the middle of the
 * hip joints, in thigh lengths (`CROSSED`, `SIDE`, all provisional: no measured
 * foot placement of floor sitting was read; Hemmerich et al. 2006, J Orthop Res
 * 24:770, measure the knee of cross-legged sitting near 130 to 150 degrees of
 * flexion, which these places give a leg of equal thigh and shank).
 */
export namespace floorSeat {
  /** A folded sitting. */
  export type Kind = "crossed" | "side";

  /**
   * A place in the pelvis's floor frame, from the floor point under the middle
   * of the hip joints: to the body's left, up and ahead, thigh lengths.
   */
  export interface IPlace {
    /** To the body's left; negative to its right. */
    left: number;

    /** Above the floor. */
    up: number;

    /** Ahead of the hip joints. */
    ahead: number;
  }
  /** The record of `ICROSSEDEntryItem`'s site. */
  type ICROSSEDEntryItem = { ankle: IPlace; knee: IPlace };

  /**
   * Tailor sitting, by leg: each ankle on the floor past the other hip, the
   * left shank in front of the right, each knee out, ahead and a little up
   * (provisional).
   */
  export const CROSSED: Readonly<
    Record<AutoMovieHumanSide, ICROSSEDEntryItem>
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
  /** The record of `ISIDEEntryItem`'s site. */
  type ISIDEEntryItem = { ankle: IPlace; knee: IPlace };

  /**
   * Side sitting, by leg: both ankles to the right, the left one ahead of the
   * right hip and the right one out beside it, both knees ahead and to the
   * left, low (provisional).
   */
  export const SIDE: Readonly<Record<AutoMovieHumanSide, ISIDEEntryItem>> = {
    left: {
      ankle: { left: -0.3, up: 0, ahead: 0.4 },
      knee: { left: 1.2, up: 0.1, ahead: 0.8 },
    },
    right: {
      ankle: { left: -0.9, up: 0, ahead: -0.1 },
      knee: { left: 0.4, up: 0.1, ahead: 1 },
    },
  };

  /**
   * The share of the arm's length, shoulder to wrist, at which the supporting
   * hand of side sitting is set down: nearly straight, as an arm leant on is
   * (provisional).
   */
  export const REACH: number = 0.95;

  /**
   * The height of a folded leg's ankle joint over the floor, in standing ankle
   * heights: the foot lies on its side, so the joint is about half the ankle's
   * breadth up (provisional).
   */
  export const ANKLE: number = 0.5;

  /**
   * A posture's legs moved a share of the way from where its joints hold them
   * to a folded sitting, and for side sitting its left hand to the floor.
   *
   * @param body The body.
   * @param posture The posture, its root placed and its legs set by joints.
   * @param kind The sitting.
   * @param share 0 where the joints hold the legs to 1 folded.
   * @param resolution Optional exact FK source borrowed only during this
   *   current placement.
   * @param projection Optional genuine same-body ROM metadata from the current
   *   query.
   * @returns The posture with the leg goals, and the hand's for side sitting;
   *   the posture itself at no share. The hand bears (`planted`) once it is
   *   down.
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
  /** The record of `ITableEntryItem`'s site. */
  type ITableEntryItem = { ankle: IPlace; knee: IPlace };

  /**
   * Prepare a fixed body's folded-sitting targets and actual FK demand. Each
   * changing posture still supplies its own hips, limbs and heading.
   *
   * @param body The unchanged body/rest/surface geometry of this floor plan.
   * @param kind The unchanged authored crossed or side sitting.
   * @returns A current posture/share writer with optional nonescaping
   *   same-query FK/ROM loans; nonpositive share returns its input unchanged.
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
    const table: Readonly<Record<AutoMovieHumanSide, ITableEntryItem>> =
      kind === "crossed" ? CROSSED : SIDE;
    const local: (point: IPlace, up: number) => IAutoMovieVector3 = (
      point: IPlace,
      up: number,
    ): IAutoMovieVector3 => ({
      x: point.left * body.measure.thigh,
      y: point.up * body.measure.thigh + up,
      z: point.ahead * body.measure.thigh,
    });
    const targets: Record<AutoMovieHumanSide, IPrepareTargetsEntry> = {
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
      const hips: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
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
