# src/animals/AutoMovieArchetypeEquineDraggedLoad.ts#AutoMovieArchetypeEquineDraggedLoad

## @evidence contracts/development/implementation.md#principled-implementation

A fixed-length tow without side force on the coupling moves it only along the tow line, whose solution is the pursuit curve; the body is placed rigidly on the plane under the coupling at the scheduled depth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the inputs, integrate the coupling's path once, then place the load and lay the traces per sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No draught is invented: the author declares it and the refusal compares the two declarations.

## @evidence contracts/development/implementation.md#efficient-algorithms

One integration over cheap course reads; one plane query, one placement and two trace reads per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The integrated path serves every sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the path's knots and the footing for the ride's lifetime.

## @evidence contracts/development/common.md#meaningful-documentation

States the pull point, the pursuit, the heading, the ground and depth, the headland lift, the traces and the declared draught.
