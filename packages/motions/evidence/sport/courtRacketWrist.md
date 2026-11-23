# src/sport/courtRacketWrist.ts#courtRacketWrist

## @evidence contracts/development/common.md#meaningful-documentation

Defines the held tool, contact frame, body-relative recovery and output.

## @evidence contracts/development/implementation.md#principled-implementation

The entering wrist pose is carried rigidly between displayed chest frames; the clock's approach and recovery shares blend the wrist and orientation without shifting the strike.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the fixed held and entry geometry once, then derive a goal for each actual posture and phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The recovery point comes from the actual displayed pickup posture and the world strike alignment uses the existing held frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads just the current chest during recovery and keeps only fixed frame and grip data.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses canonical displayed FK, the authored trunk reader and the shared rigid held-tool goal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains fixed entry and held data for the owning stroke only.
