# src/human/generation/IAutoMovieHumanTrunkColumn.ts#IAutoMovieHumanTrunkColumn

## @evidence contracts/development/common.md#meaningful-documentation

Describes ordered trunk keys and the millimetre-height section evaluator they define; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Ordered trunk keys and the millimetre-height section evaluator they define. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanTrunkColumn; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing TrunkColumn contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanTrunkColumn.ts#IAutoMovieHumanTrunkColumn.IColumn

## @evidence contracts/development/common.md#meaningful-documentation

The column.

## @evidence contracts/development/design.md#principled-representation `at`: The section's measures at a height. `keys`: The keys, by rising height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkColumn.create, AutoMovieHumanTrunkKeys.column. Read by AutoMovieHumanTrunkCourses.backNeckToWaist, AutoMovieHumanTrunkCourses.sideNeckToBust, AutoMovieHumanTrunkCourses.acrossBack. Also types AutoMovieHumanTrunkClosure.col, AutoMovieHumanTrunkSolver.col.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `at`, `keys`; callers supply the complete record.
