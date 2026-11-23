# src/physics/collectPhysicalContacts.ts#collectPhysicalContacts

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the units and meaning of each receipt field, the skipped pairs and the exaggerated share, and each parameter's role.

## @evidence contracts/development/implementation.md#principled-implementation

The world's manifold impulses are the multipliers its position solve applied, `lambda / h` (Mueller et al. 2020, sec. 3.5), so their sum over the patch is the pair's normal impulse for the substep; a positive sum with a pressing point is a solved contact. The exaggerated share follows the mode's declared response gain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the step's manifolds; receipt merging is recordPhysicalContact's, contact detection and solving the world's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every responding manifold of identified colliders on two scene owners is read; no body, shape or material kind has its own rule. An exaggerated share whose product overflows Float64 is refused, not clipped. The one non-null assertion reads the segment body the binding created for an identified collider.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the step's manifold points, plus one scan of the input bodies per exaggerated-mode lookup of each side.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads the manifolds of one completed step, which the next step replaces; nothing is reusable across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing between calls; receipts go to the caller's collections, which the run owns.
