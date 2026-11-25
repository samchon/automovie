# src/compose/AutoMovieMotionHumanBendChain.ts#AutoMovieMotionHumanBendChain.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds; `prepare` makes it and `of` reads it for a chain on the same body and posture.

## @evidence contracts/development/design.md#principled-representation

The record is the shared source itself: the empty-joint trunk pose, a workspace dropped once both sides are prepared, and the trunk placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Handling's bilateral BendPreparation passes it from `prepare` to the two `of` calls; no caller-authored frames or colliders are accepted.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It carries no target, elbow or solved chain; each side still runs its own engine chain preparation.

# src/compose/AutoMovieMotionHumanBendChain.ts#AutoMovieMotionHumanBendChain.IChain

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds and its unit: the engine's preparation, the shoulder in world metres, the arm's span in metres, the rig's clinical axes and the trunk's placed colliders in world metres.

## @evidence contracts/development/design.md#principled-representation

Everything the swivel search reads that depends on the trunk alone: the chain the engine prepared, the shoulder and span derived from it, the clinical axes of the rig and the colliders the forearm must clear, all in the world frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members, all read by `AutoMovieMotionHumanBendSearch`; `prepared` and `axes` are the engine's own types, not restated.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The engine's preparation and axes types are derived from the engine's functions rather than declared again, and no member is optional, so a half-prepared chain cannot be written.

# src/compose/AutoMovieMotionHumanBendChain.ts#AutoMovieMotionHumanBendChain

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the null case.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's chain preparation on a pose whose root carries the posture's heading, and the trunk's colliders resolved on that pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose, one engine preparation and one record; an optional genuine bilateral source owns only common frame/FK/placement work.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rig without the chain is null, never a guessed chain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuses the body's merged raw-axis snapshot. Chain FK demands three chain bones/ancestry and trunk FK only the original axial obstacle names. A genuine bilateral source performs its trunk placement once, then copies S outward frames per chain through one static visitor, without a per-chain copy callback allocation; each side retains actual engine chain preparation. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The immutable body FK producer and the source's root and heading, the caller's own posture, establish common source work; placed frames are copied before return. All original side-specific chain/ROM decisions remain actual.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The ordinary lazy reader ends at return/throw. A bilateral source borrows its one workspace until both sides have been attempted, then drops that reference; its pose and placement end with its synchronous owner. Returned chains retain fresh geometry/collider frames and borrowed immutable shapes, with no reader or time-keyed result.

# src/compose/AutoMovieMotionHumanBendChain.ts#AutoMovieMotionHumanBendChain.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States what the source holds, its optional borrowed reader and the caller's same-body, same-posture contract.

## @evidence contracts/development/implementation.md#principled-implementation

Both arm sources use the same empty-joint trunk pose, formed once from the posture's root and heading; the chain and collider owners run their preparations at each `of` in side order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record; `of` reads it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No goal, selected elbow, score or candidate enters the source.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant construction; the first successful side computes the trunk FK and S placements once and the second copies them.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller's one body and posture make the trunk the same for both sides; every side still performs its own engine chain preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller releases the source with its synchronous pair; it retains one pose, O(S) trunk placements and at most one reader, dropped after both sides even on throw. Returned chains hold no source or reader.
