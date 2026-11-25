# src/motion/composition/IAutoMovieMarkSupportWrenches.ts#IAutoMovieMarkSupportWrenches.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Explains record selection, the step window, the two arrows and their sum, and what the quantities do not prove.

## @evidence contracts/development/design.md#principled-representation

Seconds, interval, newtons and metres per newton are the cache's own units; the scale and interval are checked by markAutoMovieSupportWrenches.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mark producer borrows the cache's wrench records and creates unanchored world-space arrows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contract reuses the cached wrench records instead of recomputing an allocation or presenting demand as measured contact force.
