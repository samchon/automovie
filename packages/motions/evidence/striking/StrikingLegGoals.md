# src/striking/StrikingLegGoals.ts#StrikingLegGoals.read

## @evidence contracts/development/common.md#meaningful-documentation

States fixed anatomical rule, world units, original borrowed foot fields and fresh bend/MTP/goal ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Rotates the foot's toe axis, adds the original half-shank forward/full-shank upward knee hint, and retains planted forefoot MTP contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered two-side loop uses the shared bend and goal owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every original point, rotation, bend, planted omission/presence and MTP offset; no knee/ankle pose is solved or cached here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two rigid hint computations and optional contact reads remain constant work; only unchanged-foot consumers use the separate explicit prepared path.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both cold and prepared paths use the same exact bend expression and field assembler; changing foot inputs still recompute the cold geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or output. Each call returns a fresh goal map/bends/contacts with the original ankle/rotation references borrowed from the caller.

# src/striking/StrikingLegGoals.ts#StrikingLegGoals.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States lazy fixed-foot snapshots, original goal mathematics and independent fresh vector/rotation/record ownership for each read.

## @evidence contracts/development/implementation.md#principled-implementation

The first actual demand computes the same toe direction, knee hint and conditional MTP offset as read; later demands mint new goal data from those exact unchanged geometric values.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy two-side snapshot feeds the same goal field owner; no fitted-pose, clock or per-query cache layer is introduced.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only explicitly unchanged feet/body/planted geometry is prepared. All goals, field order, planted/MTP semantics and downstream physical fitting remain; varying-foot users keep read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two fixed hint/contact computations run once per owning plan instead of every goal read; each read pays only constant copying and fresh goal construction, with speedup unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Actual damped balance and defence callers fix body, entry feet and planted selection for their whole plan or built geometry. Only that rigid authored geometry is shared; no pose, IK result, score or time observation is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns at most two private foot/hint/contact snapshots until release; reads return independent points, rotations, hints, contacts and goal maps, preventing caller output mutation from changing the retained geometry.
