# src/harness/IAutoMovieIntentPayload.ts#IAutoMovieIntentPayload

## @evidence contracts/development/design.md#principled-representation

Two prose fields state the root editorial intent, with nonblankness and exact equality to the independent flat script header checked at tree admission before rendering.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The root carries only the top-level statement; acts, scenes, groups and beats carry their own payloads, so no reasoning slot is shared across levels.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The renderer prints admitted prose verbatim; mismatched duplicate headers and blank fields refuse rather than selecting whichever representation a consumer happens to read.

## @evidence contracts/development/common.md#meaningful-documentation

Defines root ownership, screenplay header output and the nonblank exact-equality contract shared with the flat script fields.
