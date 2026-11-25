# src/everyday/kneelPhaseTable.ts#kneelPhaseTable
## @evidence contracts/development/common.md#meaningful-documentation

States the phases in order, their lengths and the rise.

## @evidence contracts/development/implementation.md#principled-implementation

Each down phase is its `kneel.PHASES` length scaled by the square root of the hip height over the walk's reference hip (Alexander 1984); the contact marks and the hold sit at the bottom key; the way up retraces the keys at the same lengths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cut out of `kneel.plan` as its phase table; the plan times the table on the manner's clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The `PHASES` lengths are provisional, as `kneel.PHASES` documents.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the keys.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure table; the plan keeps it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/kneelPhaseTable.ts#kneelPhaseTable.IPhase

## @evidence contracts/development/common.md#meaningful-documentation

States the phase's name, length and keys.

## @evidence contracts/development/design.md#principled-representation

A named phase's length in seconds from one key index to another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `kneelPhaseTable.of` and read by `kneel.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
