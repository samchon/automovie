# src/film/validatePropPlacements.ts#validatePropPlacements

## @evidence contracts/development/implementation.md#principled-implementation

Indexes every registry by id into lists before judging, so references resolve independent of declaration order and duplicates stay visible; relation targets are checked against a closed kind table, support cycles by `validatePropSupportCycles`' depth-first search, and geometry only for props whose forging, staging and footprint are sound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This file owns the registry, the staged join and the relation graph; volume judgments live in `validatePropPlacementGeometry`, prop-to-prop contact in `validatePropAffordanceTarget`, cycles in `validatePropSupportCycles`, forging in `forgeProp`, and the box-axis rule in `propBoxAxisIsSound`, so each rule has one owner and this gate reads as the list of checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Duplicates and ambiguous references are reported rather than resolved by last-write-wins, unsound props are excluded from geometry so one fault is reported once, and no prop, model, building or relation kind is special-cased beyond the closed kind and affordance tables.

## @evidence contracts/development/common.md#meaningful-documentation

States every registry, join, relation, cycle and box rule, the limited claims of a placementless prop and its remaining occupancy and support roles, the delegation of geometry, and that external appearances are judged by the same rules.

## @evidence contracts/development/implementation.md#efficient-algorithms

Indexes props, set pieces and environments linearly, then delegates forging for every prop. Relations use map joins plus scans of referenced environment ids or model affordances; cycle search visits props and scans their relations linearly. The geometry pass adds pairwise/clearance box tests and delegated footprint/part measurements. Cost includes those nested model, relation and geometry populations without assuming a small shot.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One validation per call; production runs it once per shot compile and every index is rebuilt from that shot's registry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the indexes and collector die with the call and the returned violations belong to the caller.
