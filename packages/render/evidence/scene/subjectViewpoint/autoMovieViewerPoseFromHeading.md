# src/index.ts#autoMovieViewerPoseFromHeading

## @evidence contracts/development/implementation.md#principled-implementation

Uses spherical heading trigonometry in degrees with a one-metre orientation target; ordinary clips must satisfy 0<near<far, while finite position/heading/lens and nonfinite clip refusal are not fully enforced.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A pure pose constructor stays separate from camera mutation and subject-bound framing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixture direction or visual fit replaces authored heading; the one-metre target is orientation only and need not lie within the clip range.

## @evidence contracts/development/common.md#meaningful-documentation

Documents axes/signs, target distance, borrowed references and current numeric admission gap.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed trigonometric arithmetic creates one pose and one target record, independent of mesh/population size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each call computes fresh target coordinates; shared position/lens references do not cache camera or scene effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns only returned small records and borrows input references; it acquires no native resource or background task.
