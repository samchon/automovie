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

import { HumanLimbFit } from "../posture/HumanLimbFit";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentPose } from "./HumanSegmentPose";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/** The alternatives of `CarriesResult`'s site. */
type CarriesResult = "leftArm" | "rightArm";

/** The alternatives of `CarriesItemResult`'s site. */
type CarriesItemResult = "leftArm" | "rightArm";

/**
 * The carry of a prop an earlier action left held: the holding arm's place
 * relative to the chest, captured where its action ended, and the arm goals
 * that keep it there on a later pose.
 */
export namespace HumanSegmentCarry {
  /**
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
   * The arm goals that carry held props: each holding hand rides the chest with
   * the offset it had when its action ended, the trunk-relative goal of a
   * carried object, attached to the chest (`on`) so the resolver carries it
   * into the world by the chest of whichever pose it fits, the evaluation's and
   * the planted refit's after the displayed clamp alike.
   *
   * @param person The person.
   * @param holds The holds to carry.
   * @param resolution Optional exact FK reader or lazy supplier from this same
   *   synchronous person's evaluation; never stored in the hold or result.
   * @param prepared Optional same-body parent preparation, borrowed by the
   *   first actual source-pose capture and never retained in h.carry.
   * @returns Each holding arm with its goal.
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
    // Attached to the chest (`on`), the goal is carried into the world by
    // the chest of the pose being fitted, whatever placed it: the evaluation
    // and the planted refit after its clamp alike.
    return holds.map(
      (
        h: IAutoMovieMotionHumanSegment.IHeld,
      ): [CarriesResult, IAutoMovieHumanLimbGoal] => {
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

  /**
   * A holding arm relative to the chest at the end of the action that took
   * hold.
   */
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
      reference: HumanLimbFit.reference(
        pose,
        held.side === "left" ? "leftArm" : "rightArm",
      ),
    };
  }
}
