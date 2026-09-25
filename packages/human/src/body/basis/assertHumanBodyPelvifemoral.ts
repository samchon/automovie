import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

/**
 * Admit a basis's declared pelvifemoral rhythm, or its absence.
 *
 * Called by `assertHumanBodyRig` after the joints and couplings are known
 * valid, so every bone it names resolves to a declared joint. The rhythm
 * turns the root and the lumbar joint and subtracts from both hips (see
 * `IAutoMovieHumanBodyBasis.pelvifemoral`), which is only a rotation about
 * the hip centres when all three hang from the root; the lumbar joint and
 * both upper legs must therefore be children of the root with an open
 * flexion axis. The curve is data the builder evaluates without judging it:
 * a nonblank id, at least two finite knots strictly increasing in flexion,
 * the first at or above the legs' rest flexion with a zero ordinate (so the
 * rest and every extension add nothing), nonnegative nondecreasing
 * ordinates (a tilt that fell while the thigh rose would turn the pelvis
 * forward during a lift), and the lumbar joint's rest plus each ordinate
 * inside its flexion range, so the rhythm alone never produces a lumbar
 * angle the pose validator refuses. A coupling that drives a leg's or the
 * lumbar joint's flexion would add to the same axis twice and is refused.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Refuses a pelvic rhythm whose chain, range or curve could not be evaluated as declared.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Checks the root-child chain, open flexion axes, the zero-at-rest nondecreasing curve inside the lumbar range and the absence of a second driver.
 */
export function assertHumanBodyPelvifemoral(
  basis: Pick<
    IAutoMovieHumanBodyBasis,
    "joints" | "couplings" | "pelvifemoral"
  >,
): void {
  const rhythm = basis.pelvifemoral;
  if (rhythm === undefined) return;
  const joints = new Map(basis.joints.map((joint) => [joint.bone, joint]));
  const root = basis.joints[0].bone;
  const chain = [rhythm.lumbar, "leftUpperLeg", "rightUpperLeg"] as const;
  const lumbar = joints.get(rhythm.lumbar);
  const range = lumbar?.constraint?.flexion ?? null;
  const rest = Math.max(
    ...(["leftUpperLeg", "rightUpperLeg"] as const).map(
      (leg) => joints.get(leg)?.neutral.flexion ?? Number.NaN,
    ),
  );
  const curve = rhythm.curve;
  if (
    rhythm.id.trim() === "" ||
    chain.some((bone) => {
      const joint = joints.get(bone);
      return (
        joint === undefined ||
        joint.parent !== root ||
        (joint.constraint?.flexion ?? null) === null
      );
    }) ||
    (basis.couplings ?? []).some(
      (coupling) =>
        coupling.output.axis === "flexion" &&
        (chain as readonly string[]).includes(coupling.output.bone),
    ) ||
    range === null ||
    curve.length < 2 ||
    !(curve[0][0] >= rest) ||
    curve[0][1] !== 0 ||
    curve.some(
      ([flexion, tilt], i) =>
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
