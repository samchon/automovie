# src/human/generation/hand/IAutoMovieHumanHandJoints.ts#IAutoMovieHumanHandJoints

## @evidence contracts/development/common.md#meaningful-documentation

The joints the metacarpals end at, in the left frame.

## @evidence contracts/development/design.md#principled-representation `cmc`: The thumb's carpometacarpal joint. `mcps`: Each digit's metacarpophalangeal joint, thumb first. `frame`: The hand's frame on its knuckles, once the fingers' lines have placed them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHandJoints.jointsOf, AutoMovieHumanHandJoints.knuckles. Read by AutoMovieHumanHandFingers.digitsOf, AutoMovieHumanThumbBones.of. Also types AutoMovieHumanHandJoints.joints, AutoMovieHumanHandSolve.joints.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `frame`: The hand's frame on its knuckles, once the fingers' lines have placed them.
