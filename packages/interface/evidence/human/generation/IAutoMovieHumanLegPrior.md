# src/human/generation/IAutoMovieHumanLegPrior.ts#IAutoMovieHumanLegPrior.ICrotch

## @evidence contracts/development/common.md#meaningful-documentation

The crotch's height as a line in four public inputs.

## @evidence contracts/development/design.md#principled-representation `offset`: World millimetres. `height`: Millimetres per millimetre of stature. `inseam`: Millimetres per millimetre of inseam tape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegPrior.ICrotch is the canonical exchange used by IAutoMovieHumanLegPrior.IPrior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `offset`, `height`, `inseam`, `thigh`, `sex`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLegPrior.ts#IAutoMovieHumanLegPrior.IRing

## @evidence contracts/development/common.md#meaningful-documentation

The crotch ring is tilted, so its horizontal projection is not a section: the last section of the law sits off that projection by a shared amount.

## @evidence contracts/development/design.md#principled-representation `forward`: Section centre ahead of the ring's, in leg lengths. `lateral`: Section centre outside the ring's, in leg lengths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegPrior.IRing is the canonical exchange used by IAutoMovieHumanLegPrior.IPrior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `forward`, `lateral`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLegPrior.ts#IAutoMovieHumanLegPrior.ICourse

## @evidence contracts/development/common.md#meaningful-documentation

Station of a tape measure and its ratio to the prior section's hull there.

## @evidence contracts/development/design.md#principled-representation `station`: Leg fraction of the tape. `ratio`: Hull girth at the station per unit of the tape input.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegPrior.ICourse is the canonical exchange used by IAutoMovieHumanLegPrior.IPrior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `station`, `ratio`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLegPrior.ts#IAutoMovieHumanLegPrior.IAnkle

## @evidence contracts/development/common.md#meaningful-documentation

The ankle centre ahead of the origin as a line, world millimetres.

## @evidence contracts/development/design.md#principled-representation `offset`: Constant. `fat`: Per unit of the fat control. `muscularity`: Per unit of the muscularity control.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBodyFrame.prior, AutoMovieHumanLegLaw.line.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `offset`, `fat`, `muscularity`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLegPrior.ts#IAutoMovieHumanLegPrior.ILateral

## @evidence contracts/development/common.md#meaningful-documentation

The axis's place off the midline per station: a constant and three inputs.

## @evidence contracts/development/design.md#principled-representation `offset`: World millimetres. `leg`: Millimetres per millimetre of leg length. `hip`: Millimetres per millimetre of hip tape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegPrior.ILateral is the canonical exchange used by IAutoMovieHumanLegPrior.IPrior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `offset`, `leg`, `hip`, `sex`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLegPrior.ts#IAutoMovieHumanLegPrior.IPrior

## @evidence contracts/development/common.md#meaningful-documentation

The prior's channels.

## @evidence contracts/development/design.md#principled-representation `crotch`: Height of the crotch. `ring`: The groin section against the crotch ring's projection. `ankle`: Forward place of the ankle centre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLegPrior.PRIOR, AutoMovieHumanLegLaw.prior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `crotch`, `ring`, `ankle`, `stations`, `profile`, `forward`, `lateral`, `shape`, `calf`, `knee`, `thigh`; callers supply the complete record.
