# src/carrier/measureSurfaceGlide.ts#measureSurfaceGlide

## @evidence contracts/development/common.md#meaningful-documentation

States the measured quantities, entry data and degenerate cases.

## @evidence contracts/development/implementation.md#principled-implementation

Projects both headings into the support plane and measures against their normalized angular bisector. On a circular arc the bisector aligns with the chord.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds one basis and projects one displacement and the last plane offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Measures displayed points in the actual plane and refuses an undefined basis.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work independent of motion or sample length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each pair has its own equipment directions and displacement.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns scalar readings and retains no samples.
