# src/schema/IAutoMovieHumanCervicalPoseSchema.ts#IAutoMovieHumanCervicalPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The three directions carry explicit anatomical signs and the common degree unit, making forward and left distinct.

## @evidence contracts/development/design.md#principled-representation

Typia bounds flexion to [-30, 35] degrees, lateral flexion to [-40, 40] and rotation to [-20, 20]. The Human channel table assigns them to the neck's flexion, signed abduction and twist.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The lower cervical record is one optional block within the neck. The atlas and skull joints retain their own channels.
