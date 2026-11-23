# src/promptAutoMovieProjectName.ts#promptAutoMovieProjectName

## @evidence contracts/development/implementation.md#principled-implementation `isTTY` on both streams identifies an interactive terminal; the readline interface is closed in `finally`, so standard input is released even when the question fails.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The prompt is the CLI's only interactive I/O, separate from the pure name decision.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The answer is not normalized here; the template's one name rule admits it.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states when the question is asked, the default, and how a blank answer is treated.

## @evidence contracts/development/implementation.md#efficient-algorithms

One question and one trim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each request asks at most once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The readline interface is closed before returning.
