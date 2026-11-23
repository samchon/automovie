# src/architecture/IAutoMovieConnectorCarriage.ts#IAutoMovieConnectorCarriage

## @evidence contracts/development/design.md#principled-representation

A carriage is a joint: its state value becomes a rigid displacement composed after the element's own local transform, so it rides down the element hierarchy exactly like an opening panel's travel and needs no second placement per state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Identity, driven element, and motion are the whole record; the travel per state lives on `IAutoMovieCarriageValue` and the run membership on the connector, so the carriage repeats neither.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An element already driven by another carriage or panel is refused by name instead of letting the later member overwrite the shared displacement, and an element outside the run's declared elements is refused.

## @evidence contracts/development/common.md#meaningful-documentation

States that the element's transform is the rest pose, which elements a carriage may drive, the one-driver-per-element rule and its reason, and the scope of the id's uniqueness.
