# src/core/AutoMovieArchetypeSpan.ts#AutoMovieArchetypeSpan.End

## @evidence contracts/development/common.md#meaningful-documentation

States both anchor forms and the optional held-line extension in metres.

## @evidence contracts/development/design.md#principled-representation

A part-local point or affordance origin anchors the span. An affordance's explicit nonnegative overhang extends away from the opposite anchor and aligns its grip axis with the line; numeric admission remains runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the two ends of `ISpan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The members mark the other form's keys `never`, so an end cannot name both.

# src/core/AutoMovieArchetypeSpan.ts#AutoMovieArchetypeSpan.ISpan

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and meaning.

## @evidence contracts/development/design.md#principled-representation

The part's id, its two ends, its radius in metres and the line's rest length in metres or null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; written by `AutoMovieArchetypeBuilder.span`, carried by `AutoMovieArchetype.IProps` and read by `lay` and `state`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The rest length is null, not a sentinel, when the line has none.

# src/core/AutoMovieArchetypeSpan.ts#AutoMovieArchetypeSpan.IState

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and meaning.

## @evidence contracts/development/design.md#principled-representation

The two end points in the model's space, their distance and whether that is short of the rest length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; returned by `state` and `AutoMovieArchetype.span`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeSpan.ts#AutoMovieArchetypeSpan.IPose

## @evidence contracts/development/common.md#meaningful-documentation

Names the two model lists updated together without changing contact origins or identities.

## @evidence contracts/development/design.md#principled-representation

One result keeps drawn spans and their held-frame axes consistent with the same endpoint calculation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Archetype constructor consumes both lists; geometry-only callers retain lay's existing surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No replacement contact vocabulary, hidden anchor or fitted frame is introduced.

# src/core/AutoMovieArchetypeSpan.ts#AutoMovieArchetypeSpan.locate

## @evidence contracts/development/common.md#meaningful-documentation

States the space and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A part point is the part's transform applied to it, unit scale by the builder's premise; an affordance end is its frame's origin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing reference is refused, never placed at the origin.

## @evidence contracts/development/implementation.md#efficient-algorithms

A scan of the parts or affordances, tens at most.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeFrame.point`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeSpan.ts#AutoMovieArchetypeSpan.state

## @evidence contracts/development/common.md#meaningful-documentation

States the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Locate both anchors, extend a held endpoint away from the opposite anchor by its declared overhang, then compare the finite drawn length with the rest length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two locations and one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Slack is exact: equal to the rest length is taut. Invalid lengths and coincident anchors refuse instead of producing an invented direction.

## @evidence contracts/development/implementation.md#efficient-algorithms

As `locate`, twice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `locate`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeSpan.ts#AutoMovieArchetypeSpan.lay

## @evidence contracts/development/common.md#meaningful-documentation

States what is replaced and each refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The shared dependency resolver places each cylinder between its current anchors. A span attached to another span reads its predecessor's current frame in topological order; cycles refuse.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One state and one part per span.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Coincident ends are refused rather than drawn as a part of no length, which the model validator refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in spans times parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shared current-state reader and the same dependency/geometry owner as complete pose emission.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeSpan.ts#AutoMovieArchetypeSpan.pose

## @evidence contracts/development/common.md#meaningful-documentation

States same-pose line/grip ownership, preserved held origins, explicit overhang semantics and conflict refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Resolve each span once, draw its finite cylinder and minimally rotate each explicit held contact's +X onto that line. An opposite axis represents the same round grip, chosen closest to its current orientation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One state list serves shared geometry placement and held-axis alignment before the two model lists are returned.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A grip origin never moves, no hidden anchor is added and incompatible simultaneous line directions refuse rather than letting the last span win.

## @evidence contracts/development/implementation.md#efficient-algorithms

Endpoint lookup costs O(S(P+A)); geometry and contact maps cost O(S+P+A) for spans, parts and contacts, without repeated state calculation in this operation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same computed endpoints drive both emitted cylinder axes and grip rotations; lay reuses the same placement owner for geometry-only consumers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

State and alignment maps are call-local; new changed frames and parts escape, no pose cache or external resource is retained.
