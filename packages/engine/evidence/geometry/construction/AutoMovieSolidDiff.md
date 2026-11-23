# src/geometry/construction/AutoMovieSolidDiff.ts#AutoMovieSolidDiff

## @evidence contracts/development/common.md#meaningful-documentation

States the kept sides and what the join provides.

## @evidence contracts/development/design.md#principled-representation

Represents The solid diff: a lofted cutter subtracted from its base, with a G2 rim blend along the cut: companion namespace of 1 member (`create`); units and frames named in its text: second. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieSolidDiff` in packages/engine/src/geometry/construction/AutoMovieSolidDiff.ts; its surface is the 1 member listed and the text shows 4 other files naming it, mostly packages/engine (3), test (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieSolidDiff.ts#AutoMovieSolidDiff.create

## @evidence contracts/development/implementation.md#principled-implementation

Selects the shared join's inside kept side for the cutter, leaving contact tracing, rails and boundary ribbons with their existing geometry owners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One direct call expresses the diff-specific choice without a second intersection or blend implementation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Forwards the input and the join's nullable-result/diagnostics unchanged, with no material-side compensation, retry or replacement surface.

## @evidence contracts/development/common.md#meaningful-documentation

Names cutter/host roles, inside keep and the actual result record's failure meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds constant wrapper work to one complete shared join operation; its trace/rail/fold-check costs are not removed by this delegation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same join implementation as merge and forwards any supplied trace for the join owner to reuse; no result cache is added here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller receives the join result and its transitive records/caches; this wrapper retains no input or resource after returning.
