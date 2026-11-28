# src/render/IAutoMovieCapturePlanRequest.ts#IAutoMovieCapturePlanRequest

## @evidence contracts/development/common.md#meaningful-documentation

Defines numeric sampling and the alternative selected played cue.

## @evidence contracts/development/design.md#principled-representation

The request can carry one source cue and still reuse ordinary view, pass, window and storage options. The name replaces numeric sampling for that request and an absent cue leaves the legacy grammar unchanged.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The capture request only needs an exact source id and optional entry. It uses the same window, view, pass and storage options as numeric capture.

# src/render/IAutoMovieCapturePlanRequest.ts#IAutoMovieCapturePlanRequest.ICue

## @evidence contracts/development/common.md#meaningful-documentation

Defines exact source identity and optional index of the played sequence entry.

## @evidence contracts/development/design.md#principled-representation

A source event id identifies its authoring occurrence and the entry disambiguates repeating that source at different output times.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The cue need not copy shot or actor metadata into request text. Those facts arrive from the source owner after its id and played entry have been resolved.

# src/render/IAutoMovieCapturePlanRequest.ts#IAutoMovieCapturePlanRequest.cue

## @evidence contracts/development/common.md#meaningful-documentation

A selected played cue replaces the numeric time sampling while retaining view and window options.

# src/render/IAutoMovieCapturePlanRequest.ts#IAutoMovieCapturePlanRequest.ICue.id

## @evidence contracts/development/common.md#meaningful-documentation

Carries the exact identifier owned by the source shot.

# src/render/IAutoMovieCapturePlanRequest.ts#IAutoMovieCapturePlanRequest.ICue.entry

## @evidence contracts/development/common.md#meaningful-documentation

Names the zero-based played sequence entry when several occurrences share the source id.
