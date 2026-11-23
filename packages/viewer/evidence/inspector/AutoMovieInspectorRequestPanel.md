# src/index.ts#AutoMovieInspectorRequestPanel

## @evidence contracts/development/common.md#meaningful-documentation

States what each field shows, when an edit is dispatched, the refusal, the command's quoting, what copying does and what it says when the clipboard is missing or refused.

## @evidence contracts/development/implementation.md#principled-implementation

Both texts are written from the request by the grammar's writers, so the address, the command and the picture name one request; copying goes through the platform's clipboard.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One editable field and one read-only field, each with a copy button.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The typed text is held only until it is dispatched; the request stays the reducer's; a missing or refused clipboard is reported, never swallowed or thrown.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two writes of the request per render, linear in its text.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A view with handlers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds only the text being typed and the last copy's note.
