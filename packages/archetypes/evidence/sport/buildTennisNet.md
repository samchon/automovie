# src/sport/buildTennisNet.ts#buildTennisNet

## @evidence contracts/development/common.md#meaningful-documentation

Defines the visual parts and their metre-valued frame and dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

Tape wraps the two existing straight cable runs. Vertical strands reach the sagging tape; horizontal runs sag by their proportional height and meet each strand at the same level on both sides.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Share the linear cable profile for the lattice and tape, then add the centre strap to the tape mesh.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The V-shaped physical cable retains its profile, and the lattice records holes without physical parts per strand.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sized by span and height at a 45 mm pitch, with two stations per vertical strand and three per horizontal run. The rule-sized net emits two meshes and fewer than 4,000 triangles.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One cable profile drives every endpoint and one mesh buffer serves all pieces of each finish.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the two bounded mesh buffers survive the call; no paths or external resources are retained.
