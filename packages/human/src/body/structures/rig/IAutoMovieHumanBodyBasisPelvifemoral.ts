import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * The declared pelvifemoral rhythm: the posterior pelvic tilt that goes
 * with hip flexion, applied by the builder after the couplings
 * (`resolveHumanBodyPelvifemoralRhythm`, called inside
 * `resolveHumanBodyCouplings`).
 *
 * With a rhythm declared, each upper leg's document flexion is the thigh's
 * flexion relative to the trunk, the angle a goniometer reads without
 * stabilizing the pelvis, rather than the femur's angle to the pelvis.
 * Standing unilateral hip flexion carries the pelvis with it: Murray et al.
 * 2002 (Clin Biomech 17:147, doi:10.1016/s0268-0033(01)00115-2) measured
 * pelvic rotation contributing 18.1% of the change in hip flexion,
 * throughout the movement, with the stance thigh held vertical; Tully et al.
 * 2002 (Spine 27:E432) measured lumbar flexion concurrent with it. The curve
 * maps the larger of the two legs' trunk-relative flexions to the tilt `T`;
 * the pelvis turns posteriorly by `T` about the line through both hip
 * centres (the root's flexion gains `-T` and the body is translated so the
 * hip centres do not move), the lumbar joint's flexion gains `+T` so the
 * trunk keeps its orientation, and each hip's pelvic-relative flexion is its
 * document flexion minus `T`, so the lifted thigh reaches the authored
 * direction and the other thigh stays where the author put it. One tilt for
 * both legs is what a pelvis can do; the bilateral lift shares the larger
 * side's tilt, which the declared curve must justify for the tasks it is
 * cited for (Dewberry et al. 2003, Clin Biomech 18:494, measured 13.1 to
 * 35.5% for suspended bilateral flexion, depending on knee position and
 * hamstring length).
 * These studies justify task-dependent coordination, not one universal
 * pelvis-to-hip ratio for every body, age or knee pose. The basis owns its
 * declared curve and the admission constraints below; the curve's validity
 * across its supported shape and pose population still needs measurement.
 * The connected study's `couplings-receipt.json` records its authored knots.
 *
 * A trunk-relative flexion past the leg's clinical range is refused, and so
 * is a resulting pelvic-relative or lumbar angle past its own range; nothing
 * is clamped. Correctives driven by a hip or the lumbar joint read the
 * document's coupled angles (the hips trunk-relative): the tilt is a
 * function of those, so a ramp on them is a ramp on the whole
 * configuration, and the thigh's contact with the belly and chest follows
 * the trunk-relative angle rather than the pelvic-relative one. A basis
 * without the field poses hips pelvic-relative as before. Admission (`assertHumanBodyPelvifemoral`) requires both upper
 * legs and the lumbar joint to be children of the root with open flexion,
 * a nonblank id, at least two finite knots strictly increasing in flexion,
 * the first at or above the legs' rest flexion with a zero ordinate,
 * nondecreasing nonnegative ordinates and every `rest + ordinate` of the
 * lumbar joint inside its flexion range, and no coupling driving a leg's or
 * the lumbar joint's flexion.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisPelvifemoral {
  /** Name shown beside the rows it moves. */
  id: string;

  /** The lumbar joint whose flexion restores the trunk. */
  lumbar: AutoMovieHumanoidBone;

  /** `[trunk-relative hip flexion, posterior pelvic tilt]` knots in degrees. */
  curve: [number, number][];
}
