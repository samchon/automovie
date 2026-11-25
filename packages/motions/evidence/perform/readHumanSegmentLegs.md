# src/perform/readHumanSegmentLegs.ts#readHumanSegmentLegs

## @evidence contracts/development/common.md#meaningful-documentation

States the names, the seeds' source and why a leg is only continued.

## @evidence contracts/development/implementation.md#principled-implementation

Every leaf the overlays build fits the same legs, so each name takes the same frame's seed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One chain read, one name per leaf and leg.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The seeds only start each leg's own fit against its own goal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two to the running overlays' count names a leg, in practice one to four. A second with no free leg goal returns before the chain is read, so no chain frame (a plan posture and a legs-only fit each) is built for a read that takes no seed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The chain is the placed action's own reader (`segment.legs`), prepared once when the action is placed; its frames are built from the plan's start in order whichever seconds read them, so leaving it unread at a second changes no frame.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new map of borrowed seeds and retains nothing.
