# src/exercise/workoutTurn.ts#workoutTurn

## @evidence contracts/development/common.md#meaningful-documentation

States the turn it builds, its steps and its inputs.

## @evidence contracts/development/implementation.md#principled-implementation

One full turn on the left foot's ball as three workout steps: stood, half turned with the given arms and the hip and knee eased, and closed at a full turn, the left foot pivoting on its toes (`WorkoutStance.of`); its angles are the provisional readings `WorkoutPoses` states.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility: the turn kind the dance and throw rows of `WorkoutPoses` share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angles are the table's provisional readings; nothing is tuned to a case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: three keys per body, built when the kind is read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by every turn row of the table.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh workout kind; it retains nothing.
