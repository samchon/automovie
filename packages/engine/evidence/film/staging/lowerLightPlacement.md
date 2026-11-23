# src/film/staging/lowerLightPlacement.ts#lowerLightPlacement

## @evidence contracts/development/implementation.md#principled-implementation

Aims with `aimRotation`, the shortest-arc rotation between local `-Z` and the authored direction that handles aligned and antiparallel cases explicitly, and fills only the defaults the light model defines, the unlimited `0` range and a documented cone angle, while an area extent is required rather than invented.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lowering per accepted placement, with the shared fields built once and each kind adding only the fields it carries, after the separate shape validator has decided acceptance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No light role or node is special-cased; the placement's discriminated union supplies each required physical field without casts, and no default panel size is substituted for the area source's authored extents.

## @evidence contracts/development/common.md#meaningful-documentation

States the transform rule, every default with its unit and meaning, why area extents have none, the precondition, and what the result aliases.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work: one optional shortest-arc rotation and a few field copies, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Lowers one placement per call; `stageScene` lowers each placement once per accepted write.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the light references the placement's position, color and shadow objects and owns a fresh rotation and scale.
