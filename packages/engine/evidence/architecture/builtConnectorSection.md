# src/architecture/builtConnectorSection.ts#builtConnectorSection

## @evidence contracts/development/implementation.md#principled-implementation

Piecewise-linear interpolation between the last station at or before the fraction and the next one, which is the function validation's strictly increasing stations from `0` to `1` describe; a zero span reads the earlier station rather than dividing by zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The record-addressed core that the id-addressed `builtConnectorSectionAt` and callers already holding the record share, so the interpolation rule has one owner and the range guard stays with the id form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no connector; a connector stating no section answers null for the caller to refuse instead of a default width, and a fraction outside the stations is answered by the stated hold and extension rules rather than refused here, because the id form owns the range guard.

## @evidence contracts/development/common.md#meaningful-documentation

States why the record-addressed form exists, that the fraction is unchecked here, the constant and null answers, the interpolation and its behaviour beyond the end stations, and the metre units.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S) worst-case time for S section stations, with a forward bracket scan and constant interpolation work. Each caller's repeated samples pay this scan separately; a constant section takes O(1).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one record and one fraction that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned two-number section.
