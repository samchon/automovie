# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.Gait

## @evidence contracts/development/common.md#meaningful-documentation

States what it is.

## @evidence contracts/development/design.md#principled-representation

The supported gait vocabulary, as a closed union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; a parameter of `rideQuadruped` and the key of every species' table.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed literals, not free text.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.Lead

## @evidence contracts/development/common.md#meaningful-documentation

States what it names.

## @evidence contracts/development/design.md#principled-representation

A closed union of the two leads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; a stride's lead.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed literals, not free text.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IStride

## @evidence contracts/development/common.md#meaningful-documentation

States what it is.

## @evidence contracts/development/design.md#principled-representation

The two choices a stride is taken at.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by `phase`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IRow

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

One declared speed in metres per second, with period, spread and fore/hind contact durations in seconds; the table owner distinguishes experimental statistics, derived representative clocks and explicit authoring.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the element of `IGait.rows`, read by `timing`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No provenance is inferred from the schema; the source table must distinguish measurements, derivations and author inputs.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IGait

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

The gait's clock and pose variables in seconds, metres, degrees and fractions; their observed, derived or authored origin belongs to the supplying table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; each species states its own in its `ITable`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None; a value one gait borrows from another says so where the species states it.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IElevation

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinate, its two ends and that the ride reads it from the rig.

## @evidence contracts/development/design.md#principled-representation

One unitless coordinate per limb end along the neutral cannon, so the height scales with the animal's own segments.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read only by the ride's swing lift for gaits whose source states heights by landmark, such as the FEI passage and piaffe.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Admission keeps each coordinate inside zero to one; no withers fraction is fitted to stand in for the landmark.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITable

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

Gaits by name in speed order, a declared scaling reference and the cross-gait controls; imported source tables own observed statistics, derived clocks and authored construction values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; a species' `createQuadruped.ISpecies.table`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITiming

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

A gait's timing at a speed: stride time and its deviation in seconds, and the duty factor, a fraction between 0 and 1.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; returned by `timing` and read by `rideQuadruped`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.of

## @evidence contracts/development/common.md#meaningful-documentation

States the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A lookup in the species' table.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find, or refuse with the alternatives.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A gait the species lacks is refused, never borrowed from another species.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.scale

## @evidence contracts/development/common.md#meaningful-documentation

States the similarity rule, its sources, what stands for leg length and how far it falls short of a measured case.

## @evidence contracts/development/implementation.md#principled-implementation

The existing square-root rule is unchanged by default; an absolute table preserves its declared seconds and speeds without inferring an experimental reference height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One square root.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No factor is fitted to the warmblood figures; the shortfall is stated instead.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.range

## @evidence contracts/development/common.md#meaningful-documentation

States what the range is and how height enters.

## @evidence contracts/development/implementation.md#principled-implementation

The first and last declared rows' speeds times `scale`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two lookups and one factor.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `of` and `scale`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.timing

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs' units and ranges, what height does, that scaled values are provisional and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Read the bracket at speed over scale, interpolate declared period/contact durations, and apply the table's scaling rule. Fore and optional hind duty are each contact duration over the common declared period; a missing hind row retains that row's prior fore approximation. Legacy tables emit no new field.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit height, tempo and speed, find the bracket, interpolate the common times and optional hind stance, then return their ratios.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is extrapolated beyond the rows.

## @evidence contracts/development/implementation.md#efficient-algorithms

A linear scan in the declared row count; authored tables have no inferred experimental row-count bound.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `of`, `scale` and `range`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.phase

## @evidence contracts/development/common.md#meaningful-documentation

States the zero and the mirror.

## @evidence contracts/development/implementation.md#principled-implementation

The right lead is the left lead's mirror image: each foot takes its opposite's phase, shifted so the left fore still lands at 0.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup, or a mirrored lookup and a shift.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `of`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
