# src/motion/composition/IAutoMovieMarkSupportWrenches.ts#IAutoMovieMarkSupportWrenches

## @evidence contracts/development/common.md#meaningful-documentation

Wrench instants and the query share the cache's local seconds clock, origins are world metres, forces are newtons and arrow scale is metres per newton. `markAutoMovieSupportWrenches` admits a positive finite interval and scale; moments are not drawn.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This namespace groups the IAutoMovieMarkSupportWrenches contracts used by packages/engine/src/composition/markAutoMovieSupportWrenches.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.

## @evidence contracts/development/design.md#principled-representation

Wrenches are the cache's own requested, allocated and residual records, the query second is on the same clock, and the interval is the cache step that each record governs. The namespace groups these type contracts without implementing the operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieMarkSupportWrenches contract belongs to interface; packages/engine/src/composition/markAutoMovieSupportWrenches.ts uses its nested records. Runtime computation remains with that consumer.

# src/motion/composition/IAutoMovieMarkSupportWrenches.ts#IAutoMovieMarkSupportWrenches.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Explains record selection, the step window, the two arrows and their sum, and what the quantities do not prove.

## @evidence contracts/development/design.md#principled-representation

Seconds, interval, newtons and metres per newton are the cache's own units; the scale and interval are checked by markAutoMovieSupportWrenches.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mark producer borrows the cache's wrench records and creates unanchored world-space arrows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contract reuses the cached wrench records instead of recomputing an allocation or presenting demand as measured contact force.
