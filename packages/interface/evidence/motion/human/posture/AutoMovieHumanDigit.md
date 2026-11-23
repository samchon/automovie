# src/motion/human/posture/AutoMovieHumanDigit.ts#AutoMovieHumanDigit

## @evidence contracts/development/common.md#meaningful-documentation

A thumb or finger identified by the performer's own side. Digit goals and motion channel claims use the same closed vocabulary.

## @evidence contracts/development/design.md#principled-representation

Closed choices "leftThumb", "leftIndex", "leftMiddle", "leftRing", "leftLittle", "rightThumb", "rightIndex", "rightMiddle", "rightRing", "rightLittle" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanDigitFit and motion channel composition share ten sided digit identifiers, independently of the Human package's digit calibration records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal union adds no runtime object or SDK dependency. HumanPosture's runtime DIGITS list and channel composition must implement exactly these choices.
