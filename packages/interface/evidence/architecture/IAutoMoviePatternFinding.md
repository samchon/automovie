# src/architecture/IAutoMoviePatternFinding.ts#IAutoMoviePatternFinding

## @evidence contracts/development/design.md#principled-representation

Each kind fixes the unit of `measured` and the meaning of `limit`, so a finding is a typed measurement against a declared threshold rather than free text.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One shape for single and pair findings, with `occurrences` holding one or two ids, keeps the list uniform for a reader that groups by kind.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Quality defects are reported, not thrown or silently corrected, and the thresholds come from the pattern declaration rather than fixture constants.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and limit per kind, the occurrence count per kind, the order of the list, and that `detail` is actionable text.
