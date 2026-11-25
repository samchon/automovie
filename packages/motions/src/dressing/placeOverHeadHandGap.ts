import { physicalShapeSegmentDistance } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanHand } from "../compose/AutoMovieMotionHumanHand";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanColliders } from "../posture/HumanColliders";
import { assembleHumanPosture } from "../posture/assembleHumanPosture";
import { poseBones } from "../posture/poseBones";
import { HumanWornItem } from "./HumanWornItem";

/** Clearance of both grip shapes against the recipient's upper body. */
export function placeOverHeadHandGap(
  props: placeOverHeadHandGap.IProps,
): (frame: IAutoMovieRigidTransform) => number {
  const { body, partner, side, other }: placeOverHeadHandGap.IProps = props;
  const otherBones: ReturnType<typeof poseBones> = poseBones(
    body,
    assembleHumanPosture(body, {
      ...props.posture,
      limbs: {},
      joints: {
        ...props.posture.joints,
        ...AutoMovieMotionHumanHand.fingers(other, "relaxed", 0, 1),
      },
    }).pose,
  );
  const holding: readonly IAutoMovieVector3[] = probes(body, props.pose, side);
  const grasping: readonly IAutoMovieVector3[] = probes(body, otherBones, other);
  const distances: readonly ReturnType<typeof physicalShapeSegmentDistance.prepare>[] =
    HumanColliders.preparePlaced(partner.body, SHOULDERS)(partner.bones)
      .flatMap((part: IAutoMovieMotionHumanColliders.IPlaced) =>
        part.shapes.map((shape) => physicalShapeSegmentDistance.prepare(part.pose, shape)),
      );
  return (frame: IAutoMovieRigidTransform): number =>
    Math.min(
      distance(holding, side, props.holding(frame)),
      distance(grasping, other, props.grasping(frame)),
    );

  function distance(
    local: readonly IAutoMovieVector3[],
    hand: AutoMovieHumanSide,
    target: IAutoMovieMotionHumanArmTarget.ITarget,
  ): number {
    const wrist: IAutoMovieRigidTransform = {
      position: AutoMovieMotionHumanArmTarget.goal(body, hand, target).point,
      rotation: target.rotation,
    };
    let nearest: number = Infinity;
    for (const point of local) {
      const at: IAutoMovieVector3 = HumanWornItem.point(wrist, point);
      for (const gap of distances) nearest = Math.min(nearest, gap(at, at));
    }
    return nearest;
  }
}

/** The partner-facing colliders bordering the loop's descent past the neck. */
const SHOULDERS: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "chest",
  "upperChest",
  "leftShoulder",
  "rightShoulder",
  "leftUpperArm",
  "rightUpperArm",
]);

/** The tangle model's own hand and digit probes in the wrist's frame. */
function probes(
  body: IAutoMovieMotionHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: AutoMovieHumanSide,
): IAutoMovieVector3[] {
  const name: AutoMovieHumanoidBone = `${side}Hand`;
  const wrist: IAutoMovieRigidTransform = HumanPropFrame.bone(bones.get(name)!);
  return HumanColliders.placed(body, bones).flatMap(
    (part: IAutoMovieMotionHumanColliders.IPlaced, i: number): IAutoMovieVector3[] => {
      if (AutoMovieMotionHumanAuditTangleModel.group(part.bone) !== name) return [];
      const local: IAutoMovieRigidTransform = HumanPropFrame.relative(wrist, part.pose);
      const model: IAutoMovieMotionHumanAuditTangleModel.IPart = body.tangle.parts[i]!;
      return model.probes.map((point: IAutoMovieVector3): IAutoMovieVector3 =>
        HumanWornItem.point(local, point),
      );
    },
  );
}

/** The two grip poses and the partner at the start of the action. */
export namespace placeOverHeadHandGap {
  /** A grip target on a candidate loop frame. */
  export type Target = (
    frame: IAutoMovieRigidTransform,
  ) => IAutoMovieMotionHumanArmTarget.ITarget;

  /** The grip witnesses on the dresser and the recipient's authored frame. */
  export interface IProps {
    body: IAutoMovieMotionHumanBody;
    posture: IAutoMovieMotionHumanPosture;
    pose: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    side: AutoMovieHumanSide;
    other: AutoMovieHumanSide;
    holding: Target;
    grasping: Target;
    partner: {
      body: IAutoMovieMotionHumanBody;
      bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    };
  }
}
