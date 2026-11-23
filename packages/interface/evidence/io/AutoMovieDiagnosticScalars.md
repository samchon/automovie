# src/io/AutoMovieDiagnosticScalars.ts#AutoMovieDiagnosticScalars

## @evidence contracts/development/design.md#principled-representation

A mapped representation changes number serialization only; nullable absence, fixed strings and booleans retain their original semantics.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses the three actual report shapes instead of maintaining divergent duplicate member inventories.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The runtime producer still enumerates supported fields explicitly and does not traverse arbitrary input objects or expose state/arrays.

## @evidence contracts/development/common.md#meaningful-documentation

Defines its supported fixed records and preservation of source-member units, nulls and reasons.
