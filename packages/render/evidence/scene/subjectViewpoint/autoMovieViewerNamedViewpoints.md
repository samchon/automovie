# src/scene/subjectViewpoint/autoMovieViewerNamedViewpoints.ts#autoMovieViewerNamedViewpoints

## @evidence contracts/development/common.md#meaningful-documentation

States the naming rule, each view's camera side and what it reads, the picture-up of the two vertical views, the distance factor's default and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Orthogonal views read one plane each without foreshortening across it, and the two three-quarter views show every side of a form between them; the angles are the framing owner's azimuth and elevation, with azimuth zero on +Z.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal table of id, azimuth and elevation, mapped to viewpoints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sides are world axes, not a subject's guessed facing, and an unusable distance factor is refused as the turntable plan refuses it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight records.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The records are the viewpoint type the framing and capture owners already take, so a named view needs no second framing path.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh plain records and keeps nothing.
