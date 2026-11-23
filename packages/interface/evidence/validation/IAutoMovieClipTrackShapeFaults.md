# src/validation/IAutoMovieClipTrackShapeFaults.ts#IAutoMovieClipTrackShapeFaults

## @evidence contracts/development/common.md#meaningful-documentation

Untrusted track projection shared by clip artifact admission and sampling. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

Unknown clock/value/interpolation/channel fields permit staged admission of second-based keyframes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sampler and artifact gate share fault generation while choosing throw-first or append-all behavior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Container and channel-reference admission remain separate from numeric stride/clock inspection.

# src/validation/IAutoMovieClipTrackShapeFaults.ts#IAutoMovieClipTrackShapeFaults.ITrack

## @evidence contracts/development/common.md#meaningful-documentation

Defines inspection order, missing-container limits, result ownership, duration semantics and consumer failure behavior.

## @evidence contracts/development/design.md#principled-representation

unknown fields represent a narrowed but unadmitted record; second-based key times and channel-specific value widths remain runtime checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Gate and sampler share clock/interpolation/stride rules through one projection rather than asserting an IAutoMovieTrack before admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No padding, width guessing or normalization repairs malformed tracks; channel addressability and duration/container admission remain with their owners.
