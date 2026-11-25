# src/motion/composition/IAutoMovieMarkContacts.ts#IAutoMovieMarkContacts.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Explains receipt selection, timestamp tolerance, force-to-arrow scale, the per-collider direction and path, the flag and the ownership it needs, and the clamped kind.

## @evidence contracts/development/design.md#principled-representation

Receipt times and sample seconds share a clock; scale is positive finite metres/newton and the optional maximum is positive finite metres, both checked by markAutoMovieContacts, which also rejects nonpositive acting-step duration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mark producer borrows solver receipts and creates unanchored world-space arrows; geometric receipts carry no force arrow.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contract reuses contact receipts instead of duplicating solver samples or manufacturing a force for geometric touches.
