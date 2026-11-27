import { ROM_TOLERANCE, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { readHumanBone } from "../../body/internal/readHumanBone";
import { HumanDigitFit } from "../../posture/internal/HumanDigitFit";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { standRelaxed } from "./standRelaxed";

/*
 * The relaxed hanging arms of a body over the stance it actually stands in: the
 * quiet stance's relaxed arms (`standRelaxed`), each shoulder abducted further
 * by the least angle that leaves that hand's digits clear of the body in this
 * stance. The relaxed arm's rule is the least abduction that hangs the hand
 * beside the thigh with its digits clear; a stance whose thighs lie elsewhere
 * than the quiet stance's (a fighting stance's staggered feet, a wide stance)
 * moves the thigh under the hand, so the rule is read again on the thighs as
 * they stand. An arm already clear keeps the quiet abduction, so a stance near
 * the quiet one hangs its arms as every other stand does.
 * Parameter body: The body.
 * Parameter stances: The standing postures the arms hang in, clear of every one (a
 * stand's entry and settled stances, the ends of its settle); their own arm
 * and digit angles are replaced.
 * Returns: The two arms' and hands' clinical angles.
 * When the shoulder has no abduction range.
 */
export function standClearArms(
  body: IAutoMovieMotionHumanBody,
  stances: readonly IAutoMovieMotionHumanPosture[],
): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
  const quiet: Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > = standRelaxed(body);
  const prepared: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const clampJoint: ReturnType<typeof prepareHumanPostureProjection.joints> =
    prepareHumanPostureProjection.joints(body, projection);
  const readers: Sinks[] = stances.map(
    (stance: IAutoMovieMotionHumanPosture): Sinks =>
      sinking(body, stance, quiet, prepared, projection, clampJoint),
  );
  const sinks: Sinks = (side: AutoMovieHumanSide, abduction: number): boolean =>
    readers.some((read: Sinks): boolean => read(side, abduction));

  const out: Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > = { ...quiet };
  for (const side of ["left", "right"] as const) {
    const from: number = quiet[`${side}UpperArm`]![1];
    if (!sinks(side, from)) continue;
    const range: IAutoMovieAngleRange | null | undefined = AutoMovieEngineKinematics.getConstraint(
      `${side}UpperArm`,
      readHumanBone(body, `${side}UpperArm`)?.constraint ?? null,
    )?.abduction;
    if (range === null || range === undefined)
      throw new Error("The shoulder has no abduction range to hang the arm in");
    let lo: number = from;
    let hi: number = range.max;
    while (hi - lo > ROM_TOLERANCE) {
      const mid: number = (lo + hi) / 2;
      if (sinks(side, mid)) lo = mid;
      else hi = mid;
    }
    out[`${side}UpperArm`] = [0, hi, 0];
  }
  return out;
}

/*
 * Whether a side's hand, hung at an abduction, sinks its digits into the body
 * in one stance.
 */
type Sinks = (side: AutoMovieHumanSide, abduction: number) => boolean;

/*
 * The digit-depth reader of one stance: resolved once, a candidate re-clamping
 * one upper arm's record.
 */
function sinking(
  body: IAutoMovieMotionHumanBody,
  stance: IAutoMovieMotionHumanPosture,
  quiet: Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  >,
  prepared: ReturnType<typeof prepareHumanPoseResolution>,
  projection: ReturnType<typeof prepareHumanPostureProjection>,
  clampJoint: ReturnType<typeof prepareHumanPostureProjection.joints>,
): Sinks {
  const hung: IAutoMovieMotionHumanPosture = {
    ...stance,
    joints: { ...stance.joints, ...quiet },
  };
  const resolved: IAutoMoviePose = resolveHumanPosture.seeded(
    body,
    hung,
    undefined,
    undefined,
    prepared,
    undefined,
    projection,
  ).pose;

  // The stated relaxed shape, before any clearing of the resolver's.
  const shaped: IAutoMoviePose = {
    ...resolved,
    joints: resolved.joints.map(
      (j: IAutoMovieJointPose): IAutoMovieJointPose => {
        const a: readonly [number, number, number] | undefined = quiet[j.bone];
        return a === undefined || !DIGIT.test(j.bone)
          ? j
          : { bone: j.bone, flexion: a[0], abduction: a[1], twist: a[2] };
      },
    ),
  };

  // A candidate differs from the resolved stance in one upper arm's direct
  // record; without the projector's one-joint owner the whole stance
  // resolves again.
  const posed = (
    side: AutoMovieHumanSide,
    abduction: number,
  ): IAutoMoviePose => {
    const bone: AutoMovieHumanoidBone = `${side}UpperArm`;
    if (clampJoint !== undefined)
      return {
        ...shaped,
        joints: shaped.joints.map(
          (j: IAutoMovieJointPose): IAutoMovieJointPose =>
            j.bone === bone
              ? clampJoint({ bone, flexion: 0, abduction, twist: 0 })
              : j,
        ),
      };
    const again: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      {
        ...hung,
        joints: { ...hung.joints, [bone]: [0, abduction, 0] as const },
      },
      undefined,
      undefined,
      prepared,
      undefined,
      projection,
    ).pose;
    return {
      ...again,
      joints: again.joints.map(
        (j: IAutoMovieJointPose): IAutoMovieJointPose =>
          DIGIT.test(j.bone)
            ? (shaped.joints.find(
                (k: IAutoMovieJointPose): boolean => k.bone === j.bone,
              ) ?? j)
            : j,
      ),
    };
  };
  return (side: AutoMovieHumanSide, abduction: number): boolean =>
    HumanDigitFit.depth(
      body,
      poseBones(body, posed(side, abduction), prepared()),
      side,
    ) > 0;
}

/*
 * A digit's bone.
 */
const DIGIT: RegExp = /(Thumb|Index|Middle|Ring|Little)/;
