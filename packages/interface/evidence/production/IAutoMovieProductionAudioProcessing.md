# src/production/IAutoMovieProductionAudioProcessing.ts#IAutoMovieProductionAudioProcessing

## @evidence contracts/development/design.md#principled-representation

Stage kind, downmix coefficients and requested output rate let the render identity validator compare declared processing with source channels and rate; the record does not prove sample contents or specify a general resampling algorithm independently of the decoder.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One flat record names the stage combination and its parameters; the render package's wave identity validator reads these four fields and nothing else.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Literal channel and stage vocabulary constrain names, but independent fields and numeric arrays do not enforce stage/rate/matrix correlation; the decoder produces those relations and the render wave-identity validator checks them.

## @evidence contracts/development/common.md#meaningful-documentation

The comments give the stage order, the output channel and rate meaning, and the row-by-column orientation and only values of the downmix matrix.
