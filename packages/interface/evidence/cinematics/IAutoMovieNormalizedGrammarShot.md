# src/cinematics/IAutoMovieNormalizedGrammarShot.ts#IAutoMovieNormalizedGrammarShot

## @evidence contracts/development/design.md#principled-representation

Canonical order is code-unit order from `compareCodeUnits`, a total order independent of host locale, so two observations of the same edit normalize to the same value; the index is built from the sorted list after duplicate ids were refused, so every id maps to exactly one subject.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the observation's fields and replaces only the three whose input order carries no meaning, plus the index every cut and axis check reads, so the inspectors never re-sort or re-index.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No subject, shot or intent is special-cased; the canonical forms are the same rule for every observation.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, which fields are copied and which are canonicalized, the order used, and what the index guarantees.
