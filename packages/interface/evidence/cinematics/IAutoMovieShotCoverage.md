# src/cinematics/IAutoMovieShotCoverage.ts#IAutoMovieShotCoverage

## @evidence contracts/development/design.md#principled-representation `performShot` compiles each take's move with the same framing solve as the hero camera, and `appendShotMetadataArtifact` requires a non-blank camera that is a scene camera, is not the hero camera and appears once, a move that is `null` or a valid clip, and a camera-intent list held to the same rules as the hero's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A take repeats only the three per-camera fields of the hero take (camera, move, intent) and inherits everything else from the shot, so the cut and the performances exist once.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The hero camera and a duplicate camera are refused rather than collapsed into one take, and coverage never becomes a separate timeline entry.

## @evidence contracts/development/common.md#meaningful-documentation

States what a take is for, which cameras it may and may not use, what a null move and an empty intent list mean, and that it reuses the hero take's grammar.
