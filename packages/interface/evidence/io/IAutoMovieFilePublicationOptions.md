# src/io/IAutoMovieFilePublicationOptions.ts#IAutoMovieFilePublicationOptions

## @evidence contracts/development/design.md#principled-representation

A caller-owned query can cancel publication before synchronous serialization and file work begin.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Publication cancellation is separate from geometry generation and from the immutable receipt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The query cannot interrupt a blocked event loop or remove an already published artifact.

## @evidence contracts/development/common.md#meaningful-documentation

States optional callback ownership and the pre-work cancellation checkpoint.
