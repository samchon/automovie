/**
 * The exercises of the workout law done lying, sitting on the floor or on
 * furniture: on the back (sit-up, crunch, glute bridge, a partner's hamstring
 * stretch), on a side (side plank), sitting on the floor (the forward fold and
 * the hurdler's stretch) and on furniture as high as the body needs (the bench
 * press, the rowing machine, the stationary bicycle).
 *
 * Every angle is provisional, read off the exercise's usual description (ACSM's
 * Guidelines, 11th ed.; NSCA's Essentials of Strength Training, 4th ed.).
 *
 * First pass: the bench, the rower's seat and rail and the bicycle are not
 * props, so nothing is shown under the body; a barbell is not held; a bridge's
 * shoulders and a side plank's forearm are kept by the angles alone and may
 * slide by the difference between the keys. The side plank's roll is solved on
 * the body so its forearm rests on the floor level with its feet.
 */
export namespace IAutoMovieMotionHumanWorkoutLying {
  /** The exercises' names. */
  export type Name =
    | "sitUp"
    | "crunch"
    | "gluteBridge"
    | "pnfHamstring"
    | "sidePlank"
    | "seatedFold"
    | "hurdlerStretch"
    | "benchPress"
    | "rowing"
    | "cycling";
}
