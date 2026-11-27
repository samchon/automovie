import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMoviePhysicalShape,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanColliders } from "../../posture/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanGrasp } from "../HumanGrasp";
import { HumanGraspUse } from "../HumanGraspUse";

/**
 * The search a held support's grip runs: grip stations along the support's
 * material span, and the palm and finger colliders a candidate grip is measured
 * with.
 */
export namespace heldSupportGrip {
  /** One grip candidate along the held support's material span. */
  export interface IStation {
    /** The grip target at this station. */
    grip: IAutoMovieMotionHumanGrasp.ITarget;

    /** The station along the span, as a fraction of its length from the middle. */
    station: number;

    /** The oblique wrist tilt tried, degrees. */
    tilt: number;

    /** The roll turns tried about the grip axis, degrees. */
    turns: readonly number[];
  }

  /**
   * Try the authored station before extending the search along its measured
   * material span. The caller admits each station with the same material and
   * whole-arm bounds and keeps the first station with a clear grip.
   */
  export function* stations(
    middle: IAutoMovieMotionHumanGrasp.ITarget,
    length: number,
  ): Iterable<IStation> {
    for (const tilt of HumanGraspUse.OBLIQUE)
      yield { grip: middle, station: 0, tilt, turns: HumanGrasp.TURNS };
    if (!(length > 0)) return;

    const turns: number[] = HumanGrasp.TURNS.flatMap(
      (turn: number, index: number): number[] =>
        index === 0
          ? [turn]
          : [(HumanGrasp.TURNS[index - 1]! + turn) / 2, turn],
    );
    for (const station of [-0.25, 0.25, -0.5, 0.5]) {
      const grip: IAutoMovieMotionHumanGrasp.ITarget = {
        ...middle,
        point: Vector3.add(
          middle.point,
          Vector3.scale(middle.axis, station * length),
        ),
      };
      for (const tilt of HumanGraspUse.OBLIQUE)
        yield { grip, station, tilt, turns };
    }
  }

  /** A physical shape and the frame of its carrying bone. */
  export interface IMaterial {
    /** The carried shape in bone-local metres. */
    shape: IAutoMoviePhysicalShape;
    /** The bone's rigid frame in wrist-local or world metres. */
    pose: IAutoMovieRigidTransform;
  }

  /** The actual palm and phalanx colliders in their posed world frames. */
  export function handMaterial(
    body: IAutoMovieMotionHumanBody,
    bones: ReturnType<typeof poseBones>,
    hand: AutoMovieHumanoidBone,
  ): IMaterial[] {
    return HumanColliders.placed(body, bones)
      .filter(
        (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          AutoMovieMotionHumanAuditTangleModel.group(segment.bone) === hand,
      )
      .flatMap((segment: IAutoMovieMotionHumanColliders.IPlaced): IMaterial[] =>
        segment.shapes.map(
          (shape: IAutoMoviePhysicalShape): IMaterial => ({
            shape,
            pose: segment.pose,
          }),
        ),
      );
  }

  /**
   * Retain a solved palm and fingers' wrist-local materials for one grip
   * search.
   */
  export function material(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
  ): (wrist: IAutoMovieMotionHumanHand.IWrist) => IMaterial[] {
    const hand: AutoMovieHumanoidBone = `${side}Hand`;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const reference: IAutoMovieResolvedBone = bones.get(hand)!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      reference.worldRotation,
    );
    const local: IMaterial[] = handMaterial(body, bones, hand).map(
      (segment: IMaterial): IMaterial => {
        const pose: IAutoMovieRigidTransform = {
          position: Quaternion.rotateVector(
            inverse,
            Vector3.subtract(segment.pose.position, reference.worldPosition),
          ),
          rotation: Quaternion.multiply(inverse, segment.pose.rotation),
        };
        return { shape: segment.shape, pose };
      },
    );
    return (wrist: IAutoMovieMotionHumanHand.IWrist): IMaterial[] =>
      local.map(
        (part: IMaterial): IMaterial => ({
          shape: part.shape,
          pose: {
            position: Vector3.add(
              wrist.point,
              Quaternion.rotateVector(wrist.rotation, part.pose.position),
            ),
            rotation: Quaternion.multiply(wrist.rotation, part.pose.rotation),
          },
        }),
      );
  }
}
