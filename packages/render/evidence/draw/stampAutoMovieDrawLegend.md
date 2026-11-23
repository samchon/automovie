# src/draw/stampAutoMovieDrawLegend.ts#stampAutoMovieDrawLegend

## @evidence contracts/development/common.md#meaningful-documentation

States the layout, the corner rule and why every corner is open, what is painted now and what is returned for stamping, the units, and the empty case.

## @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/passes.md` asks for a legend naming each colour's finding and for labels hidden where they cover what is judged; drawing it into the still keeps it with the picture a vision model reads, the swatch is the exact sRGB colour the inspection drew the kind in, and the corner is chosen by counting the drawn pixels it would hide, measured on the picture itself.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measure the block, count each corner's covered pixels, paint the swatches and collect the text anchors; text drawing is the label stamp's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Entries keep the legend's order and wording; nothing is abbreviated or recoloured, and no corner is fixed for a kind of subject.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the block's area times the four corners tried, plus the swatches' pixels.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure stamp of one picture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes into the picture's own bytes and returns fresh labels.
