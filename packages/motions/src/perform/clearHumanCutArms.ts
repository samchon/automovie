import { ROM_TOLERANCE, getConstraint } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { HumanDigitFit } from "../posture/HumanDigitFit";
import { poseBones } from "../posture/poseBones";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

/**
 * A cut's inertialized pose with each free arm's digits kept clear of the
 * body. Inertialization (Bollo 2016, Gears of War 4; Bollo 2018) adds to the
 * next action's pose the offset of the pose it leaves, decaying to zero over
 * the blend, so an arm falling from a strike to a hanging stand is shown on
 * a path neither action planned, and its curled fingers can pass through
 * the thigh the hanging arm itself clears. The offset stays as it decays;
 * only where a free arm (one the posture writes by joint angles, with no
 * hand goal for a fit to clear) sinks its digits deeper than the target pose
 * itself does is that arm's shoulder let out by the least abduction that
 * brings the depth back to the target's, found by bisection to the
 * engine's joint resolution, as a hanging arm's clearance is
 * (`standClearArms`). An arm the offset leaves clear is unchanged, so the
 * pose stays continuous wherever the offset already keeps the body clear.
 *
 * @param body The body.
 * @param shown The inertialized pose.
 * @param target The target's pose at the same second, before the offset.
 * @param posture The target's posture: an arm with a hand goal is left to its fit.
 * @param prepared The evaluation's FK reader.
 * @returns The pose, its free arms' shoulders let out where the offset sank their digits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the defect of an inertialized path, which arms are read, the allowance, the search and what is left unchanged.
 * @evidence contracts/development/implementation.md#principled-implementation The signed digit depth (HumanDigitFit) against the target's own, the shoulder abduction bisected inside its range: the hanging arm's clearance rule applied to the shown arm.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two depth reads per free arm while a cut's offset is live, and a bisection only for an arm that sinks.
 */
export function clearHumanCutArms(
  body: IAutoMovieMotionHumanBody,
  shown: IAutoMoviePose,
  target: IAutoMoviePose,
  posture: IAutoMovieMotionHumanPosture,
  prepared: ReturnType<typeof prepareHumanPoseResolution>,
): IAutoMoviePose {
  let out: IAutoMoviePose = shown;
  for (const side of SIDES) {
    if (posture.limbs[`${side}Arm`] !== undefined) continue;
    const depth = (pose: IAutoMoviePose): number =>
      HumanDigitFit.depth(body, poseBones(body, pose, prepared()), side);
    const allowed: number = Math.max(0, depth(target));
    if (!(depth(out) > allowed)) continue;
    const range: IAutoMovieAngleRange | null | undefined = getConstraint(
      `${side}UpperArm`,
      readHumanBone(body, `${side}UpperArm`)?.constraint ?? null,
    )?.abduction;
    const record: IAutoMovieJointPose | undefined = out.joints.find(
      (j: IAutoMovieJointPose): boolean => j.bone === `${side}UpperArm`,
    );
    if (range === null || range === undefined || record === undefined) continue;
    const abducted = (abduction: number): IAutoMoviePose => ({
      ...out,
      joints: out.joints.map(
        (j: IAutoMovieJointPose): IAutoMovieJointPose =>
          j === record ? { ...j, abduction } : j,
      ),
    });
    let lo: number = record.abduction ?? 0;
    let hi: number = range.max;
    if (depth(abducted(hi)) > allowed) continue;
    while (hi - lo > ROM_TOLERANCE) {
      const mid: number = (lo + hi) / 2;
      if (depth(abducted(mid)) > allowed) lo = mid;
      else hi = mid;
    }
    out = abducted(hi);
  }
  return out;
}

/** Both arms. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
