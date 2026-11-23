/**
 * The standing poses and single acts of the workout law: stretches and yoga
 * poses (calf, chest, triceps, the lunge with a twist, warrior I and II, the
 * triangle, the standing half of a sun salutation), karate's front stance and
 * blocks, a footballer's header and traps, a dancer's turn and closed hold and
 * a thrower's turn.
 *
 * A split stance's front knee and a straddle's straight leg are solved on the
 * body so both feet reach the floor (`WorkoutStance`). Every stated angle is
 * provisional, read off the pose's usual description (ACSM's Guidelines, 11th
 * ed., for the stretches; Iyengar, Light on Yoga, for the poses; Nakayama,
 * Dynamic Karate, for the stance and the blocks).
 *
 * First pass: no ball is moved; a straddled foot's sideways tilt is not
 * flattened; a turn is one full turn on the left foot's ball without a rise
 * onto it; the partner of a closed hold or an underarm turn is not met.
 */
export namespace IAutoMovieMotionHumanWorkoutPoses {
  /** The exercises' names. */
  export type Name =
    | "calfStretch"
    | "chestStretch"
    | "tricepsStretch"
    | "lungeTwist"
    | "warriorOne"
    | "triangle"
    | "warriorTwo"
    | "sunSalutation"
    | "frontStance"
    | "lowBlock"
    | "risingBlock"
    | "header"
    | "chestTrap"
    | "thighTrap"
    | "spin"
    | "underarmTurn"
    | "hammerTurn"
    | "closedHold";
}
