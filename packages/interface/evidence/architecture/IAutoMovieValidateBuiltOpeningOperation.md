# src/architecture/IAutoMovieValidateBuiltOpeningOperation.ts#IAutoMovieValidateBuiltOpeningOperation.IProps

## @evidence contracts/development/design.md#principled-representation

Opening panels retain metre sizes and their declared travel units; validateBuiltOpeningOperation checks ownership, dimensions, states and hardware using the supplied diagnostic path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

validateBuiltOpenings supplies the element inventory and collector; driven is the same mutable map later used for connector carriage conflicts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent operation is skipped; this is typed-record validation rather than arbitrary-JSON decoding, and the first driver is recorded even if other findings reject its panel.

## @evidence contracts/development/common.md#meaningful-documentation

Opening-operation validation context with shared element-drive ownership tracking. Opening panels retain metre sizes and their declared travel units; validateBuiltOpeningOperation checks ownership, dimensions, states and hardware using the supplied diagnostic path.
