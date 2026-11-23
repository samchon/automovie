# src/film/autoMovieSectionPlaneDistance.ts#autoMovieSectionPlaneDistance

## @evidence contracts/development/implementation.md#principled-implementation

The point-normal form of a plane gives the signed distance as the dot product of the normal with the offset from the plane point, divided by the normal's `Math.hypot` length so a non-unit normal still answers in metres; the boundary is decided as kept here once, and every section reader inherits it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one place the section sign convention and the degenerate-plane refusal live; `autoMovieSectionPlanesKeepPoint` and `classifyAutoMovieSectionPlaneBox` call it rather than repeating the arithmetic, so the three cannot disagree about a point on the plane.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A degenerate normal or a non-finite plane point throws instead of producing a `NaN` that `<= 0` would read as removed and the box classifier as crossed, so no caller receives a silent verdict about a plane that does not exist.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula and unit, the meaning of each sign, why zero is kept and how that matches `three.js` through the viewer's negation, and which inputs throw and which yield `NaN`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call: one `Math.hypot`, three finiteness checks on the plane point and one dot product; the normal's length is recomputed per call rather than cached, because the plane is a caller-owned record that may change between calls.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar function with nothing coordinated across calls; a caller evaluating many points against one plane pays the constant length computation per point.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Reads the plane and the point during the call, allocates no object, and keeps no reference to either.
