/**
 * A thumb or finger identified by the performer's own side. Digit goals and
 * motion channel claims use the same closed vocabulary.
 */
export type AutoMovieHumanDigit = (readonly [
  "leftThumb",
  "leftIndex",
  "leftMiddle",
  "leftRing",
  "leftLittle",
  "rightThumb",
  "rightIndex",
  "rightMiddle",
  "rightRing",
  "rightLittle",
])[number];
