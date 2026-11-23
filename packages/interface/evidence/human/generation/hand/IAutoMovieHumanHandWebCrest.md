# src/human/generation/hand/IAutoMovieHumanHandWebCrest.ts#IAutoMovieHumanHandWebCrest

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanHandWebCrest exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IInput, IPair. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanHandWebCrest; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IInput, IPair contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/hand/IAutoMovieHumanHandWebCrest.ts#IAutoMovieHumanHandWebCrest.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A web's fixed inputs.

## @evidence contracts/development/design.md#principled-representation `dorsal`: The dorsal crest, left frame, mm. `mcp`: The knuckle of the finger whose phalanx the palmar crest reads, mm. `along`: Unit direction along the finger's proximal phalanx.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHandWebCrest.pair.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `dorsal`, `mcp`, `along`, `phalanx`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandWebCrest.ts#IAutoMovieHumanHandWebCrest.IPair

## @evidence contracts/development/common.md#meaningful-documentation

The two crests.

## @evidence contracts/development/design.md#principled-representation `dorsal`: The dorsal crest, mm. `palmar`: The palmar crest, mm, distal of the dorsal one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHandWebCrest.pair.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `dorsal`, `palmar`; callers supply the complete record.
