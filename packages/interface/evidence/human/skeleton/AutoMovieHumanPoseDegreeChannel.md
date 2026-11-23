# src/human/skeleton/AutoMovieHumanPoseDegreeChannel.ts#AutoMovieHumanPoseDegreeChannel

## @evidence contracts/development/common.md#meaningful-documentation

Angular clinical paths accepted by IK; jaw translations/opening are excluded.

## @evidence contracts/development/design.md#principled-representation

Angular clinical paths accepted by IK; jaw translations/opening are excluded. Exclude<Channel, `head.jaw.${string}`> retains the referenced owner's constraints and mutability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanRigControls.channel, AutoMovieHumanRigControls.isChannel, AutoMovieHumanRigControls.chain. Read by AutoMovieHumanRigControls.bounds. Also types AutoMovieHumanRigControls.paths, AutoMovieHumanRigControls.result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanRigControls.channel, AutoMovieHumanRigControls.isChannel, AutoMovieHumanRigControls.bounds, AutoMovieHumanRigControls.chain for angular clinical paths accepted by IK; jaw translations/opening are excluded.
