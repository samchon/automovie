# src/scene/formationSpacingOffset.ts#formationSpacingOffset

## @evidence contracts/development/implementation.md#principled-implementation

Subtracts the compiled anchor and delegates spacing/heading to engine transformFormationPoint with frozen zero root travel/turn, preserving engine double arithmetic order; finite admitted metre points/spacing/degrees and a group carrying the real anchor/motion are premises, with final instance-buffer Float32 narrowing owned later.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One native Vector3 adapter shares canonical engine placement rather than maintaining a second degree conversion/point-transform law; root motion remains in the parent group.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Frozen zero origin is the explicit group-local coordinate convention, not a fixture offset; no angle-specific rounding branch, replaced engine math or sampled correction changes the placement.

## @evidence contracts/development/common.md#meaningful-documentation

Gives group-local/anchor/heading/spacing interpretation and why engine arithmetic order matters; double-versus-Float32 responsibilities remain explicit without claiming a measured rendering improvement.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs one fixed-size point transform and constructs one Vector3, constant work/storage per point; the population update owner decides when changed spacing/reform requires the full member rewrite.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the frozen module origin and engine transform implementation across points; each returned mutable vector is independent, while arrangement-equivalence reuse belongs to the parent formation update.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one fixed frozen origin value for module lifetime, borrows arguments only during the call and transfers one small vector; owns no geometry, texture or task.
