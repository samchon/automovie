import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanArmTrajectoryTerms } from "../../posture/internal/HumanArmTrajectoryTerms";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentPose } from "./HumanSegmentPose";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/*
 * The carry of a prop an earlier action left held: the holding arm's place in
 * the frame the action that took hold placed the hand in, captured where that
 * action ended, and the arm goals that keep it there on a later pose, a port of
 * MoveIt's pose constraints in a moving link's frame (`carries`).
 */
export namespace HumanSegmentCarry {
  /*
   * Select the original active holds that ride a carrier at this film second.
   * Earlier riding holds retain priority through their takeover fade.
   *
   * A hold rides only once its carry can be captured: its capture instant, the
   * later of its start and its source action's end, must have passed, or be now
   * with that source ending before the carrier does. A carry is captured from
   * its source action's last pose, so a hold that a later action takes at the
   * carrier's boundary would make that capture evaluate the later action, whose
   * own carries capture the first hold again: with a prop in each hand the two
   * captures re-entered each other without bound.
   */
  export function borne(
    person: Pick<IAutoMovieMotionHumanSegment.IPerson, "holds">,
    segment: Pick<IAutoMovieMotionHumanSegment, "plan" | "end" | "entryTime">,
    seconds: number,
  ): IAutoMovieMotionHumanSegment.IHeld[] {
    const out: IAutoMovieMotionHumanSegment.IHeld[] = [];
    // Read contact geometry only if an eligible hold needs that hand.
    let left: boolean | undefined;
    let right: boolean | undefined;
    let ridingLeft: boolean = false;
    let ridingRight: boolean = false;
    for (const held of person.holds) {
      const captured: number = Math.max(held.from, held.source.end);
      if (
        !(
          held.source !== segment &&
          (captured < seconds ||
            (captured === seconds && held.source.end < segment.end)) &&
          held.from <= seconds &&
          (seconds < held.until ||
            (held.riding === true
              ? seconds < held.until + HumanSegment.FADE
              : segment.entryTime < held.until))
        )
      )
        continue;
      const driven: boolean =
        held.side === "left"
          ? (left ??= HumanSegment.drives(segment.plan, "left"))
          : (right ??= HumanSegment.drives(segment.plan, "right"));
      if (driven) continue;
      const earlier: boolean = held.side === "left" ? ridingLeft : ridingRight;
      if (held.riding === true) {
        if (held.side === "left") ridingLeft = true;
        else ridingRight = true;
      }
      if (!earlier) out.push(held);
    }
    return out;
  }

  /*
   * The arm goals that carry held props: each holding hand's pose goal in a
   * moving link's frame, as MoveIt states a pose constraint in a robot link's
   * frame (moveit/moveit@fdb79acafb24, BSD-3-Clause,
   * moveit_core/kinematic_constraints/src/kinematic_constraint.cpp: a
   * `PositionConstraint` or `OrientationConstraint` whose frame is not fixed is
   * a `mobile_frame_`, its region placed on every state at
   * `state.getFrameTransform(constraint_frame_id_) * constraint_region_pose_`
   * and its rotation at `state.getFrameTransform(desired_rotation_frame_id_)
   * .linear() * desired_rotation_matrix_`). The goal is the hand as it lay in
   * its frame's bone (`ICarry.frame`) when its action ended, captured as a
   * planning scene stores a body attached to a link
   * (moveit_core/planning_scene/src/planning_scene.cpp,
   * `getGlobalLinkTransform(link).inverse() * pose`), and is attached to that
   * bone (`on`), so the resolver places it by that bone of whichever pose it
   * fits, the evaluation's and the planted refit's after the displayed clamp
   * alike.
   * Parameter person: The person.
   * Parameter holds: The holds to carry.
   * Parameter resolution: Optional exact FK reader or lazy supplier from this same
   * synchronous person's evaluation; never stored in the hold or result.
   * Parameter prepared: Optional same-body parent preparation, borrowed by a
   * source-pose capture read before the performance is prepared.
   * Returns: Each holding arm with its goal.
   */
  export function carries(
    person: IAutoMovieMotionHumanSegment.IPerson,
    holds: readonly IAutoMovieMotionHumanSegment.IHeld[],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): [CarriesItemResult, IAutoMovieHumanLimbGoal][] {
    if (holds.length === 0) return [];
    const read: ReturnType<typeof prepareHumanPoseResolution> | undefined =
      resolution === undefined
        ? undefined
        : prepareHumanPoseResolution(resolution);
    // Attached to its frame's bone (`on`), the goal is carried into the
    // world by that bone of the pose being fitted, whatever placed it: the
    // evaluation and the planted refit after its clamp alike. The carry the
    // performance prepared, or, while the schedule is resolved, the one the
    // holding action's pose gives now.
    return holds.map(
      (
        h: IAutoMovieMotionHumanSegment.IHeld,
      ): [CarriesResult, IAutoMovieHumanLimbGoal] => {
        const carry: IAutoMovieMotionHumanSegment.ICarry =
          h.carry ?? capture(person, h, read, prepared);
        return [
          h.side === "left" ? "leftArm" : "rightArm",
          {
            point: carry.position,
            rotation: carry.rotation,
            bend: carry.elbow,
            on: carry.frame,
            reference: carry.reference,
            planted: true,
          },
        ];
      },
    );
  }

  /*
   * Whether the arm a fit placed holds its carried goal: MoveIt's
   * `PositionConstraint::decide` (moveit/moveit@fdb79acafb24, BSD-3-Clause,
   * moveit_core/kinematic_constraints/src/kinematic_constraint.cpp: the link's
   * point, `state.getGlobalLinkTransform(link_model_) * offset_`, inside the
   * region placed on the same state, `state.getFrameTransform(
   * constraint_frame_id_) * constraint_region_pose_`), with the hand joint as
   * the link's point, the goal on its frame bone of the same pose as the
   * region's centre, and the request's tolerance the goal tolerance the arm's
   * plan is solved to (`HumanArmTrajectoryTerms.TOLERANCE`, a millimetre).
   * Refused past it, as a planner refuses a state its path constraint rejects.
   * Parameter person: The person.
   * Parameter side: The carrying hand.
   * Parameter goal: The carried goal, on its frame bone (`on`).
   * Parameter pose: The pose the fit placed the arm in.
   * Parameter resolution: Optional exact FK reader from the same evaluation.
   * When the hand lies past the tolerance from its goal.
   */
  export function decide(
    person: IAutoMovieMotionHumanSegment.IPerson,
    side: AutoMovieHumanSide,
    goal: IAutoMovieHumanLimbGoal,
    pose: IAutoMoviePose,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): void {
    const frame: AutoMovieHumanoidBone = goal.on ?? "hips";
    const hand: AutoMovieHumanoidBone = `${side}Hand`;
    const read: ReturnType<typeof prepareHumanPoseResolution> | undefined =
      resolution === undefined
        ? undefined
        : prepareHumanPoseResolution(resolution);
    const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
      person,
      pose,
      read,
      new Set<AutoMovieHumanoidBone>([frame, hand]),
    );
    const anchor: IAutoMovieResolvedBone = map.get(frame)!;
    const centre: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      anchor.worldPosition,
      AutoMovieEngineQuaternion.rotateVector(anchor.worldRotation, goal.point),
    );
    const miss: number =
      AutoMovieEngineVector3.distance(map.get(hand)!.worldPosition, centre) *
      1000;
    if (miss > HumanArmTrajectoryTerms.TOLERANCE)
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "carry",
        value: miss,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: HumanArmTrajectoryTerms.TOLERANCE,
          unit: "mm",
        },
        reason: `the ${side} hand carrying its prop lies ${miss.toFixed(1)} mm off its carried place on the ${frame}, past the ${HumanArmTrajectoryTerms.TOLERANCE} mm the arm's plan is solved to (MoveIt's PositionConstraint::decide)`,
        fix: "carry the prop where the arm can hold it through the later action, or let a later action take the hand",
      });
  }

  /*
   * A holding arm in its frame at the end of the action that took hold, the
   * attach of `carries`. The link the attach names is the bone the action's own
   * goal for that arm rode there (`on`, read from the plan's goals,
   * `courseArmGoal.goals`, where the arm is coursed); a goal laid in the world
   * names none and rides the frame rigidly attached to the robot's root body,
   * the hips (REP 120, "Coordinate Frames for Humanoid Robots", public domain:
   * `base_link` "is rigidly attached to the robot root body", the waist
   * recommended as that body). The performance captures every hold's carry
   * once when it is prepared (`IAutoMovieMotionHumanSegment.IHeld.carry`).
   * Parameter person: The person.
   * Parameter held: The hold.
   * Parameter resolution: Optional exact FK reader of the same evaluation.
   * Parameter prepared: Optional same-body preparation.
   * Returns: The holding arm in its frame.
   */
  export function capture(
    person: IAutoMovieMotionHumanSegment.IPerson,
    held: IAutoMovieMotionHumanSegment.IHeld,
    resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): IAutoMovieMotionHumanSegment.ICarry {
    const at: number = Math.max(held.from, held.source.end);
    const pose: IAutoMoviePose = HumanSegmentPose(
      person,
      held.source,
      at,
      prepared,
    );
    const goal: IAutoMovieHumanLimbGoal | undefined = courseArmGoal
      .goals(held.source.plan)
      .posture(at - held.source.start).limbs[
      held.side === "left" ? "leftArm" : "rightArm"
    ];
    const frame: IAutoMovieMotionHumanSegment.CarryFrame = goal?.on ?? "hips";
    const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
      person,
      pose,
      resolution,
      new Set<AutoMovieHumanoidBone>([
        frame,
        `${held.side}Hand`,
        `${held.side}LowerArm`,
      ]),
    );
    const anchor: IAutoMovieResolvedBone = map.get(frame)!;
    const hand: IAutoMovieResolvedBone = map.get(`${held.side}Hand`)!;
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      anchor.worldRotation,
    );
    const local: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      AutoMovieEngineQuaternion.rotateVector(
        inverse,
        AutoMovieEngineVector3.subtract(point, anchor.worldPosition),
      );
    return {
      frame,
      position: local(hand.worldPosition),
      rotation: AutoMovieEngineQuaternion.normalize(
        AutoMovieEngineQuaternion.multiply(inverse, hand.worldRotation),
      ),
      elbow: local(map.get(`${held.side}LowerArm`)!.worldPosition),
      reference: HumanLimbFit.reference(
        pose,
        held.side === "left" ? "leftArm" : "rightArm",
      ),
    };
  }

  /*
   * Fresh world bones, optionally borrowing the current operation's exact FK.
   */
  function bones(
    person: IAutoMovieMotionHumanSegment.IPerson,
    pose: IAutoMoviePose,
    resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return poseBones(person.performer.body, pose, resolution?.(), requested);
  }
}

/*
 * The alternatives of `CarriesResult`'s site.
 */
type CarriesResult = "leftArm" | "rightArm";

/*
 * The alternatives of `CarriesItemResult`'s site.
 */
type CarriesItemResult = "leftArm" | "rightArm";
