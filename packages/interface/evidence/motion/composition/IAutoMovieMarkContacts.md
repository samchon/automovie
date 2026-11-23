# src/motion/composition/IAutoMovieMarkContacts.ts#IAutoMovieMarkContacts

## @evidence contracts/development/common.md#meaningful-documentation

Receipt samples and the query share a seconds clock, contact points are world metres, impulses are newton-seconds, arrow scale is metres per newton and the optional clamp is metres. The mark producer admits positive finite scale, clamp and acting-step duration; geometric receipts produce no force arrow.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This namespace groups the IAutoMovieMarkContacts contracts used by packages/engine/src/composition/markAutoMovieContacts.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.

## @evidence contracts/development/design.md#principled-representation

Receipt samples and the query share a seconds clock, contact points are world metres, impulses are newton-seconds and arrow scale is metres per newton. The mark producer admits positive finite scale and acting-step duration; geometric receipts produce no force arrow. The namespace groups these type contracts without implementing the operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieMarkContacts contract belongs to interface; packages/engine/src/composition/markAutoMovieContacts.ts uses its nested records and callbacks. Runtime computation remains with those consumers.

# src/motion/composition/IAutoMovieMarkContacts.ts#IAutoMovieMarkContacts.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Explains receipt selection, timestamp tolerance, force-to-arrow scale, the per-collider direction and path, the flag and the ownership it needs, and the clamped kind.

## @evidence contracts/development/design.md#principled-representation

Receipt times and sample seconds share a clock; scale is positive finite metres/newton and the optional maximum is positive finite metres, both checked by markAutoMovieContacts, which also rejects nonpositive acting-step duration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mark producer borrows solver receipts and creates unanchored world-space arrows; geometric receipts carry no force arrow.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contract reuses contact receipts instead of duplicating solver samples or manufacturing a force for geometric touches.
