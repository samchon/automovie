# src/architecture/IAutoMovieDesignPhaseState.ts#IAutoMovieDesignPhaseState

## @evidence contracts/development/design.md#principled-representation `designLineagePhaseSnapshot` derives the role from whether `introducedIn` and `removedIn` are null and the presence from whether those phases are in the completed set, applying removed before present before pending.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Phase-independent classification and phase-dependent presence are two separate members, so a consumer comparing snapshots reads only the field that can change.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A subject on an incomparable branch is reported `pending` rather than ordered against the asked phase by position, and the graph name is copied from the declaration rather than guessed from the id.

## @evidence contracts/development/common.md#meaningful-documentation

States which member is constant across snapshots and which varies, how an incomparable branch reads, and where the graph name comes from.
