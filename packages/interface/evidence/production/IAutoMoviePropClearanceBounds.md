# src/production/IAutoMoviePropClearanceBounds.ts#IAutoMoviePropClearanceBounds

## @evidence contracts/development/design.md#principled-representation

The world bounds of a transformed box are the per-axis extremes of its eight transformed corners, which is exact for an affine map and encloses a rotated box conservatively; an entry whose authored box is malformed is still transformed, so its index stays aligned with `placement.clearance` and the validator names the authored entry instead of a filtered list hiding it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extends the shared `IAutoMoviePropBox` with only the `id`, because the overlap test reads the box and the diagnostic needs the clearance name; `min` and `max` are restated here only to document that this box is in world space.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No prop, clearance id or axis is special-cased: every entry goes through the same staged transform the occupancy box uses, and a rotated box is widened to its world bounds rather than tested in its own frame by a separate path.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and its order, the transform and its rotation fallback, the conservative world bounds, the consumer and how it treats a malformed entry, and that both corners are world metres.

# src/production/IAutoMoviePropClearanceBounds.ts#IAutoMoviePropClearanceBounds.IProps

## @evidence contracts/development/design.md#principled-representation

Clearance input boxes are model-local metres and output boxes world-axis-aligned metres after the staged TRS; every clearance id is preserved in declaration order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

propClearanceBounds transforms declared clearance for validatePropPlacements; IAutoMoviePropBox owns the common corner shape and this result adds declaration identity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Construction transforms even malformed declared boxes so validation can report their original paths; absent clearance returns an empty array rather than a guessed occupancy margin.

## @evidence contracts/development/common.md#meaningful-documentation

Source placement inputs for a prop's declared world keep-out boxes. Clearance input boxes are model-local metres and output boxes world-axis-aligned metres after the staged TRS; every clearance id is preserved in declaration order.
