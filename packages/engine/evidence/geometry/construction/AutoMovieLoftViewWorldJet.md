# src/geometry/construction/AutoMovieLoftViewWorldJet.ts#AutoMovieLoftViewWorldJet

## @evidence contracts/development/implementation.md#principled-implementation

Reads actual scalar station2 and axis2, then delegates P=o+xU+zW and all six derivatives to the identical product-rule owner used by LoftJet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Original source preparation remains caller-owned; this one query performs admission, frame layout adaptation and shared world lifting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never creates a fake chain, samples a replacement axis, fills missing derivatives or changes the original source/clock. Only pure numeric preparation/lifting failures become strings; foreign axis exceptions stay outside that catch.

## @evidence contracts/development/common.md#meaningful-documentation

States source/axis coherence, mm/radian coordinates, unavailable capabilities, exception effects and the absence of skin/domain/orientation certification.

## @evidence contracts/development/implementation.md#efficient-algorithms

One original scalar2 reading, one actual axis2 call, fixed 27-component copying and one native station/phase preparation; source knot searches, axis cost and the bounded numeric inverse remain their owners' costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller reuses its admitted scalar source; one axis reading and one local native reading supply the complete world jet through the existing arithmetic owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fresh frame rows and result vectors belong to this call; its temporary native closure dies on return and no source, station, callback or global cache is retained.
