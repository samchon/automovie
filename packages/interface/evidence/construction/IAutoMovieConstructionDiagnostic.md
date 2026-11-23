# src/construction/IAutoMovieConstructionDiagnostic.ts#IAutoMovieConstructionDiagnostic

## @evidence contracts/development/design.md#principled-representation

Totality: every valid tree realizes, and each departure from it names the node and the premise with its numbers, so the author fixes the input that broke it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A node name, a contract name and a message are all a reader needs to find the cause.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A diagnostic is never suppressed by a fallback shape: the node it names is left out.

## @evidence contracts/development/common.md#meaningful-documentation

States what is left out for each node kind, that the solid still realizes and each field's meaning.
