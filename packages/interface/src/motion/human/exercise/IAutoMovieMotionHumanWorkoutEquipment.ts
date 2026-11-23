/**
 * The exercises of the workout law that are done on a box or a bench the author
 * names (`on`): the step-up, the incline push-up (the hands on the bench), the
 * decline push-up (the feet on it) and the hip thrust (the upper back on its
 * edge).
 *
 * Each solves its angles from the support's own height: a step-up's knee bends
 * as far as lifts the foot onto the box with the other leg straight, and a
 * push-up's pitch puts the shoulders the arm's reach above the hands with the
 * toes where they bear. A hip thrust's back turns about the chest's joint over
 * the bench's edge: at the lockout the trunk and the thighs are one line over
 * upright shanks, pitched as the edge's height asks, and at the bottom the legs
 * are solved in the sagittal plane onto the same place of the feet. The hip
 * thrust is the one Contreras et al. describe (Journal of Applied Biomechanics
 * 32:254-260, 2016, Methods and Figure 1): the back on a bench about 16 inches
 * high, the feet flat, full hip extension at the top; `RISEN`, `SUNK` and
 * `DROP` are not from it. The part that bears on the prop is pinned on the
 * prop's place; the other is kept by the angles.
 *
 * With no support named, the kind is done on an imagined one a quarter of the
 * stature high, so the row still plans alone.
 *
 * First pass: a step-up stays on the box's edge, the trailing foot hanging
 * beside it, and does not step down the far side; the feet of an incline
 * push-up and the palms' turn of a decline one are the keys', not solved onto
 * the floor; a hip thrust's feet are on their place at the bottom and at the
 * lockout and follow the blend of the angles between, the back does not roll on
 * the edge, and nothing lies across the hips; every angle not solved is
 * provisional (NSCA's Essentials of Strength Training and Conditioning, 4th
 * ed., for the exercises' positions).
 */
export namespace IAutoMovieMotionHumanWorkoutEquipment {
  /** The exercises' names. */
  export type Name = "stepUp" | "inclinePushUp" | "declinePushUp" | "hipThrust";
}
