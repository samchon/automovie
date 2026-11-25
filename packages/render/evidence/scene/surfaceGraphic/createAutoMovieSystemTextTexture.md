# src/scene/surfaceGraphic/createAutoMovieSystemTextTexture.ts#createAutoMovieSystemTextTexture

## @evidence contracts/development/common.md#meaningful-documentation

States the system UI font choice, host dependence, raster limits, line breaks, overflow refusal, image orientation and caller ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Measures the box in the same em units as the canvas font, then scales to the raster. Browser text shaping selects the system UI font and script fallback. The ascent and descent account for the glyphs the browser draws. White coverage lets the existing graphic material supply the layer colour and use its alpha for depth sealing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sets the text and returns its coverage texture. The key builder owns its quad, material and depth seal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the platform's generic family without naming a font. An overlong word or line stack is refused instead of scaled down.

## @evidence contracts/development/implementation.md#efficient-algorithms

The raster is at most 1024 pixels on each edge. Word wrapping measures the current line on each word so native kerning and shaping determine whether the line fits.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one placed layer once when its key is prepared. The renderer reuses the result for each drawn frame.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one texture retaining its canvas. The key registers the texture with surface graphics ownership for disposal on teardown or failed preparation.
