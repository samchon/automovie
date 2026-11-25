# src/human/generation/hand/IAutoMovieHumanHandSolve.ts#IAutoMovieHumanHandSolve.ISolved

## @evidence contracts/development/common.md#meaningful-documentation

What the solve gives: the hand's scales, the arm built with them, and the joints.

## @evidence contracts/development/design.md#principled-representation `measures`: The hand's scales as solved, each at its measure's site. `law`: The arm built with those scales, whatever more than the wrist it carries. `joints`: The knuckles and the thumb's base for those scales.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHandSolve.solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `measures`, `law`, `joints`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandSolve.ts#IAutoMovieHumanHandSolve.SolveMakeArm

## @evidence contracts/development/common.md#meaningful-documentation

Solve the hand's scales and the wrist's circle at their measurement sites (ANSUR II and ISO 7250-1 definitions), in rounds: each scale moves by its measure's ratio to its input, and the measures barely couple.

## @evidence contracts/development/design.md#principled-representation

Solve the hand's scales and the wrist's circle at their measurement sites (ANSUR II and ISO 7250-1 definitions), in rounds: each scale moves by its measure's ratio to its input, and the measures barely couple. The callable takes measures and returns A.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandSolve.SolveMakeArm is the canonical exchange used by AutoMovieHumanHandSolve.solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHandSolve.solve for solve the hand's scales and the wrist's circle at their measurement sites (ANSUR II and ISO 7250-1 definitions), in rounds: each scale moves by its measure's ratio to its input, and the measures barely couple.
