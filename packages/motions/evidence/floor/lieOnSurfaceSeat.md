# src/floor/lieOnSurfaceSeat.ts#lieOnSurfaceSeat.key

## @evidence contracts/development/common.md#meaningful-documentation

States its inputs, the seated key and when the feet hang.

## @evidence contracts/development/implementation.md#principled-implementation

Each shank leans forward from upright by `acos((hip - floor - ankle) / shank)`, the angle that brings the ankle to its height over the floor, with the thighs level and the ankle plantarflexed by the same lean so the sole stays level; a seat higher than the shank and the ankle leaves the shanks upright and the feet hanging.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility: the seated key on an edge, apart from the route `lieOnSurface` lays through it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The thigh, shoulder and lean angles are the seated pose's authored values and the law of cosines' closed form; nothing is tuned to a fixture.

## @evidence contracts/development/implementation.md#efficient-algorithms

Closed form: one arccosine and a constant joint record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure closed form of its inputs; there is no equivalent work to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh plain record; it retains nothing.

# src/floor/lieOnSurfaceSeat.ts#lieOnSurfaceSeat.IKey

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds.

## @evidence contracts/development/design.md#principled-representation

The key's tilt and joints in the lying-down pose's degrees, and whether the soles rest on the floor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Serves `lieOnSurfaceSeat.key` and `lieOnSurface`; the pose type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Two required members; no optional combination arises.
