# src/sport/handspring.ts#handspring.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The floor at height 0 as the hands' surface, through `over`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `over`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work over `over`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing of its own.

# src/sport/handspring.ts#handspring.over

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the plan and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The wheel to the release, the release's centre and its rate of change with the angle read from the table, the rate solved so the flight's turn over its fall time reaches `LAND`, and the support's constant angular acceleration ending at that rate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shape, the table, the release, the rate, the timing, then the posture by phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rate past the bound or a landing no rate reaches is refused, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Demanded spoke FK, two-hand surface observation, two-foot entry/touchdown FK and all forty fall-time bisections retain their complete canonical admission. Fixed arched flight prepares actual local COM/projected articulation; each query rotates that offset and copies original joints without another FK/mass scan or eligible projection. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Wheel/flight/landing owners remain. Three fixed key pairs and the arched articulation/COM prepare once; entry/touchdown share only actual two-foot demand membership. Both original release-angle COM observations borrow one scoped FK/projector source, and landing lowering may borrow its synchronous parent's exact FK workspace, without a time/result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains its table/model, three key-pair readers and fixed arched articulation/local COM. Release-query FK/projector sources end with their IIFE and only centre/slope numbers escape. Output joints are fresh; optional parent loans stay synchronous and never enter a plan or output evidence.
