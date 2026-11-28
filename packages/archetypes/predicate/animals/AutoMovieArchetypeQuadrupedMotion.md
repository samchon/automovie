# src/animals/AutoMovieArchetypeQuadrupedMotion.ts#AutoMovieArchetypeQuadrupedMotion.swing

## @evidence contracts/development/common.md#meaningful-documentation

States the normalized interval, smooth forward progress and clearance apex.

## @evidence contracts/development/implementation.md#principled-implementation

The same minimum-jerk function maps swing progress and two mirrored halves of vertical clearance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Computes only two scalar shape values from one normalized swing sample.

# src/animals/AutoMovieArchetypeQuadrupedMotion.ts#AutoMovieArchetypeQuadrupedMotion.nod

## @evidence contracts/development/common.md#meaningful-documentation

States sign, half-range, the three peak events and missing-gait refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The species' declared timing picks support, bob or lead phase. The requested lead selects the forefoot phase only in the lead-timed branch.

## @evidence contracts/development/implementation.md#efficient-algorithms

Looks up one gait and samples one cosine at the required phase.
