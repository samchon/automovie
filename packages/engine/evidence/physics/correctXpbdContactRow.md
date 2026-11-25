# src/physics/correctXpbdContactRow.ts#correctXpbdContactRow

## @evidence contracts/development/common.md#meaningful-documentation

States the compliant correction and the re-solve on a held axis.

## @evidence contracts/development/implementation.md#principled-implementation

Mueller et al. 2020, section 3.3.1: dlambda = (c - alphaTilde lambda) / (w + alphaTilde) with the compliance w / omega^2 (Macklin et al. 2016) on the row's own inverse mass; an axis reaching a bound is held and the row solved again (Featherstone 2008, section 7.3).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the row, solve the multiplier, hold or apply.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamping; at most one re-solve per newly held axis.

## @evidence contracts/development/implementation.md#efficient-algorithms

One row per solve, one more per newly held axis.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each solve reads its row once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the pair's bodies; retains nothing.
