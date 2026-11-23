# src/index.ts#chooseAutoMovieInspectionMarks

## @evidence contracts/development/common.md#meaningful-documentation

States the three conditions, how anchors are found, the grouping and order, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A mark is drawn in its anchor's frame, so it can be drawn only where the anchor is drawn; the anchor's visibility and `hide` decide that, while `parts` decides by the mark's own path, so one curve can be drawn alone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the marks with one map from anchor to group.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing anchor is refused instead of drawn in world space, and no kind or path is treated specially.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the marks, with the verdicts memoised by the caller and one walk up each anchor's ancestors.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call chooses among the marks of one state.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns arrays of the given marks and borrowed anchors; nothing is kept.
