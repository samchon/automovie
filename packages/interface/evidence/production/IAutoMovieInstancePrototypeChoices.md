# src/production/IAutoMovieInstancePrototypeChoices.ts#IAutoMovieInstancePrototypeChoices.IInstanceSet

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes omitted and empty tables, default identity and weight, ordering, borrowed entries and retained generic fields.

## @evidence contracts/development/design.md#principled-representation

Model-group IDs and weighted choices reuse the compiled-prototype contract; this structural reader accepts a complete table, leaving nonempty/weight admission to its caller.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Selection and structural subject comparison need only base model and optional complete table; Choice retains the actual entry type without requiring every caller to supply compiled tiers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An explicitly empty table is not rewritten into a default and an existing complete table is not prepended with a duplicate base entry.
