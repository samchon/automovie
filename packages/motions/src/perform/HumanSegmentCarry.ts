import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanPosture } from "../posture/IHumanPosture";
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
   * @evidence contracts/development/common.md#meaningful-documentation Defines exact source/window/drive exclusions and ordered per-hand riding priority; returns a fresh array of original held references.
   * @evidence contracts/development/implementation.md#principled-implementation The original active-window filter and subsequent riding-priority filter are independent ordered passes over unchanged internal hold records, so one pass can carry the same two side states without changing their decisions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Active-window admission precedes lazy per-side drive lookup, then the original first-riding-hold priority; carry-frame capture remains separate in carries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains inclusive starts, strict ends, source exclusion, riding fade and older-carrier cutoff exactly. Internal held producers own the closed two-side domain; no hold, contact or source pose is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(H) hold traversal and at most two original plan drive scans replace two arrays/passes and a set/object. Empty holds allocate only the fresh returned array and perform no drive/contact lookup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only a fixed plan's per-side drive result is shared within this call; current hold windows and riding order are read at each exact second without retained selection or pose results.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Four scalar side states end with the call. The returned fresh array borrows the original holds, retains no reader or process, and lives only as long as its displayed evaluation.
   */
  export function borne(person: HumanSegment.IPerson, segment: HumanSegment.ISegment,
    seconds: number): HumanSegment.IHeld[] {
    const out: HumanSegment.IHeld[] = [];
    let left: boolean | undefined;
    let right: boolean | undefined;
    let ridingLeft: boolean = false;
    let ridingRight: boolean = false;
    for (const held of person.holds) {
      if (!(held.source !== segment && held.from <= seconds &&
        (seconds < held.until || (held.riding === true
          ? seconds < held.until + HumanSegment.FADE : segment.entryTime < held.until)))) continue;
      const driven: boolean = held.side === "left"
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
   * The arm goals that carry held props on a pose: each holding hand rides
   * the chest with the offset it had when its action ended, the
   * trunk-relative goal of a carried object.
   *
   * @param person The person.
   * @param pose The pose whose chest carries the hands.
   * @param holds The holds to carry.
   * @param resolution Optional exact FK reader or lazy supplier from this same synchronous person's evaluation; never stored in the hold or result.
   * @param prepared Optional same-body parent preparation, borrowed by the first actual source-pose capture and never retained in h.carry.
   * @returns Each holding arm with its goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States chest-relative capture, displayed arm goals, held records and the optional borrowed FK source and lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Captures the actual displayed source hand/elbow relative to its chest, then composes that rigid relation with the current chest. Every capture still evaluates the source pose; borrowed FK shares only exactly equal scalar prerequisites under the same unchanged skeleton topology.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure An empty-hold return, one current chest read and one ordered map of holding hands keep capture and ordinary FK in private helpers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No hold, source pose, capture, hand transform or fit is skipped; standalone calls retain their ordinary fresh-FK path, and the optional source never enters h.carry or a returned goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms For H holds, one demanded current chest FK plus O(H) rigid transforms; each of M uncaptured holds adds its complete source-pose evaluation and demanded chest/hand/elbow FK. Ordered joint admission remains, while unrelated world-bone outputs are omitted. A supplied parent shares exact math; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing h.carry stores each hand's numerical source relation once until forget. An explicit parent lends its same genuine projection and lazy exact reader to complete first source-pose evaluation and current/captured FK; changed pose/rest/parent scalars miss normally and all source poses/fits remain actual independent evaluations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The optional local getter borrows its parent's reader until this synchronous call ends; the parent owns O(K) last successful joint/world snapshots for K visited bone names. Holds retain only existing numerical carry frames/reference until HumanSegment.forget. Returned arrays/tuples/goals and transform vectors are fresh, reference remains borrowed, and none retains the getter or reader.
   */
  export function carries(
    person: HumanSegment.IPerson,
    pose: IAutoMoviePose,
    holds: readonly HumanSegment.IHeld[],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): ["leftArm" | "rightArm", IHumanPosture.IGoal][] {
    if (holds.length === 0) return [];
    const read: ReturnType<typeof prepareHumanPoseResolution> | undefined =
      resolution === undefined
        ? undefined
        : prepareHumanPoseResolution(resolution);
    const chest: IAutoMovieResolvedBone = bones(person, pose, read, CHEST).get(
      "chest",
    )!;
    return holds.map(
      (
        h: HumanSegment.IHeld,
      ): ["leftArm" | "rightArm", IHumanPosture.IGoal] => {
        h.carry ??= capture(person, h, read, prepared);
        return [
          h.side === "left" ? "leftArm" : "rightArm",
          {
            point: Vector3.add(
              chest.worldPosition,
              Quaternion.rotateVector(chest.worldRotation, h.carry.position),
            ),
            rotation: Quaternion.normalize(
              Quaternion.multiply(chest.worldRotation, h.carry.rotation),
            ),
            bend: Vector3.add(
              chest.worldPosition,
              Quaternion.rotateVector(chest.worldRotation, h.carry.elbow),
            ),
            reference: h.carry.reference,
            planted: true,
          },
        ];
      },
    );
  }

  /** Fresh world bones, optionally borrowing the current operation's exact FK. */
  function bones(
    person: HumanSegment.IPerson,
    pose: IAutoMoviePose,
    resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return poseBones(person.performer.body, pose, resolution?.(), requested);
  }

  /** A holding arm relative to the chest at the end of the action that took hold. */
  function capture(
    person: HumanSegment.IPerson,
    held: HumanSegment.IHeld,
    resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): HumanSegment.ICarry {
    const at: number = Math.max(held.from, held.source.end);
    const pose: IAutoMoviePose = HumanSegmentPose.of(person, held.source, at, prepared);
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

  /** Current carrying goals depend only on the chest's rigid world frame. */
  const CHEST: ReadonlySet<AutoMovieHumanoidBone> = new Set(["chest"]);
}
