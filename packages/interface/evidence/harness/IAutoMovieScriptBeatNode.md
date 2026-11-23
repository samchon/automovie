# src/harness/IAutoMovieScriptBeatNode.ts#IAutoMovieScriptBeatNode

## @evidence contracts/development/design.md#principled-representation

The leaf that joins the tree to the flat beats the pipeline runs on, through a one-to-one id join the validator enforces in both directions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared node fields plus the `beat` discriminator and the beat payload; timing and motion stay on the flat beat and its shot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A beat missing from the tree is refused rather than rendered without its direction, and a doubly claimed beat is refused rather than resolved to the first node.

## @evidence contracts/development/common.md#meaningful-documentation

States the allowed parents, that it is a leaf, the one-to-one join and its refusals, and how feedback finds it; members give the discriminator and payload roles.
