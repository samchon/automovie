import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionWeaponPath,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentPose } from "./HumanSegmentPose";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/*
 * The contact goals held by stopped weapons: a stopped limb holds its end where
 * the action's displayed pose put it at the stop.
 */
export namespace HumanSegmentStop {
  /*
   * A stopped weapon's planted goal: its limb's end joint and middle joint as
   * the action displays them at the stop. The goal is a constant of the stop,
   * so the performance solves it once when it is prepared
   * (`IAutoMovieMotionHumanSegment.IPrepared.stops`); a display read before
   * that evaluates the stop pose itself.
   * Parameter person: The person whose displayed stop pose is read.
   * Parameter segment: The action whose weapon stopped.
   * Parameter weapon: The weapon.
   * Parameter seconds: The stop, film seconds.
   * Parameter source: Optional same-body preparation borrowed from the reading
   * evaluation.
   * Returns: The limb's planted goal.
   */
  export function goal(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    weapon: IAutoMovieMotionWeaponPath,
    seconds: number,
    source?: prepareHumanSegmentPose.IPrepared,
  ): IAutoMovieHumanLimbGoal {
    const prepared: IAutoMovieHumanLimbGoal | undefined =
      segment.prepared?.stops.get(weapon.id);
    if (prepared !== undefined) return prepared;
    const side: AutoMovieHumanSide = weapon.limb.startsWith("left")
      ? "left"
      : "right";
    const arm: boolean = weapon.limb.endsWith("Arm");
    const end: AutoMovieHumanoidBone = `${side}${arm ? "Hand" : "Foot"}`;
    const middle: AutoMovieHumanoidBone = `${side}${arm ? "LowerArm" : "LowerLeg"}`;
    const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      person.performer.body,
      HumanSegmentPose(person, segment, seconds, source),
      source?.resolution(),
      new Set<AutoMovieHumanoidBone>([end, middle]),
    );
    const effector: IAutoMovieResolvedBone = map.get(end)!;
    return {
      point: effector.worldPosition,
      rotation: effector.worldRotation,
      bend: map.get(middle)!.worldPosition,
      planted: true,
    };
  }

  /*
   * Every stopped weapon's planted goal of an action whose law does not take
   * its stops itself, by the weapon's id: what the performance prepares.
   * Parameter person: The person, with the committed stops installed.
   * Parameter segment: The action.
   * Returns: The goals.
   */
  export function prepare(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
  ): Map<string, IAutoMovieHumanLimbGoal> {
    const out: Map<string, IAutoMovieHumanLimbGoal> = new Map();
    if (segment.plan.stop !== undefined) return out;
    for (const weapon of segment.plan.weapons ?? []) {
      const stop: number | undefined = person.stops.get(
        HumanSegment.weapon(segment, weapon.id),
      );
      if (stop !== undefined)
        out.set(weapon.id, goal(person, segment, weapon, stop));
    }
    return out;
  }
}
