# src/production/sound/IAutoMovieSampleDialogueMouth.ts#IAutoMovieSampleDialogueMouth

## @evidence contracts/development/common.md#meaningful-documentation

Names the inputs of sampling one actor's dialogue mouth.

## @evidence contracts/development/design.md#principled-representation

A namespace of the sampling inputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the contract engine's sampler exposes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is declared on the namespace itself.

# src/production/sound/IAutoMovieSampleDialogueMouth.ts#IAutoMovieSampleDialogueMouth.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States how the second maps to a frame, which line speaks, what is returned, the refusal and that seconds may be sampled in any order.

## @evidence contracts/development/design.md#principled-representation

A borrowed track, an actor id and a film second that may fall between frames, so shutter samples read the mouth too.

## @evidence contracts/development/design.md#minimal-and-owned-surface

All three members are read by `sampleAutoMovieDialogueMouth`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No cursor or history is kept, so seeking needs no state.
