# src/physics/IAutoMoviePhysicalHandoff.ts#IAutoMoviePhysicalHandoff

## @evidence contracts/development/common.md#meaningful-documentation

Checkpointable displacement correction for a dynamic segment returning to authored motion with continuous pose and velocity.

## @evidence contracts/development/design.md#principled-representation

tick is the preceding native tick; duration is seconds. Child corrections are parent-local, while a root's correction is in world coordinates relative to its authored path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

advancePhysicalOwnership creates and advances these records alongside native state; controller checkpoints retain the correction required to continue the same return.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record is a return trajectory, not a body snapshot or force command. completed retains the endpoint through its path check, then the next step removes the record.
