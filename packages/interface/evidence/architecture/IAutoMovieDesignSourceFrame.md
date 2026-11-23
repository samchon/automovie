# src/architecture/IAutoMovieDesignSourceFrame.ts#IAutoMovieDesignSourceFrame

## @evidence contracts/development/design.md#principled-representation `designReferenceWorldPoint` spans normalized axes by settled-scale offsets around the anchor, adds origin, then applies optional scale/normalized rotation/translation. Frame admission requires finite axis X/Y computed lengths above 1e-12 and absolute normalized dot at most 1 - 1e-12, a finite in-sheet anchor and resolving chosen scale. These numeric predicates and finite source values do not prove finite world products/sums; promotion currently forwards mapped points without a separate finite-result gate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The frame owns every placement fact for its sheet and primitives own none, so correcting a scale, axis, or north is one edit here and never a rewrite of observed points.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Axes retain authored skew and an unknown scale stays null. Up/north/level/view are informational to mapping/promotion. The production byte gate is retired, so single-page family restrictions and measured-sheet bounds require explicit host checks; the Engine frame gate does not reconstruct container page geometry.

## @evidence contracts/development/common.md#meaningful-documentation

States the exact mapping formula and its order, that axes may be skewed, which members the mapping ignores, the units and ranges of the extent and anchor, the page rule for single-page containers, and the measured-sheet limit.
