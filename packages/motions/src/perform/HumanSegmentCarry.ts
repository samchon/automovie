import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentPose } from "./HumanSegmentPose";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/**
 * The carry of a prop an earlier action left held: the holding arm's place
 * relative to the chest, captured where its action ended, and the arm goals
 * that keep it there on a later pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the file owns and what it reads from its siblings.
 * @evidence contracts/development/design.md#principled-representation One responsibility of a placed action's evaluation, over the records `HumanSegment` declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Ordered carried-hold selection and one carry-goal reader with private frame capture use HumanSegment's existing held/carry records and an optional operation-owned FK source.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the sibling owners; nothing is duplicated between them.
 */
export namespace HumanSegmentCarry {
  /**
   * Select the original active holds that ride a carrier at this film second.
   * Earlier riding holds retain priority through their takeover fade.
   *
   * Only a hold taken by an action that started before the carrier rides it.
   * A carry is captured from its source action's last pose, so a hold that a
   * later action takes at the carrier's boundary would make that capture
   * evaluate the later action, whose own carries capture the first hold
   * again: with a prop in each hand the two captures re-entered each other
   * without bound (#4023).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines exact source/window/drive exclusions, the causal source order and ordered per-hand riding priority, with the recursion the order prevents; returns a fresh array of original held references.
   * @evidence contracts/development/implementation.md#principled-implementation The original active-window filter and subsequent riding-priority filter are independent ordered passes over unchanged internal hold records, so one pass can carry the same two side states without changing their decisions. A carry depends on its source action's final pose, so admitting only holds whose source started strictly before the carrier orders every capture after the captures it reads; the dependency graph is then acyclic and each capture terminates. A tie in start is admitted neither way, so two simultaneous takers cannot read each other.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Active-window admission precedes lazy per-side drive lookup, then the original first-riding-hold priority; carry-frame capture remains separate in carries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains inclusive starts, strict ends, source exclusion, riding fade and older-carrier cutoff exactly; the causal order removes only holds taken by an action that had not started when the carrier did. Internal held producers own the closed two-side domain; no hold, contact or source pose is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(H) hold traversal and at most two original plan drive scans replace two arrays/passes and a set/object. Empty holds allocate only the fresh returned array and perform no drive/contact lookup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only a fixed plan's per-side drive result is shared within this call; current hold windows and riding order are read at each exact second without retained selection or pose results.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Four scalar side states end with the call. The returned fresh array borrows the original holds, retains no reader or process, and lives only as long as its displayed evaluation.
   */
  export function borne(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    seconds: number,
  ): IAutoMovieMotionHumanSegment.IHeld[] {
    const out: IAutoMovieMotionHumanSegment.IHeld[] = [];
    let left: boolean | undefined;
    let right: boolean | undefined;
    let ridingLeft: boolean = false;
    let ridingRight: boolean = false;
    for (const held of person.holds) {
      if (
        !(
          held.source !== segment &&
          held.source.start < segment.start &&
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
          ? (left ??= HumanSegment.drives(segment.plan, held.side))
          : (right ??= HumanSegment.drives(segment.plan, held.side));
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

  /**
   * The arm goals that carry held props: each holding hand rides the chest
   * with the offset it had when its action ended, the trunk-relative goal of
   * a carried object, attached to the chest (`on`) so the resolver carries
   * it into the world by the chest of whichever pose it fits, the
   * evaluation's and the planted refit's after the displayed clamp alike.
   *
   * @param person The person.
   * @param holds The holds to carry.
   * @param resolution Optional exact FK reader or lazy supplier from this same synchronous person's evaluation; never stored in the hold or result.
   * @param prepared Optional same-body parent preparation, borrowed by the first actual source-pose capture and never retained in h.carry.
   * @returns Each holding arm with its goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States chest-relative capture, displayed arm goals, held records and the optional borrowed FK source and lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Captures the actual displayed source hand/elbow relative to its chest and returns that rigid relation attached to the chest, so every fit of the goal composes it with the chest of the pose it fits; a world goal placed from one pose's chest would be missed by a refit on a pose the clamp moved. Every capture still evaluates the source pose; borrowed FK shares only exactly equal scalar prerequisites under the same unchanged skeleton topology.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure An empty-hold return and one ordered map of holding hands keep capture and ordinary FK in private helpers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No hold, source pose, capture, hand transform or fit is skipped; standalone calls retain their ordinary fresh-FK path, and the optional source never enters h.carry or a returned goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms For H holds, O(H) record copies and no current FK (the fit places the chest it already resolves); each of M uncaptured holds adds its complete source-pose evaluation and demanded chest/hand/elbow FK. Ordered joint admission remains, while unrelated world-bone outputs are omitted. A supplied parent shares exact math; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing h.carry stores each hand's numerical source relation once until forget. An explicit parent lends its same genuine projection and lazy exact reader to complete first source-pose evaluation and current/captured FK; changed pose/rest/parent scalars miss normally and all source poses/fits remain actual independent evaluations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local getter borrows its parent's raw operation key until this call ends; canonical body FK owns O(K) successful dependency rows under that weak key. Holds keep only numerical carry frames/reference until forget. Returned arrays/tuples/goals/vectors are fresh, reference stays borrowed, and none retains the getter or key.
   */
  export function carries(
    person: IAutoMovieMotionHumanSegment.IPerson,
    holds: readonly IAutoMovieMotionHumanSegment.IHeld[],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): ["leftArm" | "rightArm", IAutoMovieHumanLimbGoal][] {
    if (holds.length === 0) return [];
    const read: ReturnType<typeof prepareHumanPoseResolution> | undefined =
      resolution === undefined
        ? undefined
        : prepareHumanPoseResolution(resolution);
    // Attached to the chest (`on`), the goal is carried into the world by
    // the chest of the pose being fitted, whatever placed it: the evaluation
    // and the planted refit after its clamp alike.
    return holds.map(
      (
        h: IAutoMovieMotionHumanSegment.IHeld,
      ): ["leftArm" | "rightArm", IAutoMovieHumanLimbGoal] => {
        h.carry ??= capture(person, h, read, prepared);
        return [
          h.side === "left" ? "leftArm" : "rightArm",
          {
            point: h.carry.position,
            rotation: h.carry.rotation,
            bend: h.carry.elbow,
            on: "chest",
            reference: h.carry.reference,
            planted: true,
          },
        ];
      },
    );
  }

  /** Fresh world bones, optionally borrowing the current operation's exact FK. */
  function bones(
    person: IAutoMovieMotionHumanSegment.IPerson,
    pose: IAutoMoviePose,
    resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return poseBones(person.performer.body, pose, resolution?.(), requested);
  }

  /** A holding arm relative to the chest at the end of the action that took hold. */
  function capture(
    person: IAutoMovieMotionHumanSegment.IPerson,
    held: IAutoMovieMotionHumanSegment.IHeld,
    resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): IAutoMovieMotionHumanSegment.ICarry {
    const at: number = Math.max(held.from, held.source.end);
    const pose: IAutoMoviePose = HumanSegmentPose.of(
      person,
      held.source,
      at,
      prepared,
    );
    const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
      person,
      pose,
      resolution,
      new Set<AutoMovieHumanoidBone>([
        "chest",
        `${held.side}Hand`,
        `${held.side}LowerArm`,
      ]),
    );
    const chest: IAutoMovieResolvedBone = map.get("chest")!;
    const hand: IAutoMovieResolvedBone = map.get(`${held.side}Hand`)!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      chest.worldRotation,
    );
    const local: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, chest.worldPosition),
      );
    return {
      position: local(hand.worldPosition),
      rotation: Quaternion.normalize(
        Quaternion.multiply(inverse, hand.worldRotation),
      ),
      elbow: local(map.get(`${held.side}LowerArm`)!.worldPosition),
      reference: resolveHumanPosture.reference(
        pose,
        held.side === "left" ? "leftArm" : "rightArm",
      ),
    };
  }
}
