# src/validation/IAutoMovieValidateUniqueBy.ts#IAutoMovieValidateUniqueBy.IEntries

## @evidence contracts/development/common.md#meaningful-documentation

Defines exact identity, ordering, skipped nonstrings, ownership and diagnostic effects.

## @evidence contracts/development/design.md#principled-representation

unknown ids preserve raw ingress values until element-level admission, while paths locate later duplicates independently of their identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Artifact validators extract their existing ids/paths and reuse one ordered seen-set operation without transferring whole records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This gate does not certify string shape, nonblankness or reference validity and does not trim, choose a winner or remove duplicates.
