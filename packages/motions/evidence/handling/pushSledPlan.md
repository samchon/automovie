# src/handling/pushSledPlan.ts#pushSledPlan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The handles are read on the prop's frame at the start; each hand's place on its handle is taken into the leaning chest's frame where the hands arrive and carried with it after, so the load follows the trunk through the grip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The handles, the lean, the chest-held places, the contacts, the posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Bounds refuse; a missing handle refuses with the prop's handles.

## @evidence contracts/development/implementation.md#efficient-algorithms

One current runtime chest read carries both hands; settled frames skip the unused carrier baseline solve. Planning keeps every current sample chest/Bend/complete posture read, sharing only canonical hand-name/fist alignment/point and exact FK metadata. All original fits and cost pruning remain; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Original exact turn/position grasp memoization remains local, but borrowed taking/sample postures never acquire fixed direct bases, arm chains or replayed chest frames. Every actual sample fits current full goals. Runtime FK/ROM loans still reach the original carrier/baseline/carry with raw chest using FK alone.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains its original base, chosen holds and numerically produced arrival transform. Original candidate maps and exact FK metadata release with planning; no fixed-source base/frame map, arm context or dynamic loan escapes into returned posture/goal/plan.
