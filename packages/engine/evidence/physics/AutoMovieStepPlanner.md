# src/physics/AutoMovieStepPlanner.ts#AutoMovieStepPlanner.prototype.at

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Binary search returns a new placement; callers cannot mutate the cache.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Binary search returns a new placement; callers cannot mutate the cache) directly over its typed inputs (`bone`, `seconds`) as a single pass (while loop), delegating to `Number.isFinite`, `structuredClone`, `AutoMovieStepPlanner.swing`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 42 lines and 10 top-level statements that reuses `Number.isFinite`, `structuredClone`, `AutoMovieStepPlanner.swing` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `bone`, `seconds`; the dominant cost is a single pass (while loop), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.

# src/physics/AutoMovieStepPlanner.ts#AutoMovieStepPlanner

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (World support placements and explicit scheduling policy) and documents 7 documented members as stated in this comment.

## @evidence contracts/development/design.md#principled-representation

Represents World support placements and explicit scheduling policy: companion namespace of 7 members (`IPlacement`, `IReservation`, `IStep`, `IState`, `IInput`, `angle`, ...); units and frames named in its text: world, radians, metres, second, seconds. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieStepPlanner` in packages/engine/src/physics/AutoMovieStepPlanner.ts; its surface is the 7 members listed and the text shows 6 other files naming it, mostly packages/engine (3), test (3), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/physics/AutoMovieStepPlanner.ts#AutoMovieStepPlanner.angle

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Signed shortest angle, radians, preserving both pi endpoints.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Signed shortest angle, radians, preserving both pi endpoints) directly over its typed inputs (`value`) as a fixed number of statements with no loop or recursion in the body, delegating to `Envelope.angle`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 3 lines and 1 top-level statements that reuses `Envelope.angle` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `value`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.

# src/physics/AutoMovieStepPlanner.ts#AutoMovieStepPlanner.swing

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Quintic endpoint interpolation and a lifted sine arc, as in supported stepping.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Quintic endpoint interpolation and a lifted sine arc, as in supported stepping) directly over its typed inputs (`from`, `to`, `progress`, `height`, `peakPitch`) as a single pass (every over [ ...from.point, from.ya), delegating to `Math.max`, `Math.min`, `Envelope.smoother`, `angle`, `Math.sin`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 33 lines and 4 top-level statements that reuses `Math.max`, `Math.min`, `Envelope.smoother`, `angle`, `Math.sin` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `from`, `to`, `progress`, `height`, `peakPitch`; the dominant cost is a single pass (every over [ ...from.point, from.ya), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
