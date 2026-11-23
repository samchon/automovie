# src/rotateFormationLocalOffset.ts#rotateFormationLocalOffset

## @evidence contracts/development/implementation.md#principled-implementation

The XZ cosine/sine matrix is a positive Y heading turn, preserving vertical displacement and matching transformFormationPoint's convention for unit-local offsets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Placement and viewer consumers supply the heading their frame still needs, so this owner performs rotation without duplicating cue or scene-graph composition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every offset uses the same matrix, with no slot identity branch or angular deadband; caller arithmetic limits remain visible through nonfinite output.

## @evidence contracts/development/common.md#meaningful-documentation

States degree heading, local displacement frame, both consumer compositions and the finite-arithmetic premise rather than implying an input gate.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sine and cosine and four horizontal products compute the fixed-dimensional turn in constant work and storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each placement supplies its current heading and offset; this scalar operation coordinates no requests or retained formation cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only one fresh three-component displacement escapes, with neither the source offset nor a formation reference retained.
