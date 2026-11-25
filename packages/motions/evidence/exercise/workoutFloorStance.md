# src/exercise/workoutFloorStance.ts#workoutFloorStance.IEntry

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

Whether a held stance is kept, and the displayed posture a floor entry approaches the first key from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two values `workout.plan` branches on.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `entered` is null exactly when the body enters from standing.

# src/exercise/workoutFloorStance.ts#workoutFloorStance

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A floor stance is a prop-free, unloaded, hands-down leaning kind pinned at the hips; it is held when a plank or push-up is entered leaning with both hands and both feet planted or bearing on the ground, and lowered when entered kneeling or crouched; either starts from the displayed entry (`floorEntry.displayed`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three predicates, then one read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads only the entry's declared base and supports.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scan of the entry's supports per bearing part.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each entry is read once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns the displayed posture and retains nothing else.
