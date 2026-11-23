# src/core/AutoMovieArchetypeFracture.ts#AutoMovieArchetypeFracture.ISet

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's meaning.

## @evidence contracts/development/design.md#principled-representation

An id, the producer's part ids and the contacts on them that move none.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Declared by producers through `AutoMovieArchetypeBuilder.fracture`, read by `split`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeFracture.ts#AutoMovieArchetypeFracture.IHit

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit.

## @evidence contracts/development/design.md#principled-representation

The hit's finite nonnegative kinetic energy in joules, compared with the threshold, and finite-component momentum in kilogram metres per second, shared over the fragments. split admits the numeric restrictions that number alone cannot express.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `split`; written by a flight or a melee stop (#3480).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeFracture.ts#AutoMovieArchetypeFracture.IBroken

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's meaning.

## @evidence contracts/development/design.md#principled-representation

The remainder, absent when every part breaks off, and each fragment with its velocity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `AutoMovieArchetype.broken`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeFracture.ts#AutoMovieArchetypeFracture.IFragment

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The set's id, its rest record and its velocity in metres per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Listed by `IBroken`; `AutoMovieArchetype.broken` makes it a piece.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeFracture.ts#AutoMovieArchetypeFracture.IPieces

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's meaning.

## @evidence contracts/development/design.md#principled-representation `IBroken` with each record made an archetype at rest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `AutoMovieArchetype.broken`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeFracture.ts#AutoMovieArchetypeFracture.IPiece

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The set's id, the archetype at rest and its velocity in metres per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Listed by `IPieces`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeFracture.ts#AutoMovieArchetypeFracture.split

## @evidence contracts/development/common.md#meaningful-documentation

States hit units and finite-data admission, null cases, kinetic-energy feasibility, numerical overflow refusal and independent returned velocities.

## @evidence contracts/development/implementation.md#principled-implementation

Admits finite nonnegative energy and finite momentum before comparing the threshold. Each set carries only its parts, their declared surfaces, internal spans, mass and eligible contacts; a partial remainder articulation filters its bindings, and each piece drops external ride/follow references and the fracture threshold. Coordinates remain authored neutral inputs, not a baked displayed pose. Common velocity p/M gives minimum kinetic energy ||p||²/(2M) and the supplied momentum subject to binary64 division rounding. The shared mass arithmetic owns both complete piece and departing mass sums, including overflow-boundary admission. ArchetypeFractureEnergy checks the exact input-value necessary budget and supplies an admissible lower bound. Fracture work, striker and remainder dynamics are not modelled.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the hit, then one record per set and one for the remainder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A set that names a part twice or a part of another set is a producer's defect the builder refuses; no spread is drawn. Negative or non-finite hit data are refused on breakable and unbreakable objects without clamping or substituting a zero hit.

## @evidence contracts/development/implementation.md#efficient-algorithms

With F sets, P parts, S spans, C contacts and B bound-part references, records and mass reductions cost O((F+1)(P+S)); fragment contact selection costs O(F(B+C squared+F)), and remainder contact selection O(B+C). Output retains O(P+S+C+F) references, mass records and independent velocities; static geometry stays borrowed. The fixed-size exact energy guard has no scene-size dependence.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each hit makes new records.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
