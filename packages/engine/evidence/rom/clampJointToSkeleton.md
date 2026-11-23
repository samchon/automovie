# src/rom/clampJointToSkeleton.ts#clampJointToSkeleton

## @evidence contracts/development/implementation.md#principled-implementation

Find the first matching skeleton bone and prefer a nonnull override over the humanoid table, returning the original unconstrained joint or a clamped record; swing-twist uses the skeleton's current axis precedence and canonical rest frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A one-joint seam permits selective correction; operation factories share the private constraint gate. borrow recognizes only those actual factory callables for query-owned scratch inputs, keeping arbitrary callbacks on their original fresh-input path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing bones retain named-default fallback; this does not establish skeleton membership, identity or physical convergence.

## @evidence contracts/development/implementation.md#efficient-algorithms

First-bone lookup is O(B); only swing-twist needs an O(B) current-axis merge. Full-pose callers share their operation's index/axes before unchanged projection. Factory provenance registration and borrow lookup are constant-time; actual query scratch reuse belongs to the projector, with no measured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All consumers share getConstraint precedence; standalone lookup remains live. Exact factory-callable provenance proves only that its closure stores source metadata, never input/output joints: projection still executes per call. Wrappers/proxies/bound/foreign callables have no registration and receive no borrowing capability.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A weak callable map borrows the same constraint already bound by each one-joint clamp without retaining inputs or results. Closure metadata releases with the caller-owned function. Unconstrained results can alias scratch inputs. No handle or task is retained.

## @evidence contracts/development/common.md#meaningful-documentation

States precedence, borrowed unconstrained result and targeted use. Companion prose defines genuine callable borrowing, output aliasing and fixed one-joint provenance. ownsConstraint recognizes the borrowed constraint of a genuine one-joint clamp and declines multi-joint or opaque callbacks.
