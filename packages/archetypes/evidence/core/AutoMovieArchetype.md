# src/core/AutoMovieArchetype.ts#AutoMovieArchetype

## @evidence contracts/development/common.md#meaningful-documentation

States that the instance is a model, which members serialise, each accessor's purpose, the units and the model's axes.

## @evidence contracts/development/design.md#principled-representation

A model plus read-only derived views of it; the state that distinguishes an articulated copy lives in private fields, so the serialised model stays the single truth of what is drawn and what is touched.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contacts, sites, articulation, mass properties and colliders serve the prop axis (#3358); convexCells additionally preserves wall correspondence in placed assemblies. Type parameters carry the producer's closed contact ids.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No registry and no string-keyed parameter: an archetype is made only by its typed producer, and an unknown id is a refusal, never undefined.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.prototype.travel

## @evidence contracts/development/common.md#meaningful-documentation

States the units, what a follower reads and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A lookup in the travels the pose resolved.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find, or refuse with the alternatives.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An id that is no articulation is refused, never read as 0.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the travels the constructor's pose resolved.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.prototype.span

## @evidence contracts/development/common.md#meaningful-documentation

States the space and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation `AutoMovieArchetypeSpan.state` over the posed parts and affordances, the same ends the parts were laid between.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find, then one call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown span is refused, never undefined.

## @evidence contracts/development/implementation.md#efficient-algorithms

A scan of the spans and of the parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeSpan.state`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.prototype.affordance

## @evidence contracts/development/common.md#meaningful-documentation

States the frame's space and why a typed id can still be refused.

## @evidence contracts/development/implementation.md#principled-implementation

A lookup by id over the model's own affordance list, the same list a serialised copy carries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find, or refuse with the alternatives.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing id never yields a default contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

A scan of at most tens of affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A lookup with nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.prototype.site

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinates, the space and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to the site rule of the affordance's kind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup, one call.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the two owners it calls.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work after the lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `affordance` and `AutoMovieArchetypeSite.at`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.prototype.placed

## @evidence contracts/development/common.md#meaningful-documentation

States the placement's premise and the result's space.

## @evidence contracts/development/implementation.md#principled-implementation

The model-local frame composed under the placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup, one composition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A scaled placement is not supported, as `AutoMovieArchetypeFrame.compose` states.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work after the lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeFrame.compose`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.prototype.articulate

## @evidence contracts/development/common.md#meaningful-documentation

States the units, that the state is absolute and that the receiver is unchanged.

## @evidence contracts/development/implementation.md#principled-implementation

Poses the rest model again at the new state, so travel never accumulates error over successive calls.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One construction from the rest data.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A travel outside its range is refused by the pose, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in parts and affordances per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The rest data, materials and mass properties are shared with the new archetype, never copied.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each archetype holds one reference to the shared rest data and its own posed lists.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.projection

## @evidence contracts/development/common.md#meaningful-documentation

Returns the rest graph's reader of absolute travels, or undefined when full articulation owns additional behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Only the unchanged native articulation of a span-free model has no later span or override effects.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A capability check followed by the rest graph reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the original rest frames even when the receiver is already posed.

## @evidence contracts/development/implementation.md#efficient-algorithms

The rest index is prepared once per reader.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same projection as complete articulation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader owns the rest graph until released.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.prototype.reposed

## @evidence contracts/development/common.md#meaningful-documentation

States what is kept, what is replaced and who calls it.

## @evidence contracts/development/implementation.md#principled-implementation

The repose owner preserves each producer's contact identities and physical semantics, placing their carriers from supplied frames or rest. The constructor then resolves spans and their explicitly constrained held axes from that same pose; mass properties stay the rest pose's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A supplied frame map must bind every original contact exactly once; arbitrary replacement contacts cannot erase or widen the producer's Id contract. The caller owns geometric correctness, which validateModel admits.

## @evidence contracts/development/implementation.md#efficient-algorithms

The shared repose owner performs O(A) lookups for A supplied contact frames, beyond the constructor's pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Materials and mass properties are shared with the new archetype.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The new archetype holds its own rest record; nothing else is retained.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.prototype.surface

## @evidence contracts/development/common.md#meaningful-documentation

States what null means.

## @evidence contracts/development/implementation.md#principled-implementation

A lookup in the producer's declarations, which posing never changes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An undeclared surface is null, never a default material.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A lookup with nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.prototype.friction

## @evidence contracts/development/common.md#meaningful-documentation

States the result and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The part's declared material and `AutoMovieArchetypeFriction.pair`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup, one pair.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An undeclared surface or an unmeasured pair is refused, never given a default coefficient.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeFriction.pair`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.prototype.shapes

## @evidence contracts/development/common.md#meaningful-documentation

States the state and the space.

## @evidence contracts/development/implementation.md#principled-implementation

Physical models use their own primitive or declared convex-cell solids under current transforms. A visual-only model supplies no colliders.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A visual model returns an empty list. The physical branch calls the shared shape owner once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The render mesh of a visual-only model cannot admit a collider.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in parts plus declared cell corners; computed on request because most archetypes are never grasped.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Cells reuse their generating boundary. Collider outputs are independent; callers needing repeated contact queries can retain that result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.prototype.moment

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and the use.

## @evidence contracts/development/implementation.md#principled-implementation

The parallel-axis theorem over the archetype's own mass properties.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Refuse a missing mass record, then call the parallel-axis owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A visual-only model supplies no fallback inertia.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeMass.about`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.prototype.broken

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and when nothing breaks.

## @evidence contracts/development/implementation.md#principled-implementation `AutoMovieArchetypeFracture.split` over the rest record, each record made an archetype at rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A visual-only model never splits. A physical split yields one construction per record.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the owner it calls.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the parts, through `split`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeFracture.split`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetype.ts#AutoMovieArchetype.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and where its members are documented.

## @evidence contracts/development/design.md#principled-representation

The record `IAutoMovieArchetypeProps` defines, under the name every producer and reader already uses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by `AutoMovieArchetype`; written by `AutoMovieArchetypeBuilder.build` and read by the constructor.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An alias, not a second record.
