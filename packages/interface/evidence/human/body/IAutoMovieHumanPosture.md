# src/human/body/IAutoMovieHumanPosture.ts#IAutoMovieHumanPosture

## @evidence contracts/development/common.md#meaningful-documentation

The standing sagittal posture: the radiographic angles and distances that shape the spine's curves in the side view, and the head's carriage.

## @evidence contracts/development/design.md#principled-representation `pelvicTilt`: Pelvic tilt: the angle from the vertical of the line from the axis of the femoral heads to the midpoint of the sacral plate, degrees, positive when the sacral plate lies behind the hips. `sacralSlope`: Sacral slope: the angle of the sacral plate, the top of the first sacral vertebra, from the horizontal, degrees, its front edge lower. `thoracicKyphosis`: Thoracic kyphosis: the Cobb angle of the thoracic curve from the second to the twelfth thoracic vertebra, degrees, positive for the normal backward convexity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanPosture is the canonical exchange used by IAutoMovieHumanPostureSchema, IAutoMovieHumanBodyIdentity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `pelvicTilt`, `sacralSlope`, `thoracicKyphosis`, `sagittalVerticalAxis`, `craniovertebralAngle`; callers supply the complete record.
