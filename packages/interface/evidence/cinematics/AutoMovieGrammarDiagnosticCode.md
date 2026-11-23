# src/cinematics/AutoMovieGrammarDiagnosticCode.ts#AutoMovieGrammarDiagnosticCode

## @evidence contracts/development/design.md#principled-representation

A closed string-literal union naming one editorial rule per member, so `IAutoMovieGrammarDiagnostic.code` and the suppression table are checked exhaustively by the compiler and a consumer branches on the family without parsing text.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One member per measured rule and no severity in the name, since severity is a separate field of the diagnostic; the union lives in its own file because the diagnostic record and the suppression table both import it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No catch-all or free-form member exists, so a new grammar check must add a named family rather than reuse an unrelated code.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, what each family detects and the severity it is filed with, and which families a declared style intent can suppress.
