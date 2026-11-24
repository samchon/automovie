# src/scene/filmResponse/collectAutoMovieFilmOverlays.ts#collectAutoMovieFilmOverlays

## @evidence contracts/development/implementation.md#principled-implementation

An object is an overlay when it is drawn (a non-zero layer mask) and every material states `toneMapped: false`, the convention inspection colours, marks and witness boxes use for display colours; mixed objects stay scene light.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared by the stage's draw and the sample sum, which both hide overlays from the linear light.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No object is named; the rule reads only materials and masks.

## @evidence contracts/development/common.md#meaningful-documentation

States the rule and why the stage needs the masks.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal of the scene.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Recomputed per draw because inspection changes the scene between draws.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a map the caller holds for one draw.
