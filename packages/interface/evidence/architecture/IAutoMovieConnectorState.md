# src/architecture/IAutoMovieConnectorState.ts#IAutoMovieConnectorState

## @evidence contracts/development/design.md#principled-representation

A state is a total assignment, one value for every carriage of the operation, so the configuration it names is fully determined and validation can place the whole work under it without inventing a value for a missing carriage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A name, the per-carriage values, and one drive literal for the whole run; direction belongs to the run's state rather than to each carriage because a run is driven as one.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A reverse drive on a one-way run, an unknown or repeated carriage, a missing carriage value, and an unknown drive literal are each refused, and the doc states that `drive` is validated but read by no placement or render.

## @evidence contracts/development/common.md#meaningful-documentation

States the id's uniqueness scope, the once-per-carriage rule, what each drive literal means relative to `from` and `to`, the one-way restriction, and that nothing downstream reads the drive.
