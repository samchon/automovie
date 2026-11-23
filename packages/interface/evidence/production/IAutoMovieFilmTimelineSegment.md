# src/production/IAutoMovieFilmTimelineSegment.ts#IAutoMovieFilmTimelineSegment

## @evidence contracts/development/design.md#principled-representation

Pairs source and film-global half-open frame intervals so integer frame counts and trims remain exact; normalized transitions retain their admitted duration and available source handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record contains only the shot mapping and its two boundary transitions; shot content stays in the compiled shot and non-video placements stay in the timeline tracks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Cut has no duration and fade or dissolve carries an explicit frame count; the record does not fabricate missing source frames or substitute another shot.

## @evidence contracts/development/common.md#meaningful-documentation

States inclusive and exclusive source and film endpoints, handle units and the normalized transition fields.
