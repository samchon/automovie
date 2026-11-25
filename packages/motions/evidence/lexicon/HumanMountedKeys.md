# src/lexicon/HumanMountedKeys.ts#HumanMountedKeys
## @evidence contracts/development/common.md#meaningful-documentation

States what is solved once, in which frame, and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

Each figure's key is solved once by its seat (`HumanMountedSeats`, `HumanMountedStirrups`) in the carrier contact's frame at the start, its trunk leant as far forward as brings its holding hands in reach (`HumanMountRider.lean`) or set by a bank seat (`HumanMountedBank`); the leg arcs and the rested balls are read from consecutive keys (`HumanMountedPaths.arcs`, `HumanMountedPaths.rested`). The seats' clearance is the carrier's shapes' segment distance in the world.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cut out of `HumanMounted`'s plan as its preparation of keys and transfer paths; the plan's sampler reads them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Supports out of reach are refused by the seats; nothing is clamped onto a contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

One key per figure and four clearance queries per leg per transfer, at plan time only.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The keys and paths are prepared once and shared by every sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains them for its life, one entry per figure.

# src/lexicon/HumanMountedKeys.ts#HumanMountedKeys.IKeys

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its frame.

## @evidence contracts/development/design.md#principled-representation

The seats' context, the keys, the hips at each key and the per-transfer arcs and balls by side, metres in the carrier contact's frame at the start.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `HumanMountedKeys.of` to the mounted plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A side with no arc or ball is absent from its record, not zero.
