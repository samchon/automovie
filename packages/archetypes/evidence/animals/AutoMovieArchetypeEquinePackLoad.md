# src/animals/AutoMovieArchetypeEquinePackLoad.ts#AutoMovieArchetypeEquinePackLoad

## @evidence contracts/development/implementation.md#principled-implementation

Each load is rigidly attached to its posed contact frame: its world placement is the ride's placement composed with that frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the box against both pads, build one box model per side, then compose placements per sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An overhanging box is refused, never scaled to fit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two contact reads and two compositions per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The two box models are built once and shared by every sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the two box models.

## @evidence contracts/development/common.md#meaningful-documentation

States the contact convention, the box's placement, the balance rule and the refusal.
