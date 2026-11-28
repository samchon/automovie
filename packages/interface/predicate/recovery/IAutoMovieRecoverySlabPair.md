# src/recovery/IAutoMovieRecoverySlabPair.ts#IAutoMovieRecoverySlabPair

## @evidence contracts/development/common.md#meaningful-documentation

Each side names an original observed section coordinate and specifies the physical order of the slab.

## @evidence contracts/development/design.md#principled-representation

Use explicit scalar endpoint addresses. The observer uses those exact coordinates for raw cut incidence and region observations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller selects the pair. Source-slab observation validates the addresses against its existing station collection.

# src/recovery/IAutoMovieRecoverySlabPair.ts#IAutoMovieRecoverySlabPair.beforeMm

## @evidence contracts/development/common.md#meaningful-documentation

Fixed-section admission requires this coordinate to be among the caller's original requested cuts.

# src/recovery/IAutoMovieRecoverySlabPair.ts#IAutoMovieRecoverySlabPair.afterMm

## @evidence contracts/development/common.md#meaningful-documentation

The source observer uses this later cut as the upper port and scalar region bound.
