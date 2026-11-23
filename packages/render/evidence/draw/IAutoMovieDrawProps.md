# src/draw/IAutoMovieDrawProps.ts#IAutoMovieDrawProps

## @evidence contracts/development/design.md#principled-representation

The subject's name, or null for the page's only subject, and the module's own data as JSON.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by `AutoMovieDrawSession.open`, read by `installAutoMovieDraw`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `props` is `unknown` because its shape belongs to the subject module; an absent value is null rather than an empty object with a guessed shape.

## @evidence contracts/development/common.md#meaningful-documentation

States who writes and reads it, how it arrives, and what null means for each member.
