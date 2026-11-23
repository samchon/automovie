/**
 * The carries in which the carried body trails on the floor: the armpit drag,
 * the collar drag and the ankle drag. Each is a row of `HumanCarried.CARRIES`,
 * read by `borne` and `bearing` like any carry; the dragger walks backward
 * under `bearing`.
 *
 * Every angle and offset is provisional, set from the drags' common
 * descriptions in first-aid manuals (American Red Cross, First Aid/CPR/AED
 * Participant's Manual, emergency moves): armpit drag, the upper back against
 * the dragger's front, reclined; collar (clothes) drag, on the back, the head
 * between the dragger's forearms, pulled by the clothing behind the neck; ankle
 * drag, on the back, pulled feet first by both ankles.
 *
 * First pass: the dragger does not stoop or lean against the load (`bearing`
 * claims the arms only), so the collar and the ankles are held at the height
 * straight arms reach standing, higher than a stooped rescuer holds them; a
 * carry rests one region on one region, so the collar drag's neck lies before
 * the dragger's left thigh and the ankle drag's left calf before the right one,
 * off the midline by half the hips; the dragged body is rigid and its trailing
 * part is not laid on the floor by a contact solve.
 */
export namespace IAutoMovieMotionHumanCarriedDrag {
  /** A drag's name. */
  export type Name = "armpitDrag" | "collarDrag" | "ankleDrag";
}
