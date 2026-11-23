# src/auditAutoMovieDeliveryProfile.ts#auditAutoMovieDeliveryProfile

## @evidence contracts/development/common.md#meaningful-documentation

States the probe, the two profiles, the no-soundtrack rule, the finding count and where the asserters come from.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the video profile from the subject raster and the planned exact rate and runs the production's own asserters, so the check is the one its `render` package defines; a film without a soundtrack must hold no audio track, the encoder's `-an`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Probing, asserting and recording are separate steps; the render host only adds the findings to its blockers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Findings are parsed from the asserters' documented refusal form; an unreadable file is one `probe` finding, never a pass.

## @evidence contracts/development/implementation.md#efficient-algorithms

One header read and two constant-size comparisons.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own bytes; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle or task and retains nothing after returning.
