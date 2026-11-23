# src/core/AutoMovieArchetypeAssembly.ts#AutoMovieArchetypeAssembly

## @evidence contracts/development/common.md#meaningful-documentation

States what an assembly is, how its ids read, what it combines, where it goes, how it articulates and couples, and why it is not a producer.

## @evidence contracts/development/design.md#principled-representation

A model that is the disjoint union of placed rigid sub-models, ids kept unique by the member keys; the members' mass properties combined by the parallel-axis theorem.

## @evidence contracts/development/design.md#minimal-and-owned-surface `of`, `couple` and `member`, the three #3477 asks for; everything else is the `AutoMovieArchetype` it extends.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The member ids are a template literal union over the members' own closed ids, so a prefixed id is checked at compile time; a key may not contain the separator.

# src/core/AutoMovieArchetypeAssembly.ts#AutoMovieArchetypeAssembly.of

## @evidence contracts/development/common.md#meaningful-documentation

States each input's role, what a member keeps and each refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Each member is read at rest, ids are prefixed and frames placed, mass properties are combined and articulation state is preserved. Static and kinetic friction retain their stated mass-weighted approximation through the shared scaled convex mean, preserving finite coefficients when a direct coefficient-times-mass product underflows. If separate coordinate scaling reverses kinetic<=static by rounding, both means use the same exact dyadic reduction and final rounding law rather than clamping either value. Any missing member coefficient keeps that aggregate unknown. Restitution is retained only when every member declares the same physical material and exactly the same known coefficient; otherwise the aggregate remains unknown instead of averaging unrelated impact ratios. Even a common material reference does not certify a compound object's collision response.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the members, merge them, construct.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-rigid placement is refused rather than having its scale dropped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the members' parts, affordances and spans, plus two O(M) coefficient means for M members. An observed kinetic/static order inversion adds two exact means, still linear in M; their exceptional integer cost belongs to the shared mean owner. Coefficient/weight arrays retain O(M) temporary scalars.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses ArchetypeMassArithmetic.mean for both contact coefficients instead of independently forming potentially unrepresentable weighted products; each call still builds one independent model.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The assembly holds its members and its merged rest model for as long as its caller keeps it.

# src/core/AutoMovieArchetypeAssembly.ts#AutoMovieArchetypeAssembly.prototype.couple

## @evidence contracts/development/common.md#meaningful-documentation

States what the coupling joins, what must hold and each refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The follower's merged affordance gains the `follows` record; the members' own models are untouched, so each stays valid on its own. The engine's admission of the whole model checks the rule over the leader's full range, as it does for any model.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the follower, copy the rest model with one record replaced, construct.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A follower that already follows is refused, never overwritten.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the affordances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The parts, materials, spans and mass properties are shared with the new assembly.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The new assembly holds its own affordance list.

# src/core/AutoMovieArchetypeAssembly.ts#AutoMovieArchetypeAssembly.prototype.member

## @evidence contracts/development/common.md#meaningful-documentation

States the space, what the travels are and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The member articulated at the assembly's resolved travels of its own leader articulations; a member-declared follower takes its leader's travel again inside the member, which is the same rule, and a coupled follower is a leader within the member, so its travel is set.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find, collect the travels, articulate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown key is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the member's affordances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the member's own `articulate`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeAssembly.ts#AutoMovieArchetypeAssembly.prototype.articulate

## @evidence contracts/development/common.md#meaningful-documentation

States the ids' form and points to the documented base.

## @evidence contracts/development/implementation.md#principled-implementation

Poses the merged rest model again, which moves each member's parts as the member's own pose would, placed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refusals are the base's, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in parts and affordances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The members and the merged rest model are shared with the new assembly.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each assembly holds one reference to the shared rest model and its own posed lists.

# src/core/AutoMovieArchetypeAssembly.ts#AutoMovieArchetypeAssembly.IMember

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning.

## @evidence contracts/development/design.md#principled-representation

An archetype and a rigid placement in metres with unit scale, which `of` refuses otherwise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the values of an assembly's member record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeAssembly.ts#AutoMovieArchetypeAssembly.MemberId

## @evidence contracts/development/common.md#meaningful-documentation

States what it derives.

## @evidence contracts/development/design.md#principled-representation

The member archetype's own closed id union, inferred, so the assembly's ids follow the producer's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `Ids` and `member`'s return type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeAssembly.ts#AutoMovieArchetypeAssembly.MemberDimension

## @evidence contracts/development/common.md#meaningful-documentation

States what it derives.

## @evidence contracts/development/design.md#principled-representation

The member archetype's own closed dimension union, inferred.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `member`'s return type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeAssembly.ts#AutoMovieArchetypeAssembly.Ids

## @evidence contracts/development/common.md#meaningful-documentation

States the form of the ids.

## @evidence contracts/development/design.md#principled-representation

A template literal union over the members' keys and closed ids, so a prefixed id is checked at compile time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The assembly's affordance id parameter, read by `articulate`, `couple` and the inherited accessors.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
