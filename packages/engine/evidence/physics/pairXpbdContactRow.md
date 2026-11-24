# src/physics/pairXpbdContactRow.ts#pairXpbdContactRow

## @evidence contracts/development/common.md#meaningful-documentation

States the row's inverse mass and move, through trees or rigid.

## @evidence contracts/development/implementation.md#principled-implementation

A contact row through the articulation (Kokkevis 2004; Featherstone 2008, section 7.5): the trees' response to both impulses acting together, or the rigid bodies' own generalised inverse mass (Mueller et al. 2020, section 3.3.1) for a body no tree answers for.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Gather the jointed bodies' impulses, read the response, add the rigid bodies' weights.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A body no tree answers for moves rigidly, as before.

## @evidence contracts/development/implementation.md#efficient-algorithms

One response per row.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The row's response serves its limit and its apply.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the pair's bodies when applied; retains nothing.
