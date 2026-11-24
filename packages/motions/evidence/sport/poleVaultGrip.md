# src/sport/poleVaultGrip.ts#poleVaultGrip

## @evidence contracts/development/common.md#meaningful-documentation

States the model, its source, the monotone search and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The vault's own plant and its swing (`poleVaultSwing.integrate`, Linthorne 2000) from the grip at its plant height; bisection on a condition monotone in the grip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One condition per grip, one bracket, one bisection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A run no grip serves is refused with the speed asked; nothing is padded.

## @evidence contracts/development/implementation.md#efficient-algorithms

The grip takes `SPLITS` halvings of the pole's length, each one swing integration at 0.01 s.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
