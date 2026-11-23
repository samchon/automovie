# src/composition/AutoMovieChain.ts#AutoMovieChain

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (An immutable composition value with fluent combinators, the return type of a production's subject methods: `a.jab().next(a.cross()).with(b.slip())`) and documents 6 documented members as stated in this comment.

## @evidence contracts/development/design.md#principled-representation

Represents An immutable composition value with fluent combinators, the return type of a production's subject methods: `a.jab().next(a.cross()).with(b.slip())`: class of 6 members (`node`, `?`, `of`, `next`, `with`, `derive`). It has no optional member, so no absent-value state combines with another. 1 member is readonly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieChain` in packages/engine/src/composition/AutoMovieChain.ts; its surface is the 6 members listed and the text shows 7 other files naming it, mostly movies (5), packages/engine (1), test (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/composition/AutoMovieChain.ts#AutoMovieChain.of

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: A chain of one part.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (A chain of one part) directly over its typed inputs (`part`) as a fixed number of statements with no loop or recursion in the body, delegating to `AutoMovieComposition.of`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 3 lines and 1 top-level statements that reuses `AutoMovieComposition.of` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `part`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.

# src/composition/AutoMovieChain.ts#AutoMovieChain.prototype.next

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: This chain followed by parts, flattening a trailing sequence.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (This chain followed by parts, flattening a trailing sequence) directly over its typed inputs (`parts`) as a single pass (map over parts), delegating to `parts.map`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 8 lines and 2 top-level statements that reuses `parts.map` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `parts`; the dominant cost is a single pass (map over parts), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.

# src/composition/AutoMovieChain.ts#AutoMovieChain.prototype.with

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: This chain together with parts starting at the same instant.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (This chain together with parts starting at the same instant) directly over its typed inputs (`parts`) as a single pass (map over parts), delegating to `parts.map`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 8 lines and 2 top-level statements that reuses `parts.map` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `parts`; the dominant cost is a single pass (map over parts), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
