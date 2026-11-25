# src/weapons/ArmourProfile.ts#ArmourProfile.ICell

## @evidence contracts/development/common.md#meaningful-documentation

Names the stable part identity and independent local corner coordinates consumed by the shared builder's convex-cell owner.

## @evidence contracts/development/design.md#principled-representation

A finite corner set describes one wall volume; the core owns hull topology, rendered faces, mass and collider from the same set.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The producer needs only an identity and corners at identity placement; no duplicate triangulation or physical proxy escapes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A cell is a wall region, never the hull of a whole hollow helmet or shirt, and no hidden bounding solid supplies mass.

# src/weapons/ArmourProfile.ts#ArmourProfile.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

Documents kind/model identity, fitted status, original record envelope, outer envelope, inner fitting boundary, plate/pad and wall units.

## @evidence contracts/development/design.md#principled-representation

Independent museum size remains separate from the fitted envelope and the inner body boundary; model identity preserves missing/associated artifact scope.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every field is consumed by current helmet, torso or limb generation; there is no optional reconstruction mode or unconsumed physical coefficient.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Mail wall is a geometry-equivalent value under the existing steel preset and recorded mass, not measured wire thickness or a claim about historical alloy composition.

# src/weapons/ArmourProfile.ts#ArmourProfile.create

## @evidence contracts/development/common.md#meaningful-documentation

Takes the selected museum record, SI dimensions and already admitted minimal measure; returns independent model/fit boundaries and refuses a nonpositive or geometrically impossible wall.

## @evidence contracts/development/implementation.md#principled-implementation

Plates retain their band value. Helmets retain head radius plus existing padding and plate; torso/limbs retain their covered dimensions. Mail solves the closed-form quadratic panel-volume law against record mass divided by the existing EN1991 steel density.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Select the existing body's dimensions by kind, retain the record separately, derive one mail wall if needed and form independent inner/outer boundaries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No new measured thickness, alloy density, full-body dependency or altered museum figure is introduced; unrepresentable and impossible positive walls refuse rather than being clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar work and storage; the mail wall uses one stable quadratic expression, without mesh generation or iterative sampling.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every cell consumes these same prepared dimensions and the same mail coverage equation, while the core owns all hull and mass integration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only fresh scalar/vector records escape; caller measures and dimension records are not retained or changed.
