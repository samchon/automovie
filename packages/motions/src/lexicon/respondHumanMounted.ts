import { Quaternion, getConstraint } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";

/** Standard gravity, metres per second squared. */
const GRAVITY: number = 9.80665;

/** The trunk joints that share the response, and each one's share of it. */
const SHARES: readonly (readonly ["spine" | "chest", number])[] = [
  ["spine", 0.6],
  ["chest", 0.4],
];

/**
 * A mounted rider's seat response to the carrier's own pitch and roll (#3940): the trunk leans against the carrier's turn away from its attitude when the performance began, so the rider leans forward while the horse rears and back while it bucks, and bends against a roll; it also leans into the carrier's surge, forward as a horse bolts and back as it pulls up. The share is the author's (`IAutoMovieMotionHumanMounted.respond`); 1 keeps the trunk's inclination in space as it was.
 *
 * The turn is read as the carrier's pitch and roll in the posture convention (`resolveHumanPosture.angles`) of its rotation now against its rotation at the start, and spread over the spine and the chest, six and four tenths, each held within its own range of motion (`getConstraint`).
 *
 * @param body The body.
 * @param posture The posture in the carrier's frame.
 * @param start The carrier's rotation when the performance began.
 * @param now The carrier's rotation now.
 * @param share How much of the turn the trunk cancels, 0 to 1.
 * @param reach How much of the forward lean that brings the holding hands in reach the trunk takes, 0 to 1; all of it when absent.
 * @param surge The carrier's forward acceleration, metres per second squared (`HumanMountedFrame.surge`): the trunk leans forward into a surge and back against a pull-up, by the angle whose tangent is the acceleration over gravity, so the felt vertical stays along it.
 * @param grips Where the holding hands' contacts are now, in the carrier frame: the trunk leans forward as far as brings them in reach after the response (`HumanMountRider.lean`).
 * @returns The posture with its trunk joints leant against the turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the response, its frame, its share and how it is spread.
 * @evidence contracts/development/implementation.md#principled-implementation The carrier's relative rotation read as pitch and roll, and its surge as the inclination of gravity plus the inertial force (atan of the acceleration over g); the trunk's flexion takes the surge lean less the pitch and its lateral bend the negative roll, scaled by the share and spread over two joints, each clamped to its range.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One relative rotation, one pass over two joints, then the reach lean the ride uses.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A joint at its range stops there; the pelvis stays on the saddle, carried as it is.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read per sample.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function respondHumanMounted(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  start: IAutoMovieQuaternion,
  now: IAutoMovieQuaternion,
  share: number,
  grips: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
  surge: number,
  reach: number = 1,
): IAutoMovieMotionHumanPosture {
  if (share === 0) return posture;
  // Leaning with a surge by the angle whose tangent is the acceleration over gravity keeps the trunk along the felt vertical.
  const lean: number = (Math.atan2(surge, GRAVITY) * 180) / Math.PI;
  const turn: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll"> =
    resolveHumanPosture.angles(
      Quaternion.multiply(now, Quaternion.inverse(start)),
    );
  const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
  for (const [bone, part] of SHARES) {
    const limits: ReturnType<typeof getConstraint> = getConstraint(
      bone,
      readHumanBone(body, bone)?.constraint ?? null,
    );
    const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
    const flex: number = was[0] + share * part * (lean - turn.pitch);
    const bend: number = was[1] - share * part * turn.roll;
    joints[bone] = [
      clamp(flex, limits?.flexion),
      clamp(bend, limits?.abduction),
      was[2],
    ];
  }
  const leant: IAutoMovieMotionHumanPosture = { ...posture, joints };
  return reach === 0
    ? leant
    : HumanMountRider.leant(
        leant,
        reach * HumanMountRider.lean(body, leant, grips),
      );
}

/** A joint range of the engine's constraint table. */
type Range = NonNullable<ReturnType<typeof getConstraint>>["flexion"];

/** A value held within a range; unchanged where the joint has none. */
function clamp(value: number, range: Range | undefined): number {
  return range === null || range === undefined
    ? value
    : Math.max(range.min, Math.min(range.max, value));
}
