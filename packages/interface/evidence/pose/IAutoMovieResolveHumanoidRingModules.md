# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IBone

## @evidence contracts/development/common.md#meaningful-documentation

Identifies rest joint ancestry, optional leaf endpoint and explicit segment girth.

## @evidence contracts/development/design.md#principled-representation

Human-frame metre tuples plus a positive radius describe one rest segment; null parent selects the root and null tip uses a child endpoint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieHumanoidRingModules consumes these plain joint facts to produce rigid ring modules without importing a Human runtime model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ancestry and finite geometry remain producer premises; the record does not infer missing leaf endpoints or resolve arbitrary cyclic skeletons.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IRing

## @evidence contracts/development/common.md#meaningful-documentation

States the centre, in-plane half dimensions and ordered polygon samples of one section.

## @evidence contracts/development/design.md#principled-representation

All coordinates and dimensions use Human-frame metres, with points counter-clockwise about the owning module axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieHumanoidRingModules produces these sections for the coarse rigid-module surface builder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

depth and breadth describe a section rather than global axes; arbitrary point arrays do not enforce winding or nondegeneracy by type.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IModule

## @evidence contracts/development/common.md#meaningful-documentation

Defines rigid segment ownership, stacking/breadth directions, ordered rings and optional end closure.

## @evidence contracts/development/design.md#principled-representation

Axis and optional breadth are directions, rings/pole are Human-frame metre geometry; null pole means a flat end.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ring-module resolver returns this structure to coarse humanoid geometry consumers, keeping joint ownership as a string identity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Axis is deliberately not required to be unit, and null breadth selects the established forward-depth frame rather than an absent segment.
