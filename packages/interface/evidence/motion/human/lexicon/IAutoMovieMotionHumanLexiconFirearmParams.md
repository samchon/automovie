# src/motion/human/lexicon/IAutoMovieMotionHumanLexiconFirearmParams.ts#IAutoMovieMotionHumanLexiconFirearmParams

## @evidence contracts/development/common.md#meaningful-documentation

Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.

## @evidence contracts/development/design.md#principled-representation

The firearm family is a closed export-name map with the exact Omit projection of each source law.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This interface owns the firearm row parameter map used by the family registry and schema generator.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Parameter types refer to canonical action contracts and never infer from runtime law values.
