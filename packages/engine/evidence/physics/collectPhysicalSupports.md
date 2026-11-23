# src/physics/collectPhysicalSupports.ts#collectPhysicalSupports

## @evidence contracts/development/implementation.md#principled-implementation

The manifold points and impulses are those the world's position solve applied (Mueller et al. 2020, sec. 3.5), so a pressing point is a real floor constraint and a positive impulse a real load; the compliant law's receipts carry the impulse each side received. 0.5 is the cone's cosine and 0.7 the binding's floor friction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Per limb, one pass over the step's manifolds and one over the receipts, with a local patch-owner test and point merge; contact detection is the world's and receipts are recordPhysicalContact's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the body's own patch colliders against the floor count; no pattern, scene or shape kind has its own rule. Non-null assertions read receipt samples the loop bounds and the segment body the binding created for the limb's bone.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per limb, linear in the step's manifold points and in the receipts with their samples, plus the material lookups.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads one completed step's manifolds, which the next step replaces; nothing is reusable across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned supports and their copied points are the caller's.

## @evidence contracts/development/common.md#meaningful-documentation

States both sources, the cone and its cosine, the pressing and loaded tests, the friction each sample carries, the receipt window and the merge of equal points.
