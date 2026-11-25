# src/actions/walkLegRise.ts#walkLegRise

## @evidence contracts/development/common.md#meaningful-documentation

States the rounded room rule, the dip search, the reach admission of an unstandable pitch, the minimum-jerk hand-over, each input's units and the bound on the result.

## @evidence contracts/development/implementation.md#principled-implementation

Keeps the smooth maximum of the asked room and none (`smoothMinimum`, negated); walks the room down in `SCAN` steps to its first low (or narrows it by `walkLegLow`'s golden section), brackets the kept room's pitch beyond it by Illinois false position (Dowell and Jarratt 1971) with bisection where an end has no finite room, and blends from the asked pitch on a minimum-jerk weight (Flash and Hogan 1985) over the rounding width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The heel-rise search on any room rule, moved from `walkLeg` with its resolutions; `walkLeg.prepareHeelRise` and `walkReachStance` give it their rooms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

`STEEPEST` and the rounding width are provisional documented bounds; `RESOLVED` and `REACHED` are resolutions under a pose's micrometre, not tolerances on the requirement.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 150 room readings for the dip walk, 60 Illinois steps and 30 halvings, plus 27 reach halvings when the asked pitch cannot be stood on and no certified boundary is given.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A caller's certified reach boundary replaces the reach bisection when it is given.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing between calls.
