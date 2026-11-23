# src/motion/human/posture/IAutoMovieHumanPostureRotation.ts#IAutoMovieHumanPostureRotation

## @evidence contracts/development/common.md#meaningful-documentation

A whole-posture rigid turn around a fixed world point in metres. The world quaternion applies after the posture heading; airborne planning and posture composition share this record.

## @evidence contracts/development/design.md#principled-representation

about: The point that stays, world metres; normally the centre of mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanPerformanceFlight and jumpAirborne produce the same whole-body turn consumed by channel composition, mixHumanPosture and turnHumanPosture.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The world pivot and unit quaternion are explicit; pose composition owns their application after heading. This does not reinterpret clinical degree tuples as rotation quaternions.
