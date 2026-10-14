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
 * This is the one owner of the coupling evaluation. `humanBodyBasisWeights` calls it so a corrective's joint ramp reads the coupled angle, the builder poses the returned joints, and the body editor calls it on the draft to print each addition beside the joint row, so what the editor shows is by construction what the builder applied. The document is not mutated and no addition is written back to it: the returned joints are fresh entries, the document's joints copied and the coupled entries added or replaced.
 *
 * Per coupling, in basis order: an upper-arm source reads the document's TT total humerothoracic elevation, then the supplied shaped shoulder-rest elevation when that goal is omitted, then the declared neutral elevation when neither is present. Other sources retain the engine's `swingConeAngle` of clinical flexion and abduction, with absent or null axes at declared rest. The shared curve gives zero at and below its first knot, interpolates between bracketing knots and holds its last ordinate above the final knot. Admission relates onset to declared source rest; it does not establish that every shaped shoulder rest lies below onset. A zero ordinate leaves the copied joint rows unchanged. A nonzero ordinate is added to the document's output-axis angle, or the declared neutral angle when that axis is omitted. Existing row placement is retained and a missing joint is appended. Admission forbids output joints that are coupling sources and duplicate writes to the same output joint/axis, so sources read the unchanged document and admitted repeated joints affect distinct axes. A later axis update retains earlier axis values. Joint insertion and contribution presentation follow basis order; no order-independent array representation is promised.
 *
 * The returned joints are the coupled document angles: with a declared pelvifemoral rhythm the legs' flexion stays trunk-relative, which is what forward kinematics and the corrective ramps read. The rhythm's additions (the root's posterior tilt, the lumbar joint's and the hips' pelvic-relative change, `resolveHumanBodyPelvifemoralRhythm`) join the contribution list for the editor as coordination increments. The builder turns the pelvis by that tilt, then reads and validates the actual changed parent-relative coordinates through its shared pose resolver. Combined clinical totals need not equal those scalar additions.
 *
 * The sum is not judged here. A duplicate joint in the document stays duplicated (its first entry receives the addition), an unknown joint stays unknown, and a sum past the output axis's range stays past it, so the engine's pose validation refuses each of them in the builder as it did before, with the coupled angle in the diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation Each admitted coupling reads its authored source elevation, evaluates the shared rhythm curve and adds that degree contribution to a copied output joint, while pelvic coordination increments remain separately reported.
 * @evidence contracts/common.md#clear-and-simple-design One ordered coupling traversal preserves source-document readout and output-row placement; the same returned coupled joints feed editor observations, corrective ramps and build pose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown or duplicate authored joints and over-range sums remain for authoritative pose refusal rather than being repaired; source/output separation is an admitted basis premise and reported scalar coordination is not actual combined clinical pose.
 * @evidence contracts/common.md#meaningful-documentation The prose states TT versus swing source readout, shaped then declared shoulder-rest defaults, curve onset limits, copied output rows, distinct-axis admission and later actual-frame validation.
 * @evidence contracts/performance.md#efficient-algorithms For C couplings, source and target lookup scan joints/pose/shoulders and each curve scans its knots; current worst-case work includes O(C times (J+P+S+K)) plus the pelvic owner, while only copied pose/contribution records are allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work A neutral-joint map serves all couplings, the shared curve and pelvic owners are reused, and each repeated output joint reads its current copied value rather than evaluating previous couplings again.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Copied joint rows and contribution records transfer to the caller; the neutral map and traversal scalars expire after return, with no retained document, external handle or pending work.
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
  const neutral: Map<
    IAutoMovieJointPose["bone"],
    (typeof basis.joints)[number]["neutral"]
  > = new Map(
    basis.joints.map(
      (
        joint: (typeof basis.joints)[number],
      ): [
        IAutoMovieJointPose["bone"],
        (typeof basis.joints)[number]["neutral"],
      ] => [joint.bone, joint.neutral],
    ),
  );
  const joints: IAutoMovieJointPose[] = pose.map(
    (joint: IAutoMovieJointPose): IAutoMovieJointPose => ({ ...joint }),
  );
  const contributions: ReturnType<
    typeof resolveHumanBodyCouplings
  >["contributions"] = [];
  for (const coupling of basis.couplings ?? []) {
    const rest: (typeof basis.joints)[number]["neutral"] = neutral.get(
      coupling.source.bone,
    )!;
    const source: IAutoMovieJointPose | undefined = pose.find(
      (joint: IAutoMovieJointPose): boolean =>
        joint.bone === coupling.source.bone,
    );
    const shoulder: (typeof basis.joints)[number]["shoulder"] =
      basis.joints.find(
        (joint: (typeof basis.joints)[number]): boolean =>
          joint.bone === coupling.source.bone,
      )?.shoulder;
    const elevation: number =
      shoulder === undefined
        ? swingConeAngle(
            source?.flexion ?? rest.flexion,
            source?.abduction ?? rest.abduction,
          )
        : (shoulders.find(
            (one: IAutoMovieHumanBodyShoulderPose): boolean =>
              one.bone === coupling.source.bone,
          )?.elevation ??
          shoulderRest.get(
            coupling.source.bone as IAutoMovieHumanBodyShoulderPose["bone"],
          )?.elevation ??
          shoulder.neutral.elevation);
    const degrees: number = evaluateHumanBodyRhythmCurve(
      coupling.curve,
      elevation,
    );
    if (degrees === 0) continue;
    const { bone, axis }: typeof coupling.output = coupling.output;
    const index: number = joints.findIndex(
      (joint: IAutoMovieJointPose): boolean => joint.bone === bone,
    );
    const current: IAutoMovieJointPose | null =
      index < 0 ? null : joints[index];
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
