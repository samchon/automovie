# src/inspector/AutoMovieInspectorRequestPanel.tsx#AutoMovieInspectorRequestPanel

## @evidence contracts/development/common.md#meaningful-documentation

States what each field shows, when an edit is dispatched, the refusal, the host command condition and shell default, and the clipboard feedback.

## @evidence contracts/development/implementation.md#principled-implementation

Both texts use the same request writer. The command formats the host's fixed arguments and those request arguments for the selected shell. Copying goes through the platform clipboard.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One editable address field with a copy button. Hosts with a capture command also get a shell selector and a read-only command with its own copy button.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The typed text is held only until it is dispatched; the request stays the reducer's; a missing or refused clipboard is reported, never swallowed or thrown.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two writes of the request per render, linear in its text and the optional host command text.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A view with handlers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Local state holds the text being typed, the last copy note and the selected shell while the panel is mounted.
