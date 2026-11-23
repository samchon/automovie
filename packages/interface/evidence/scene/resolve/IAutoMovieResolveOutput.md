# src/scene/resolve/IAutoMovieResolveOutput.ts#IAutoMovieResolveOutput

## @evidence contracts/development/design.md#principled-representation

Return world matrices, animated morph weights, channel-addressed clamp violations and drivers explicitly deferred by the world pass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separate maps and diagnostic arrays let rendering consume numerical output while correction callers retain the actual failure provenance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Deferred springs without state and malformed two-bone chains remain visible; an empty violation list proves no applied bound crossed, not arbitrary scene validity.

## @evidence contracts/development/common.md#meaningful-documentation

Members identify column-major world matrices, animated-only weights, violation order and the current defer conditions.
