# src/AutoMovieCommand.ts#AutoMovieCommand

## @evidence contracts/development/design.md#principled-representation

Each variant carries exactly what its command needs after admission, so `run` performs no further argument parsing, except `capture`, `inspect`, `render` and `review`, whose options are read by the production's renderer's option reader once that renderer is loaded.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed union over the command name lets `run` switch on one field, and the workspace family is a closed pair instead of a free path.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No variant other than `capture`, `inspect`, `render` and `review` carries unparsed tokens, and theirs are read by the one option reader every host shares rather than a second grammar here.

## @evidence contracts/development/common.md#meaningful-documentation

Every variant and member states its meaning and who resolves it.
