# src/climbing/climbLadder.ts#climbLadder.plan

## @evidence contracts/development/common.md#meaningful-documentation

The namespace gives the four-beat pattern, rung geometry, timing and refusals; this entry prepares the fixed supports and limb clocks.

## @evidence contracts/development/implementation.md#principled-implementation

Preserves each original minimum-jerk limb move and rung contact, the pelvis height and lowering, and initial hand reach from the entry arms.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Body/ladder admission precedes fixed footprint/handhold preparation and per-limb beat arrays; separate support and arm primitives let root/leg demand omit arm work.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the authored rung count, beat order, clearance, approach bounds and contact windows, and still fits every requested hand against its actual wrist pose and ROM.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each fixed rung contact, arc and socket is prepared once. Ordinary requests use logarithmic limb lookups. Native interior evaluations index the four intervals selected at event boundaries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed body, still base and ladder share rung/arc/socket geometry, root-line scalars and entry arms. Held grips read their prepared point directly and moving grips keep their continuous anatomy-based bend reference.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Plan-owned rung/beat and fixed-geometry arrays release with the plan. Current FK/ROM loans end with the synchronous write.
