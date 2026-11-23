# src/film/flame/compileAutoMovieFlameFlicker.ts#compileAutoMovieFlameFlicker

## @evidence contracts/development/common.md#meaningful-documentation

States the key grid, why 1/120 s, the inside flags and the mean area's meaning for the light and the flame luminance.

## @evidence contracts/development/implementation.md#principled-implementation

Keys at every multiple of 1/120 s plus the duration and the interval edges, merged by exact value; 1/120 s divides the 12, 24, 30 and 60 fps frame periods and gives 16 keys per period up to 7.5 Hz. The mean over inside keys makes the light's mean intensity over those keys exactly its on-state intensity. A 1e-9 guard keeps the last grid key when duration times 120 rounds just below an integer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One grid shared by the light track and the render's luminance, so both use the same Ā.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The grid is independent of the render frame rate; no smoothing between keys.

## @evidence contracts/development/implementation.md#efficient-algorithms

One flame sample per key: 120 per shot second.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call compiles one cue's grid.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new arrays the caller owns.
