/**
 * The standing lifts and warm-up drills of the workout law: lifts shown without
 * their load (deadlift, back squat, kettlebell swing, overhead press) and
 * drills (arm circles, leg swings, butt kicks, the B-skip, the skipping rope's
 * hops).
 *
 * The feet stay where they stand: a key's legs are written by
 * `ExerciseKey.stood`, which keeps a foot level under a pitched trunk. A drill
 * that lifts a foot pins the pelvis or the standing foot instead. Every stated
 * angle is provisional, read off the exercise's usual description (ACSM's
 * Guidelines, 11th ed.; NSCA's Essentials of Strength Training, 4th ed.).
 *
 * First pass: no bar, bell or rope is held or moved unless the author names a
 * load; a deadlift's and an overhead press's bar then travels over the middle
 * of the feet (`WorkoutLoad`).
 */
export namespace IAutoMovieMotionHumanWorkoutStanding {
  /** The exercises' names. */
  export type Name =
    | "deadlift"
    | "backSquat"
    | "kettlebellSwing"
    | "overheadPress"
    | "armCircles"
    | "legSwings"
    | "buttKicks"
    | "bSkip"
    | "jumpRope";
}
