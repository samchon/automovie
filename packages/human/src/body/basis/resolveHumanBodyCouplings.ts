import { swingConeAngle } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

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
 * Per coupling, in basis order: the source's elevation is the engine's
 * `swingConeAngle` of its flexion and abduction travel from the joint's rest,
 * an absent entry or a null axis standing for the rest, so the empty document
 * has elevation zero on every joint. The curve then gives zero at and below
 * its first knot, the linear interpolation between the two knots that bracket
 * the elevation, and the last ordinate past the last knot. A zero ordinate
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
 * The sum is not judged here. A duplicate joint in the document stays
 * duplicated (its first entry receives the addition), an unknown joint stays
 * unknown, and a sum past the output axis's range stays past it, so the
 * engine's pose validation refuses each of them in the builder as it did
 * before, with the coupled angle in the diagnostic.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Applies the basis's declared joint couplings so an elevated arm moves its girdle with it, adding to the document's clinical angles without storing the addition in the document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Evaluates each coupling's elevation measure through the swing cone from the rest and its piecewise-linear curve, adding the ordinate to the output axis before the pose is validated.
 */
export function resolveHumanBodyCouplings(
  basis: Pick<IAutoMovieHumanBodyBasis, "joints" | "couplings">,
  pose: readonly IAutoMovieJointPose[],
): {
  /** The document's joints with every nonzero coupled ordinate added; the document's own entries when nothing is coupled. */
  joints: IAutoMovieJointPose[];

  /** Each nonzero addition, in coupling order, for the editor to show beside the joint row. */
  contributions: {
    coupling: string;
    bone: AutoMovieHumanoidBone;
    axis: "flexion" | "abduction" | "twist";
    degrees: number;
  }[];
} {
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
    const elevation = swingConeAngle(
      (source?.flexion ?? rest.flexion) - rest.flexion,
      (source?.abduction ?? rest.abduction) - rest.abduction,
    );
    const degrees = evaluateCurve(coupling.curve, elevation);
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
  return { joints, contributions };
}

/**
 * The piecewise-linear curve at one elevation: zero at and below the first
 * knot (the first ordinate is zero by admission, so the curve is continuous
 * there), linear inside the bracketing segment, the last ordinate held past
 * the last knot. Admission guarantees at least two knots strictly increasing
 * in elevation, so every segment has a nonzero width.
 */
function evaluateCurve(curve: [number, number][], elevation: number): number {
  if (!(elevation > curve[0][0])) return 0;
  for (let i = 1; i < curve.length; i++) {
    const [x0, y0] = curve[i - 1];
    const [x1, y1] = curve[i];
    if (elevation <= x1) return y0 + ((y1 - y0) * (elevation - x0)) / (x1 - x0);
  }
  return curve[curve.length - 1][1];
}
