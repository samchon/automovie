# src/kinematics/markAutoMovieBalance.ts#markAutoMovieBalance

## @evidence contracts/development/common.md#meaningful-documentation

States what each mark draws and from which measurement, how the base is drawn for one, two and more points, when the centre is flagged, tabulates kinds, labels, colours and paths, and states the frame and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The flag is the engine's own margin of stability on the same hull it draws (Hof, Gazendam and Sinke 2005), so the picture and the measure cannot disagree about which side of the base the centre is on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One hull, one margin, two marks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance widens the base, and no body or bone is named; the colours are a drawing convention chosen apart from every other kind's.

## @evidence contracts/development/implementation.md#efficient-algorithms

The hull dominates, `n log n` in the support points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one instant.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh marks and keeps nothing.
