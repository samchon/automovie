# src/music/StringedConstruction.ts#StringedConstruction.fret

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and the nut's case.

## @evidence contracts/development/implementation.md#principled-implementation

Equal temperament: each fret leaves `2^(-1/12)` of the string sounding, so fret `n` is `scale (1 - 2^(-n/12))` from the nut.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One formula.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/music/StringedConstruction.ts#StringedConstruction.guitar

## @evidence contracts/development/common.md#meaningful-documentation

States how the guitar lies, the plane of its strings and every contact's place.

## @evidence contracts/development/implementation.md#principled-implementation

The nut stands the fourteenth fret's distance from the body and the saddle the scale from the nut; frets and strings follow from the scale, and the fingerboard widens linearly from the maker's nut width to the maker's string spacing at the saddle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Body, neck, headstock, then the frets, the strings, the neck grip and the body.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body is a box at its widest bout, without a waist, soundhole or bridge; the fingerboard's rise over the soundboard is not drawn; the neck's depth and the headstock's length are construction estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three parts and one contact per fret and string.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one instrument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/music/StringedConstruction.ts#StringedConstruction.violin

## @evidence contracts/development/common.md#meaningful-documentation

States how the violin lies, every contact's place, why there is no chinrest and how the two conflicting lengths are reconciled.

## @evidence contracts/development/implementation.md#principled-implementation

The body's three boxes at the maker's three bout widths over the back's length, split two fifths, one fifth and two fifths, a construction proportion; the nut at the neck's length off the body and the bridge the string length from the nut; the neck as thick and the fingerboard as wide as the luthiers' table gives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bouts, neck, scroll, then the strings and the neck grip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No arching, f-holes or tailpiece; the bouts' split and the scroll's length are construction estimates.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Five parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one instrument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
