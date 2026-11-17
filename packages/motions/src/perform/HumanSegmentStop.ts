import { preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionWeaponPath,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import type { HumanSegment } from "./HumanSegment";
import { HumanSegmentPose } from "./HumanSegmentPose";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/**
 * The contact goals held by stopped weapons during one displayed evaluation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns reading a stopped limb's displayed hand/foot frame and bend; the pose evaluator retains stop selection, fitting order and named seeds.
 * @evidence contracts/development/design.md#principled-representation A reader of the placed person's segment and a weapon's existing limb at an absolute film second returns the posture's complete planted goal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader serves the existing stopped-weapon loop; it introduces no authored stop, pose or fitting representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the displayed-pose and canonical FK owners rather than replacing a stop with a joint snapshot or a different body's frame.
 */
export namespace HumanSegmentStop {
  /**
   * Read stopped limb goals within one synchronous displayed evaluation.
   * The body and its topology must keep the same skeleton for the reader's
   * lifetime. Different stopped weapons at the same exact second read one
   * completed displayed stop pose, then each performs ordered FK admission
   * and receives fresh requested frame values. Other seconds and queries
   * retain their own actual displayed evaluation.
   *
   * @param person The person whose displayed stop poses are read.
   * @param segment The action whose weapons stopped.
   * @param source Optional same-body preparation borrowed from this displayed evaluation, never kept by a stop or result.
   * @returns An operation-local reader of a weapon's planted goal at its stop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States absolute film seconds, the same-skeleton operation lifetime, fresh goal frames and the separation between pose evaluation and FK math reuse.
   * @evidence contracts/development/implementation.md#principled-implementation A fixed person, explicit segment and exact stop second determine the same cold displayed pose while this synchronous weapon loop keeps plans/stops/body unchanged. Its completed result may serve several weapons; their actual effector/lower frames still resolve independently through ordered FK.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Capture body once, lazily share successful same-second stop poses only for multiweapon segments, then read each demanded frame with the common operation preparation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Failed stop evaluations are unpublished; different seconds, segments, persons and outer queries never share this result map. Every requested FK still receives ordered joint admission and fresh transforms, and no tolerance or sampling rule changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms For W stopped weapons at T distinct exact stop instants, complete displayed evaluation runs T times instead of W; each weapon still pays joint admission and its demanded effector/lower FK ancestry. Shared rig/exact FK metadata does not replace target fits or projections; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The enclosing seeded call establishes same person, segment, plans/stops and unchanged body. Only completed equal-time poses are shared in its multiweapon loop; an explicit same-body parent also lends rig and exact FK prerequisites. A new query creates a new reader and result map.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The first actual stop creates this reader; its outer evaluation releases it on return or throw. At most W distinct stop poses from that actual loop and one successful FK tuple per visited name are retained locally; singleweapon loops retain no pose map. Returned goals keep fresh numeric frame values and no reader, map, global cache or task.
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
      const side: "left" | "right" = weapon.limb.startsWith("left")
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
        source?.resolution() ?? (shared ? (prepared ??= preparePoseResolution()) : undefined),
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
