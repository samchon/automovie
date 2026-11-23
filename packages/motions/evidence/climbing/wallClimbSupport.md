# src/climbing/wallClimbSupport.ts#wallClimbSupport

## @evidence contracts/development/common.md#meaningful-documentation

States the route's input and output, contact modes, physical premise and fit ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Each move changes only the assignment of the moving limb. An explicit release keeps three contacts, matching the three-contact state in the climbing study. The planner fits the emitted contacts in their resolved world frames.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A local assignment map accumulates moves. One pass per stance refuses an already occupied target and emits the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects two simultaneous uses of one exact hold reference. Uses the authored hold coordinates and delegates world-space placement and reach to the support action.

## @evidence contracts/development/implementation.md#efficient-algorithms

Traverses the moves once. Each stance compares at most four targets and materializes its contact records.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Retains unchanged hold assignments from the previous move and reuses the support action for all planning.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned stances and their target references survive the call, proportional to the authored route.
