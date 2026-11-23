# src/motion/human/posture/IAutoMovieHumanLimbReference.ts#IAutoMovieHumanLimbReference

## @evidence contracts/development/common.md#meaningful-documentation

A fixed upper/lower limb configuration in clinical degrees, with its optional fit weight. Laws retain a named plan instant's configuration rather than a previous evaluated frame.

## @evidence contracts/development/design.md#principled-representation

upper: The upper bone's `[flexion, abduction, twist]`, degrees. lower: The lower bone's `[flexion, abduction, twist]`, degrees. weight: How much a degree of joint turn from the reference counts, in degrees of hand or foot rotation error (the engine's `referenceWeight`); 1 when omitted. A reach toward the reference's instant raises it from 0 to 1.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveHumanPosture.reference produces fixed plan references used by grasping, handover and striking; the upper/lower clinical angle tuple keeps the same identity at each boundary.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reference is tied to a named plan instant, never a prior evaluated frame. The solver interprets omitted weight as one and owns fit feasibility.
