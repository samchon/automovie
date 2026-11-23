# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IPosed

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

A model's two moving lists in the model's space; the type rules out nothing beyond their element types, and the references between them are admitted by `validateModel`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; `pose` takes and returns it and `AutoMovieArchetype` builds it from its rest data.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface package's part and affordance records and declares none of its own.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

The posed lists and one travel per articulation id, in its kind's unit, set or followed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; returned by `pose` and read by `AutoMovieArchetype`, whose `travel` publishes the travels.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Extends `IPosed` and repeats none of its members.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.range

## @evidence contracts/development/common.md#meaningful-documentation

States each kind's range and the meaning of null.

## @evidence contracts/development/implementation.md#principled-implementation

The ranges `IAutoMovieAffordance.travel` and `reverse` state for each kind, read from their engine owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call, kept so the package's readers, such as the website's gallery, ask the articulation module for a range.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the owner it calls.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `affordanceTravelRange`, which engine admission reads too.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.motion

## @evidence contracts/development/common.md#meaningful-documentation

States the unit per kind and the result for other kinds.

## @evidence contracts/development/implementation.md#principled-implementation

A turn about the rest frame's `+Y` through its origin, or a shift along the rest frame's axis the kind names.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per axis the kinds name.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Every kind takes its stated axis.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeFrame.turn` and `axis`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.pose

## @evidence contracts/development/common.md#meaningful-documentation

States the state's meaning, what is returned and each refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Normalize reversible inputs to leaders with ArchetypeArticulationState, then resolve every travel by affordanceFollowedTravel with memoization and cycle detection. Only then resolve spatial transforms through rides, with a separate memo; model admission requires each graph to be acyclic separately.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the state, resolve every travel, resolve each affordance's motion once, then move frames and bound parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A travel outside its range is refused, never clamped, a follower's included.

## @evidence contracts/development/implementation.md#efficient-algorithms

Forward travel and spatial evaluation are linear in affordances, bound parts and coupling table lookups; reverse input normalization additionally costs one follows-chain walk and inverse-table validation per authored input.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A carrier's motion and a leader's travel are shared by everything that reads them within one call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The memos live for one call; the travels are handed to the caller.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.travels

## @evidence contracts/development/common.md#meaningful-documentation

Preserves the caller's articulation ids and units.

## @evidence contracts/development/implementation.md#principled-implementation

An undefined entry is absent, while zero is an explicit travel.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the caller's own input keys.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Admission stays with the travel resolver.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the authored travels.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Complete poses and selected contacts use the same input convention.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one map owned by the sampling call.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IProjection

## @evidence contracts/development/common.md#meaningful-documentation

The travels and per-contact readers all describe the same absolute state.

## @evidence contracts/development/design.md#principled-representation

Separates complete travel admission from the spatial ancestry needed for a model-space contact frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The complete pose consumes motion and travels; a selected socket consumes its frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unknown frame ids remain absent so the archetype can issue its own refusal.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IProjection.motion

## @evidence contracts/development/common.md#meaningful-documentation

The input belongs to this rest graph; the result carries it through its own absolute travel and its carriers.

## @evidence contracts/development/implementation.md#principled-implementation

Compose its own motion under the rides chain, including the level-pedal rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The projection exposes the same total motion used to move rigid parts in a complete pose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the already-admitted travel for each articulation in the chain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits each required carrier once per projection.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Contacts that ride the same carrier share its compounded motion within this travel state.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only this projection retains the selected carrier motions.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IProjection.frame

## @evidence contracts/development/common.md#meaningful-documentation

The id identifies a rest contact; the fresh result has its posed translation, rotation and scale.

## @evidence contracts/development/implementation.md#principled-implementation

Find the original rest record and apply its total rigid motion through AutoMovieArchetypeFrame.move.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One index lookup and one frame application when found.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An absent contact has no fabricated frame; the calling model owns its refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluates only this contact and the spatial ancestor motions it needs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same total motion and frame application as a complete posed archetype.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh transform without retaining it in the projection.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.prepare

## @evidence contracts/development/common.md#meaningful-documentation

The inputs are immutable producer rest records and each invocation admits absolute travel inputs.

## @evidence contracts/development/implementation.md#principled-implementation

Resolve every travel and refusal before evaluating the spatial rides chain for a requested contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Index the rest graph once and resolve each requested state independently.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Followers and crank-carried pedals retain their full articulation semantics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Travel admission visits each articulation and a contact visits only its carrier ancestry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The full pose and single contact share their travel admission and spatial motion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader retains the rest graph and each projection retains only its own travel and spatial results.
