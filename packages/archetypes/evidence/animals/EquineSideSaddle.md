# src/animals/EquineSideSaddle.ts#EquineSideSaddle

## @evidence contracts/development/common.md#meaningful-documentation

States what is laid, which side carries what, the source of the arrangement and which values are estimates.

## @evidence contracts/development/design.md#principled-representation

The saddle as a box, the two heads as bars a thigh hooks over or lies under, one stirrup and the shared reins, as contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `lay` and the weight and estimates it reads; `createHorse` calls it for `tack` `sidesaddle`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The off side carries no stirrup and no head; nothing mirrors the riding saddle.

# src/animals/EquineSideSaddle.ts#EquineSideSaddle.lay

## @evidence contracts/development/common.md#meaningful-documentation

States what it adds and what it reads.

## @evidence contracts/development/implementation.md#principled-implementation

The saddle sits over the rig's hitch as the riding saddle does; the fixed head rises at the front of the seat just left of the spine, the leaping head runs down and forward on the near side below it, and the near stirrup hangs `SHORTER` above the riding drop.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The saddle and its sideways seat, the two heads, the stirrup, then the shared reins.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the saddle carries mass, its press weight; every size is a named estimate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Seven parts and six contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `EquineSaddle.rein`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
