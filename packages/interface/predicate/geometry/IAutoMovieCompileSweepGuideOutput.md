# src/geometry/IAutoMovieCompileSweepGuideOutput.ts#IAutoMovieCompileSweepGuideOutput

## @evidence contracts/development/common.md#meaningful-documentation

A compiled guide's wrapped polar angle and metre radius evaluator.

## @evidence contracts/development/design.md#principled-representation

The compiler wraps the authored angle into a single turn and compiles a C2 profile over increasing chord-length knots.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A compiled guide retains only its direction and profile reader. The sweep combines multiple guides and owns the angular grid.

# src/geometry/IAutoMovieCompileSweepGuideOutput.ts#IAutoMovieCompileSweepGuideOutput.angle

## @evidence contracts/development/common.md#meaningful-documentation

Wrapped finite guide direction in radians in [0, 2?), starting from the section's first axis.

# src/geometry/IAutoMovieCompileSweepGuideOutput.ts#IAutoMovieCompileSweepGuideOutput.radius

## @evidence contracts/development/common.md#meaningful-documentation

Chord-coordinate evaluator of the guide's metre radius. Supply a finite coordinate and keep the profile within a positive finite range.
