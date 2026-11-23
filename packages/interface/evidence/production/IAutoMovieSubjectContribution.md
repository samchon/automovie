# src/production/IAutoMovieSubjectContribution.ts#IAutoMovieSubjectContribution

## @evidence contracts/development/design.md#principled-representation

A partial record of optional arrays forms a monoid under per-field concatenation, which is what lets any number of subjects merge in a stable order into one shot without knowing about each other.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One flat optional field per kind of shot content, each typed by the interface record the builder already validates, so the shot reads a merged contribution with no subject-specific adapter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The merge's field list is a `Record` over this interface's keys, so a new field cannot be silently dropped; no subject kind gets a field of its own and duplicates pass through to the builder's checks.

## @evidence contracts/development/common.md#meaningful-documentation

States why each subject returns only its own part, why every field is optional, how a formation contributes compact cues, how the merge concatenates and drops empties, and what each field carries.
