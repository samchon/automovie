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
