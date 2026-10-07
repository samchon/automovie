import { swingConeAngle } from "@automovie/engine";
import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";
import type { IHumanBodyCouplingResult } from "./IHumanBodyCouplingResult";
import { evaluateHumanBodyRhythmCurve } from "./evaluateHumanBodyRhythmCurve";
import { resolveHumanBodyPelvifemoralRhythm } from "./resolveHumanBodyPelvifemoralRhythm";

/**
 * Add the basis's declared couplings to a document's clinical pose.
 *
 * This is the one owner of the coupling evaluation. `humanBodyBasisWeights`
 * calls it so a corrective's joint ramp reads the coupled angle, the builder
 * poses the returned joints, and the body editor calls it on the draft to
 * print each addition beside the joint row, so what the editor shows is by
 * construction what the builder applied. The document is not mutated and no
 * addition is written back to it: the returned joints are fresh entries, the
 * document's joints copied and the coupled entries added or replaced.
 *
 * Per coupling, in basis order: an upper-arm source reads the document's TT
 * total humerothoracic elevation, or its measured A-pose elevation when
 * omitted. Other sources retain the engine's `swingConeAngle` of clinical
 * flexion and abduction, with absent or null axes at rest. The curve gives
 * zero at and below its
 * first knot, which admission places at or above the source's rest
 * elevation so the rest, the hanging arm and every pose below the rest add
 * nothing, the linear interpolation between the two knots that bracket the
 * elevation, and the last ordinate past the last knot. A zero ordinate
 * changes nothing, which keeps a document below every onset identical to what
 * the builder posed before couplings existed. A nonzero ordinate is added to
 * the output joint's angle on the output axis, the document's angle when the
 * document poses that axis and the rest angle otherwise, and the entry is
 * placed where the document's entry was or appended when the document did not
 * pose that joint; a second coupling into the same joint finds the entry the
 * first one added. Admission forbids an output joint that is any coupling's
 * source, so reading every source from the document rather than from the
 * running result is exact and the order of the couplings cannot matter.
 *
 * The returned joints are the coupled document angles: with a declared
 * pelvifemoral rhythm the legs' flexion stays trunk-relative, which is what
 * forward kinematics and the corrective ramps read. The rhythm's additions
 * (the root's posterior tilt, the lumbar joint's and the hips' pelvic-relative
 * change, `resolveHumanBodyPelvifemoralRhythm`) join the contribution list
 * for the editor as coordination increments. The builder turns the pelvis
 * by that tilt, then reads and validates the actual changed parent-relative
 * coordinates through its shared pose resolver. Combined clinical totals
 * need not equal those scalar additions.
 *
 * The sum is not judged here. A duplicate joint in the document stays
 * duplicated (its first entry receives the addition), an unknown joint stays
 * unknown, and a sum past the output axis's range stays past it, so the
 * engine's pose validation refuses each of them in the builder as it did
 * before, with the coupled angle in the diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation Each coupling adds a piecewise-linear function of its source's elevation to an output axis: zero at and below the first knot, linear inside the bracketing segment, the last ordinate held beyond, with a nanodegree tolerance at the first knot for the cone formula's float error. For a TT shoulder source the elevation is the document's goal, else the shaped rest in `shoulderRest`, else the basis's A-pose, so an omitted goal and the same rest written as a goal add the same angle; without a rest the omitted goal reads the A-pose and the two spellings differ, which the caller avoids by passing the rest. The sums are not judged here: the engine's pose validation refuses an out-of-range sum with the coupled angle in the diagnostic.
 * @evidence contracts/common.md#clear-and-simple-design One loop over the declared couplings with one curve evaluator and the pelvifemoral rhythm appended last; the rest is an optional map and no coupling reads anything else.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case by body, fixture or expected angle, and no foreign state is patched; the document's own joints are copied before an addition so the caller's entries are unchanged.
 * @evidence contracts/common.md#meaningful-documentation States what each coupling reads and adds, the unjudged sum, duplicate and unknown joint handling, the rhythm additions, the curve's knot behaviour and the rest an omitted goal reads.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines and groups no part; it adds coupled angles to joint rows.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive; it returns joint angles and their contributions.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; the builder poses the coupled angles.
 */
export function resolveHumanBodyCouplings(
  basis: Pick<
    IAutoMovieHumanBodyBasis,
    "joints" | "couplings" | "pelvifemoral"
  >,
  pose: readonly IAutoMovieJointPose[],
  shoulders: readonly IAutoMovieHumanBodyShoulderPose[] = [],
  shoulderRest: ReadonlyMap<
    IAutoMovieHumanBodyShoulderPose["bone"],
    IAutoMovieHumanBodyShoulderPose
  > = new Map(),
): IHumanBodyCouplingResult {
  const neutral = new Map(
    basis.joints.map((joint) => [joint.bone, joint.neutral]),
  );
  const joints = pose.map((joint) => ({ ...joint }));
  const contributions: ReturnType<
    typeof resolveHumanBodyCouplings
  >["contributions"] = [];
  for (const coupling of basis.couplings ?? []) {
    const rest = neutral.get(coupling.source.bone)!;
    const source = pose.find((joint) => joint.bone === coupling.source.bone);
    const shoulder = basis.joints.find(
      (joint) => joint.bone === coupling.source.bone,
    )?.shoulder;
    const elevation =
      shoulder === undefined
        ? swingConeAngle(
            source?.flexion ?? rest.flexion,
            source?.abduction ?? rest.abduction,
          )
        : (shoulders.find((one) => one.bone === coupling.source.bone)
            ?.elevation ??
          shoulderRest.get(
            coupling.source.bone as IAutoMovieHumanBodyShoulderPose["bone"],
          )?.elevation ??
          shoulder.neutral.elevation);
    const degrees = evaluateHumanBodyRhythmCurve(coupling.curve, elevation);
    if (degrees === 0) continue;
    const { bone, axis } = coupling.output;
    const index = joints.findIndex((joint) => joint.bone === bone);
    const current = index < 0 ? null : joints[index];
    const next: IAutoMovieJointPose = {
      bone,
      flexion: current?.flexion ?? null,
      abduction: current?.abduction ?? null,
      twist: current?.twist ?? null,
      [axis]: (current?.[axis] ?? neutral.get(bone)![axis]) + degrees,
    };
    if (index < 0) joints.push(next);
    else joints[index] = next;
    contributions.push({ coupling: coupling.id, bone, axis, degrees });
  }
  return {
    joints,
    contributions: [
      ...contributions,
      ...resolveHumanBodyPelvifemoralRhythm(basis, joints).contributions,
    ],
  };
}
