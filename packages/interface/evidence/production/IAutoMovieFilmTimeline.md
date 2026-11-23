# src/production/IAutoMovieFilmTimeline.ts#IAutoMovieFilmTimeline

## @evidence contracts/development/design.md#principled-representation

Integer-frame placements let Engine sampling, sound/effects and Render planning share one frame grid. The production timeline compiler/parser is retired; callers must supply normalized intervals and verified provenance. Render planning checks production identity, rational clock and target duration, while film-effect verification checks effect population and content identities rather than every edit or source byte.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Segments own video mapping while three inline track arrays own audio, captions and effects; the optional exact frame-rate record preserves fractional identity separately from numeric fps.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Integer legacy timelines may omit frameRate and mean fps/1 under resolveProductionFrameRate. Declared inputFingerprint/sourceDigest are not independent current-byte proof; no surviving production manifest parser supplies that fence automatically.

## @evidence contracts/development/common.md#meaningful-documentation

Defines generated identity, half-open segment mapping, frame units, exact frame-rate compatibility and each non-video track's source and destination fields.
