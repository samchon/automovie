import type { IAutoMovieHumanBodyBasis } from "../../../structures/IAutoMovieHumanBodyBasis";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Admit a basis's declared pelvifemoral rhythm, or its absence.
 *
 * Called by `assertHumanBodyRig` after the joints and couplings are known valid, so every bone it names resolves to a declared joint. The rhythm turns the root and the lumbar joint and subtracts from both hips (see `IAutoMovieHumanBodyBasis.pelvifemoral`), which is only a rotation about the hip centres when all three hang from the root; the lumbar joint and both upper legs must therefore be children of the root with an open flexion axis. The curve is data the builder evaluates without judging it: a nonblank id, at least two finite knots strictly increasing in flexion, the first at or above the legs' rest flexion with a zero ordinate (so the rest and every extension add nothing), nonnegative nondecreasing ordinates (a tilt that fell while the thigh rose would turn the pelvis forward during a lift), and the lumbar joint's rest plus each ordinate inside its flexion range, so the rhythm alone never produces a lumbar angle the pose validator refuses. A coupling that drives a leg's or the lumbar joint's flexion would add to the same axis twice and is refused.
 *
 * Murray et al. 2002 (doi:10.1016/S0268-0033(01)00115-2) measured a pelvic contribution to standing unilateral hip flexion; Dewberry et al. 2003 measured a task-dependent range in suspended bilateral flexion. These observations motivate coordination, not one universal ratio. This function admits a declared curve; it does not fit that curve to a person or prove clearance between thigh and abdomen in deep flexion.
 *
 * @evidence contracts/common.md#principled-implementation Under prior joint/coupling admission, root-child mobile axes and an ordered zero-at-rest monotone curve constrain declared sagittal coordination inside lumbar reach.
 * @evidence contracts/common.md#clear-and-simple-design One rhythm stage owns curve/hierarchy compatibility and refuses duplicate flexion coupling before the pose resolver applies pelvic turns.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A declared curve remains authored task coordination, not a fitted individual's clinical ratio or thigh-abdomen clearance proof.
 * @evidence contracts/common.md#meaningful-documentation The prose states prior-admission premises, rest/extension behavior, root-child requirement and unsupported universal-ratio interpretation.
 * @evidence contracts/performance.md#efficient-algorithms Building a J-joint map and scanning K knots plus C couplings costs O(J+K+C), with O(J) temporary storage and constant-size axis checks.
 * @evidence contracts/performance.md#reuse-equivalent-work One joint map supplies lumbar and both hip checks; admitted inputs are reread rather than caching rhythm validity across changing bases.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Joint maps, chain and temporary readings expire after synchronous admission; the basis curve remains caller-owned and unchanged.
 */
export function assertHumanBodyPelvifemoral(
  basis: Pick<
    IAutoMovieHumanBodyBasis,
    "joints" | "couplings" | "pelvifemoral"
  >,
): void {
  const rhythm: IAutoMovieHumanBodyBasis["pelvifemoral"] = basis.pelvifemoral;
  if (rhythm === undefined) return;
  const joints: Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBasis["joints"][number]> = new Map(basis.joints.map((joint: IAutoMovieHumanBodyBasis["joints"][number]): [AutoMovieHumanoidBone, IAutoMovieHumanBodyBasis["joints"][number]] => [joint.bone, joint]));
  const root: AutoMovieHumanoidBone = basis.joints[0].bone;
  const chain: readonly AutoMovieHumanoidBone[] = [rhythm.lumbar, "leftUpperLeg", "rightUpperLeg"];
  const lumbar: IAutoMovieHumanBodyBasis["joints"][number] | undefined = joints.get(rhythm.lumbar);
  const range: NonNullable<IAutoMovieHumanBodyBasis["joints"][number]["constraint"]>["flexion"] = lumbar?.constraint?.flexion ?? null;
  const rest: number = Math.max(
    ...(["leftUpperLeg", "rightUpperLeg"] as const).map(
      (leg: "leftUpperLeg" | "rightUpperLeg"): number => joints.get(leg)?.neutral.flexion ?? Number.NaN,
    ),
  );
  const curve: NonNullable<IAutoMovieHumanBodyBasis["pelvifemoral"]>["curve"] = rhythm.curve;
  if (
    rhythm.id.trim() === "" ||
    chain.some((bone: AutoMovieHumanoidBone): boolean => {
      const joint: IAutoMovieHumanBodyBasis["joints"][number] | undefined = joints.get(bone);
      return (
        joint === undefined ||
        joint.parent !== root ||
        (joint.constraint?.flexion ?? null) === null
      );
    }) ||
    (basis.couplings ?? []).some(
      (coupling: NonNullable<IAutoMovieHumanBodyBasis["couplings"]>[number]): boolean =>
        coupling.output.axis === "flexion" &&
        (chain as readonly string[]).includes(coupling.output.bone),
    ) ||
    range === null ||
    curve.length < 2 ||
    !(curve[0][0] >= rest) ||
    curve[0][1] !== 0 ||
    curve.some(
      ([flexion, tilt]: readonly [number, number], i: number): boolean =>
        !Number.isFinite(flexion) ||
        !Number.isFinite(tilt) ||
        (i > 0 && (flexion <= curve[i - 1][0] || tilt < curve[i - 1][1])) ||
        lumbar!.neutral.flexion + tilt > range.max,
    )
  )
    throw new Error(
      "A body pelvifemoral rhythm needs an id, root-child lumbar and upper-leg joints with open flexion no coupling drives, and an increasing zero-at-rest nondecreasing curve inside the lumbar range: " +
        rhythm.id,
    );
}
