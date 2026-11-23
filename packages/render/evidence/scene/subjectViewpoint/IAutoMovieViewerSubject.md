# src/index.ts#IAutoMovieViewerSubject

## @evidence contracts/development/design.md#principled-representation

Pairs a closed category with the authored id and nullable revision, preserving model-versus-placement identity; callers supply actual uniqueness and source correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One identity record is used by key encoding and capture metadata instead of inferring identity from pixels.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Neither the shape nor capture resolves an id against source; revision text remains caller evidence rather than a verified content digest.

## @evidence contracts/development/common.md#meaningful-documentation

Documents category/id/revision meanings and the limits of supplied provenance.
