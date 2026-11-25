# src/exercise/WorkoutSupport.ts#WorkoutSupport.at

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The affordance's translation in the prop's frame, carried into the world by the prop's frame at the action's start.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to the single placed owner and selects its point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The refusal lists the affordances the prop does have.

## @evidence contracts/development/implementation.md#efficient-algorithms

The placed owner performs one frame read and at most two ordered O(A) searches for A affordances, with constant transforms.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the original frame/lookup/transform algorithm with placed; each call still observes its actual entry-time prop.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the point returns; the local frame and affordance references are released with the delegated observation.

# src/exercise/WorkoutSupport.ts#WorkoutSupport.placed

## @evidence contracts/development/common.md#meaningful-documentation

States entry time, world point, borrowed frame/primary affordance, ordered two-point midpoint and refusal order.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the actual prop frame once at context.start, transforms each first-matching named affordance translation by that frame and preserves the original ordered midpoint when other is present.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

After the original frame preparation, the other-property branch is read before primary lookup/point. One lookup and rigid-transform owner then exposes the already observed primary/frame to real vault consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the original other-property observation before the primary lookup, then its second read only in the two-point branch after the first point. Missing names keep original refusal/alternatives, duplicate ids keep the first match, and no target, extent or frame is guessed or cached across times.

## @evidence contracts/development/implementation.md#efficient-algorithms

One frame read and one or two ordered O(A) searches for A affordances produce the point and metadata together; callers need no repeated prop/frame read or primary search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Point, frame and primary affordance belong to this exact synchronous entry observation. At delegates here, and consumers borrow those actual values rather than starting a second observation of the same prop/time.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned point/frame/affordance record survives under the caller's ownership; this owner stores no plan, prop reader, observation, current pose or time history.
