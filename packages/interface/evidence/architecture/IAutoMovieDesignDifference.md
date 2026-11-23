# src/architecture/IAutoMovieDesignDifference.ts#IAutoMovieDesignDifference

## @evidence contracts/development/design.md#principled-representation

A difference is emitted for a subject and aspect key exactly when the two variants' verbatim values differ, with an absent change read as null, so the record is a set difference over authored edits rather than over evaluated designs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Subject, aspect, and the two nullable values are the whole record, and the shared revision and variant ids sit once on the enclosing comparison instead of on every row.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The base value is never fabricated for an untouched side, null stands for it as documented, and two equal values never produce a row.

## @evidence contracts/development/common.md#meaningful-documentation

States what null means on either side, that the base value is never read, that at least one side is non-null, and that the two sides always differ.
