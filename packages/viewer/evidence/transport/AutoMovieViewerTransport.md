# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (One authoritative review clock for a deterministic film producer: exact seeks, interval playback at a review speed, optional synchronized sound and capture freezes, all through one synchronous `place(seconds)` producer) and documents 21 documented members as stated in this comment.

## @evidence contracts/development/design.md#principled-representation

Represents One authoritative review clock for a deterministic film producer: exact seeks, interval playback at a review speed, optional synchronized sound and capture freezes, all through one synchronous `place(seconds)` producer: class of 21 members (`seconds`, `playing`, `sound`, `error`, `interval`, `available`, ...); units and frames named in its text: second, seconds, milliseconds, frame. It has no optional member, so no absent-value state combines with another. 2 members are readonly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieViewerTransport` in packages/viewer/src/transport/AutoMovieViewerTransport.ts; its surface is the 21 members listed and the text shows 3 other files naming it, mostly packages/viewer (2), test (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.

# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport.prototype.play

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Start playback from the committed second, after the sound starts.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Start playback from the committed second, after the sound starts) directly over its typed inputs as a fixed number of statements with no loop or recursion in the body, delegating to `String`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One async operation of 20 lines and 5 top-level statements that reuses `String` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of its inputs; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Awaits 1 call per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.

# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport.prototype.pause

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Stop playback and sound without moving the displayed second.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Stop playback and sound without moving the displayed second) directly over its typed inputs as a fixed number of statements with no loop or recursion in the body; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 5 lines and 3 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of its inputs; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.

# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport.prototype.seek

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Place an exact second inside the available range.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Place an exact second inside the available range) directly over its typed inputs (`seconds`) as a fixed number of statements with no loop or recursion in the body, delegating to `Number.isFinite`, `String`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 19 lines and 3 top-level statements that reuses `Number.isFinite`, `String` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `seconds`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.

# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport.prototype.tick

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Advance a running clock to the frame due now; call once per display frame.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Advance a running clock to the frame due now; call once per display frame) directly over its typed inputs as a fixed number of statements with no loop or recursion in the body, delegating to `Math.min`, `Math.max`, `Math.floor`, `String`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literal 1000, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 26 lines and 6 top-level statements that reuses `Math.min`, `Math.max`, `Math.floor`, `String` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1000 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of its inputs; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.

# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport.prototype.setInterval

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Select a playback interval by placing its start first.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Select a playback interval by placing its start first) directly over its typed inputs (`start`, `end`) as a fixed number of statements with no loop or recursion in the body, delegating to `Number.isFinite`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 14 lines and 3 top-level statements that reuses `Number.isFinite` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `start`, `end`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.

# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport.prototype.freeze

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Pause for a capture and return a once-only release that may resume.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Pause for a capture and return a once-only release that may resume) directly over its typed inputs as a fixed number of statements with no loop or recursion in the body; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 10 lines and 4 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of its inputs; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.

# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport.IAudio

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: A synchronized sound source.

## @evidence contracts/development/design.md#principled-representation

Represents A synchronized sound source: interface of 2 members (`play`, `pause`); units and frames named in its text: second, seconds. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `IAudio` in packages/viewer/src/transport/AutoMovieViewerTransport.ts; its surface is the 2 members listed and the text shows 0 other files naming it, so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport.IAudio.play

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Start from a film second at a speed; resolves once sounding.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Start from a film second at a speed; resolves once sounding.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.

# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport.IAudio.pause

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Stop any current sound.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Stop any current sound.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.

# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Transport settings and collaborators.

## @evidence contracts/development/design.md#principled-representation

Represents Transport settings and collaborators: interface of 6 members (`place`, `available`, `fps`, `speeds`, `audio`, `now`); units and frames named in its text: second, seconds, frame, frames, milliseconds. Optional members `speeds`, `audio`, `now` express documented absence, and the ranges its member docs state are left to runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `IOptions` in packages/viewer/src/transport/AutoMovieViewerTransport.ts; its surface is the 6 members listed and the text shows 14 other files naming it, mostly packages/human (10), test (3), packages/engine (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; 3 optional members (`speeds`, `audio`, `now`) are independent fields rather than alternatives of one another as far as their docs state; it duplicates no type that another owner declares as far as a name search shows.

# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport.IOptions.place

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: The synchronous producer that displays a second; throws on failure.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: The synchronous producer that displays a second; throws on failure.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.

# src/transport/AutoMovieViewerTransport.ts#AutoMovieViewerTransport.IOptions.now

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Clock in milliseconds; `performance.now` by default.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Clock in milliseconds; `performance.now` by default.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
