# src/recovery/IAutoMovieRecoveryTrackLinkage.ts#IAutoMovieRecoveryTrackLinkage

## @evidence contracts/development/common.md#meaningful-documentation

The result distinguishes the usable track array, linked nodes, total components, withheld conflicts and reciprocal pair links.

## @evidence contracts/development/design.md#principled-representation

The linker groups eligible matched nodes and withholds groups containing two feature indices from one view. The count diagnostics retain those excluded components.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The representation owns global appearance identity and its conflict accounting. Seed and scene qualification own geometric support and poses.

# src/recovery/IAutoMovieRecoveryTrackLinkage.ts#IAutoMovieRecoveryTrackLinkage.tracks

## @evidence contracts/development/common.md#meaningful-documentation

Only components whose observation views are all distinct enter the returned track list.

# src/recovery/IAutoMovieRecoveryTrackLinkage.ts#IAutoMovieRecoveryTrackLinkage.linkedObservations

## @evidence contracts/development/common.md#meaningful-documentation

The node set includes endpoints of reciprocal links and enforces the observation cap before grouping.

# src/recovery/IAutoMovieRecoveryTrackLinkage.ts#IAutoMovieRecoveryTrackLinkage.components

## @evidence contracts/development/common.md#meaningful-documentation

The component map is measured and bounded before conflict filtering.

# src/recovery/IAutoMovieRecoveryTrackLinkage.ts#IAutoMovieRecoveryTrackLinkage.conflictingComponents

## @evidence contracts/development/common.md#meaningful-documentation

A duplicate view in one component increments this count and excludes the whole component.

# src/recovery/IAutoMovieRecoveryTrackLinkage.ts#IAutoMovieRecoveryTrackLinkage.intersectionMatches

## @evidence contracts/development/common.md#meaningful-documentation

The linker tests each forward index pair against reverse pairs with their endpoint order inverted.
