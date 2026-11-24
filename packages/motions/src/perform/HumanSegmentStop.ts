import { preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionWeaponPath,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { HumanSegmentPose } from "./HumanSegmentPose";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/** The contact goals held by stopped weapons during one displayed evaluation. */
export namespace HumanSegmentStop {
  /**
   * Read stopped limb goals within one synchronous displayed evaluation. The
   * body and its topology must keep the same skeleton for the reader's
   * lifetime. Different stopped weapons at the same exact second read one
   * completed displayed stop pose, then each performs ordered FK admission and
   * receives fresh requested frame values. Other seconds and queries retain
   * their own actual displayed evaluation.
   *
   * @param person The person whose displayed stop poses are read.
   * @param segment The action whose weapons stopped.
   * @param source Optional same-body preparation borrowed from this displayed
   *   evaluation, never kept by a stop or result.
   * @returns An operation-local reader of a weapon's planted goal at its stop.
   */
  export function reader(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    source?: prepareHumanSegmentPose.IPrepared,
  ): (
    weapon: IAutoMovieMotionWeaponPath,
    seconds: number,
  ) => IAutoMovieHumanLimbGoal {
    const body: IAutoMovieMotionHumanBody = person.performer.body;
    const shared: boolean = (segment.plan.weapons?.length ?? 0) > 1;
    let prepared: ReturnType<typeof preparePoseResolution> | undefined;
    let poses: Map<number, IAutoMoviePose> | undefined;
    return (
      weapon: IAutoMovieMotionWeaponPath,
      seconds: number,
    ): IAutoMovieHumanLimbGoal => {
      const side: AutoMovieHumanSide = weapon.limb.startsWith("left")
        ? "left"
        : "right";
      const arm: boolean = weapon.limb.endsWith("Arm");
      let pose: IAutoMoviePose | undefined = poses?.get(seconds);
      if (pose === undefined) {
        pose = HumanSegmentPose.of(person, segment, seconds, source);
        if (shared) (poses ??= new Map()).set(seconds, pose);
      }
      const map: ReturnType<typeof poseBones> = poseBones(
        body,
        pose,
        source?.resolution() ??
          (shared ? (prepared ??= preparePoseResolution()) : undefined),
        new Set<AutoMovieHumanoidBone>([
          `${side}${arm ? "Hand" : "Foot"}`,
          `${side}${arm ? "LowerArm" : "LowerLeg"}`,
        ]),
      );
      const effector: IAutoMovieResolvedBone = map.get(
        `${side}${arm ? "Hand" : "Foot"}`,
      )!;
      return {
        point: effector.worldPosition,
        rotation: effector.worldRotation,
        bend: map.get(`${side}${arm ? "LowerArm" : "LowerLeg"}`)!.worldPosition,
        planted: true,
      };
    };
  }
}
