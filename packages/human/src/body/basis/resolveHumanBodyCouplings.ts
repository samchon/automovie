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
