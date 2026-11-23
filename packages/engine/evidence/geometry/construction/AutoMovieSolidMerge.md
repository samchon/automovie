# src/geometry/construction/AutoMovieSolidMerge.ts#AutoMovieSolidMerge

## @evidence contracts/development/common.md#meaningful-documentation

States the kept sides and the join it composes.

## @evidence contracts/development/design.md#principled-representation

Represents The solid merge: one lofted part attached to its host by the curve where their surfaces meet and a G2 blend along it, the union of the two solids: companion namespace of 1 member (`create`); units and frames named in its text: local. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieSolidMerge` in packages/engine/src/geometry/construction/AutoMovieSolidMerge.ts; its surface is the 1 member listed and the text shows 8 other files naming it, mostly test (5), packages/engine (3), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieSolidMerge.ts#AutoMovieSolidMerge.create

## @evidence contracts/development/implementation.md#principled-implementation

Selects the shared join's outside part keep, expressing the merge boundary convention through the existing trace/rail/ribbon construction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One direct delegation keeps the merge/diff distinction at the kept-side argument.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves shared join diagnostics and null failures without retrying, shrinking widths or calling a consumer-local union path.

## @evidence contracts/development/common.md#meaningful-documentation

Gives part/host roles, outside keep and the result's nullable join/diagnostic meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant wrapper work plus the full shared join cost, including tracing, rails, repeated columns and fold checks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the diff's common implementation and any supplied trace under the join's existing contract, without new cross-call state.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned join result and its owned/borrowed dependency graph escape; the wrapper itself retains nothing.
