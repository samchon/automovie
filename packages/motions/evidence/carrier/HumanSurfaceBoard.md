# src/carrier/HumanSurfaceBoard.ts#HumanSurfaceBoard

## @evidence contracts/development/common.md#meaningful-documentation

States the entry, frame, source, return and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Stores displayed foot locations, reconstructs planted world goals and uses the engine's rigid support carry to keep both on the prop. A grip is fitted at the support point's start pose, which the same carry moves, so it stays on a point rigidly attached to the support.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One support check, one two-foot goal snapshot and one carried plan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No assumed board speed, water displacement or ground-to-deck acquisition.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two goals are placed once and the common rigid carrier owns each frame evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses standing knee references and the same support carry as an action on a wagon.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains the entered goals and board reader for its own lifetime.
