# src/film/canonicalProductionFrameRate.ts#canonicalProductionFrameRate

## @evidence contracts/development/implementation.md#principled-implementation

Divides both terms by their greatest common divisor from Euclid's algorithm, which yields the unique reduced fraction; safe-integer terms keep every remainder and quotient exact in IEEE doubles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single canonicalizer every frame-rate comparison and boundary conversion reads, including `equalProductionFrameRates`, the frame-boundary converters and the render tier planner, so reduced identity has one definition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Recognizes no named rate such as NTSC; a decimal scalar is refused instead of guessed into a fraction.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the two accepted input forms, why fractions need explicit terms with the NTSC example, the reduced output, and both throwing cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Logarithmic in the smaller term, the step count of Euclid's algorithm, with constant space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reduction of one value that coordinates nothing across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned two-term record.
