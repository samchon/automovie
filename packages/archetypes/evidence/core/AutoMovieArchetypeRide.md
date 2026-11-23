# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.ISample

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

A pose together with the course state it was taken at.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; returned by a ride's `at` and read by whoever is carried and by the capture subjects.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None; it extends `IPose` and repeats none of its members.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.ILine

## @evidence contracts/development/common.md#meaningful-documentation

States what a line is and what its points name.

## @evidence contracts/development/design.md#principled-representation

An id, a radius in metres and an ordered list of attachment points, each an end of either model in the form a span's end takes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here, beside the coupling that moves both models; read by `towed`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A point names its model by its one key, so it cannot name both.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.ILinePoint

## @evidence contracts/development/common.md#meaningful-documentation

States what a point names.

## @evidence contracts/development/design.md#principled-representation

A union of an end on either model or a held point, the others absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the points of `ILine`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.ILineHeld

## @evidence contracts/development/common.md#meaningful-documentation

States the reader's unit and space.

## @evidence contracts/development/design.md#principled-representation

A pure reader of film seconds returning world metres, the other ends absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplied by a performance's hand reader and read by `towed`'s line laying.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reader is the performer's; the line owner invents no hand position.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.ILineHeld.held

## @evidence contracts/development/common.md#meaningful-documentation

States the film second it takes and the world point it returns, metres.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A callback the caller supplies; its implementation is the caller's.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.ILineState

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and space.

## @evidence contracts/development/design.md#principled-representation

The line's id, its radius in metres and its points in the world, in order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; carried by a towed ride's samples.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.IPose

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

A support's own state at one course state: the archetype as posed there and its root's placement in the world with unit scale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; returned by each ride's pose function to `along`, with an optional contact reader a ride's `frame` reads first.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contact reader is optional: a poser that cannot place a contact alone omits it or answers undefined, and the posed archetype places it.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.IPose.frame

## @evidence contracts/development/common.md#meaningful-documentation

States the contact frame's space, what an undefined answer means and that a ride's `frame` reads it first.

## @evidence contracts/development/implementation.md#principled-implementation

A contact's frame depends only on its carrier's chain, so a poser that knows the chain places it without posing the rest of the model.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional method beside the pose's archetype and placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Answers only what the full pose would give; a contact it cannot place alone is left to the posed archetype, never approximated.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature; its cost is the poser's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The poser's own prepared chain is read, not a second model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature; it retains nothing of its own.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.IRide

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

A ride as plain data and two pure samplers over film seconds: the plan, its duration in seconds, labelled instants in time order, the sample at a second and a contact's world frame at a second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; returned by `along` and by every ride of the package.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.IRide.at

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and what is returned outside the course's range.

## @evidence contracts/development/implementation.md#principled-implementation

The plan's state at that second, mapped by the ride's pose function to the archetype's own state and placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One course sample, one pose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is interpolated between samples: each is computed from the second alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

One course sample and one pose per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the plan with every other sample; samples are not cached, since a consumer asks each second once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the ride's own closure.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.IRide.frame

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and what is returned outside the course's range.

## @evidence contracts/development/implementation.md#principled-implementation

The contact's model-local frame in the archetype's state at that second, composed under the root's placement: the poser's own frame of it where it can place the contact from its carrier alone (`IPose.frame`), the posed archetype's contact otherwise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose, one contact frame, one composition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing id is refused, before any demand path reads it, never given a default frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pose per call; a poser that places the contact from its carrier poses no whole model for it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the ride's poser, its contact reader and `AutoMovieArchetypeFrame.compose`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the ride's own closure.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.ITowedSample

## @evidence contracts/development/common.md#meaningful-documentation

Refers to the selected tow observation at one film second.

## @evidence contracts/development/design.md#principled-representation

Shares the contact query and its current posed geometry contract.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exposes the canonical snapshot through the existing ride namespace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Alias leaves all field types and query behavior to the tow geometry owner.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.ITowedRide

## @evidence contracts/development/common.md#meaningful-documentation

Names the extended ride and the use of its query.

## @evidence contracts/development/design.md#principled-representation

The canonical tow-specific extension of a general ride.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the tow return type accessible from the ride namespace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Alias adds no alternative query representation.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.along

## @evidence contracts/development/common.md#meaningful-documentation

States each input's role and the default.

## @evidence contracts/development/implementation.md#principled-implementation

The plan gives the course state in closed form and the pose function maps it to the support's own state, so each sample is independent of every other.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan the course unless a plan was handed in, merge the instants, return two samplers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the owners it calls.

## @evidence contracts/development/implementation.md#efficient-algorithms

One course sample and one pose per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The plan is shared by every sample, and a ride that planned the course for its own instants hands that plan in; samples are not cached, so every caller owns its record and every read observes its course and poser.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The ride holds the rest archetype and the plan for as long as its caller keeps it.

# src/core/AutoMovieArchetypeRide.ts#AutoMovieArchetypeRide.towed

## @evidence contracts/development/common.md#meaningful-documentation

States what is held, the trailer model, the integration, determinism and what is published.

## @evidence contracts/development/implementation.md#principled-implementation

Planar no-side-slip heading uses the height-dependent horizontal lever projection from ArchetypeTowing. The existing millisecond central difference and shared RK4 trajectory remain; a front pivot's velocity includes both heading and projected-length derivatives. Exact axle/pole pitch closes the coupling while keeping declared wheel supports at the common course-ground datum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare one declared geometry owner, integrate the existing planar headings, then sample its supported placement and source joint travels before emitting inter-model lines.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No unknown support is inferred, chassis height correction or stretched shaft hides mismatch. Coupling closure is checked at scale-dependent binary64 error. This planar model does not solve terrain profiles, suspension, wheel loads or tyre slip.

## @evidence contracts/development/implementation.md#efficient-algorithms

The existing four RK4 evaluations per default step use a fixed number of leader/course reads and closed geometry operations; sampling reads the prepared trajectory and source articulations once, without another solver loop.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The integrated heading serves every sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The ride holds the leader, the trailer and the heading's knots for as long as its caller keeps it.
