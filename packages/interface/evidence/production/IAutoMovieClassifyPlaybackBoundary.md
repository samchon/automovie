# src/production/IAutoMovieClassifyPlaybackBoundary.ts#IAutoMovieClassifyPlaybackBoundary.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the clock of every number and that a break owns the shot-local half-open interval ending at its second.

## @evidence contracts/development/design.md#principled-representation

The sequence and the layout built from it share the playback mapping. Breaks are shot-local because a source take owns them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the cut, the layout built once by the caller and explicit breaks enter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default frame step, speed or break is assumed.

# src/production/IAutoMovieClassifyPlaybackBoundary.ts#IAutoMovieClassifyPlaybackBoundary.IEndpoint

## @evidence contracts/development/common.md#meaningful-documentation

Names the sequence entry, shot id and shot-local seconds after trim and playback rate.

## @evidence contracts/development/design.md#principled-representation

The same three values a playback sample uses to place the live shot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries only what a producer needs to evaluate its track.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The entry index distinguishes two plays of the same shot.

# src/production/IAutoMovieClassifyPlaybackBoundary.ts#IAutoMovieClassifyPlaybackBoundary.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Defines each relation and when endpoints are present.

## @evidence contracts/development/design.md#principled-representation

The four relations are the boundary values continuity checks already consume.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returns the relation and the clocks needed to evaluate it, nothing else.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unavailable relation carries no invented endpoint.
