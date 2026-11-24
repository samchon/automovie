# src/production/sound/IAutoMovieMasterProductionSound.ts#IAutoMovieMasterProductionSound.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States what the master stage does with the mix, that it leaves the mix unchanged, and when it refuses.

## @evidence contracts/development/design.md#principled-representation

The mix arrives with the targets it was levelled to, so the master meets the same targets the lines were levelled against; the plan supplies the clock for the master's analysis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read: the mix and its plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The targets are not passed a second time, so they cannot differ from the mix's.
