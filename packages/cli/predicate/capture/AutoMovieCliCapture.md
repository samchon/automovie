# src/capture/AutoMovieCliCapture.ts#AutoMovieCliCapture.readVideoProbe

## @evidence contracts/development/common.md#meaningful-documentation

Names the first input video's stream index, raster and sampling clock. Identifies the later extraction as the PTS authority.

## @evidence contracts/development/implementation.md#principled-implementation

The probe command maps the first video ordinal. The parser finds that first video in input zero and preserves its absolute index. The positive rational filter rate supersedes a rounded banner rate; a missing filter rate falls back to that banner.

## @evidence contracts/development/implementation.md#efficient-algorithms

The probe renders one frame and reads the emitted input inventory and filter clock. Native extraction separately reports only the stills requested by the existing plan.

# src/capture/AutoMovieCliCapture.ts#AutoMovieCliCapture.readRetainedFrames

## @evidence contracts/development/common.md#meaningful-documentation

Describes the exact record, native source, view/pass and PNG verification, and the per-frame unavailable outcome.

## @evidence contracts/development/implementation.md#principled-implementation

The reader checks the record digest before parsing, chooses a complete subject, and filters by view, pass, frame and exact source. It rejects ambiguous stills and verifies each returned PNG against its recorded byte digest. Missing timestamps or exact camera identity cannot qualify.

## @evidence contracts/development/implementation.md#efficient-algorithms

One relation indexes admitted rows in the requested range. The 32-row default and 256-row ceiling bound file reads and returned bytes by the selected PNGs. The method opens no browser or media decoder.
