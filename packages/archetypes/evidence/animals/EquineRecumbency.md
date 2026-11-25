# src/animals/EquineRecumbency.ts#EquineRecumbency.ICue

## @evidence contracts/development/common.md#meaningful-documentation

Film seconds and the side it lies on.

## @evidence contracts/development/design.md#principled-representation

A start, a side, a transition length and a hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `after` takes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineRecumbency.ts#EquineRecumbency.after

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Turn the halted placement a quarter about the trunk's long axis, set it on the floor by its lowest part, then sample the blend down, the hold and the blend up.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lying placement, a four-phase sampler.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing passes under the floor: the blend is held on it.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P + A) per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shared pose blend and floor reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the base ride and the halt.
