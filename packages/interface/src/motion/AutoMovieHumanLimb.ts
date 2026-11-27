/**
 * An anatomical limb identified by the performer's own side. Motion channel
 * ownership, limb goals and posture fitting use this closed vocabulary.
 */
export type AutoMovieHumanLimb = (readonly [
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
])[number];
