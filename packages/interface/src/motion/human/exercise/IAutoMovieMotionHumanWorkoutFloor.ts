/**
 * The exercises of the workout law done on the hands and the toes or feet : the
 * push-up, the plank, the mountain climber, the burpee, the downward dog and
 * the cobra.
 *
 * A prone support's pitch is solved on the body: the shoulders stand a share of
 * the arm's length above the floor over the toes (`plank`). Every other angle
 * is provisional, read off the exercise's usual description (ACSM's Guidelines,
 * 11th ed.; NSCA's Essentials of Strength Training, 4th ed.).
 *
 * First pass: the palms are laid where the first posture's angles put the
 * hands, so a body whose proportions differ from the keys' shows it in the
 * elbows; a burpee has no jump.
 */
export namespace IAutoMovieMotionHumanWorkoutFloor {
  /** The exercises' names. */
  export type Name =
    | "pushUp"
    | "widePushUp"
    | "plank"
    | "mountainClimber"
    | "burpee"
    | "downwardDog"
    | "cobra";
}
