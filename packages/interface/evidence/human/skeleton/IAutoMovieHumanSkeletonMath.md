# src/human/skeleton/IAutoMovieHumanSkeletonMath.ts#IAutoMovieHumanSkeletonMath.IAxes

## @evidence contracts/development/common.md#meaningful-documentation

Three orthonormal clinical axes of one bone in its rest frame.

## @evidence contracts/development/design.md#principled-representation `flexion`: Axis flexion turns about. `abduction`: Axis abduction turns about. `twist`: Axis twist turns about, the long axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanSkeletonMath.boneAxes. Also types AutoMovieHumanJointTurn.axes, AutoMovieHumanPreparedKinematics.a.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `flexion`, `abduction`, `twist`; callers supply the complete record.
