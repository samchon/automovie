# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.of

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the returned definition and the automatic alternatives in refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Looks up the supplied name in the same table that supplies all gait clocks.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads one keyed entry for the query.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.phase

## @evidence contracts/development/common.md#meaningful-documentation

Defines the touchdown fraction, default origin and mirrored lead rule.

## @evidence contracts/development/implementation.md#principled-implementation

The foot's opposite-side offset is rebased against original right-fore touchdown and wrapped to one cycle.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads one pose table and uses a fixed limb permutation on right lead.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.range

## @evidence contracts/development/common.md#meaningful-documentation

States inclusive endpoints and the equal endpoints of a point clock.

## @evidence contracts/development/implementation.md#principled-implementation

The first and last ordered clock rows determine the two speeds at the query height.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads just two endpoints and applies one height factor.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.scale

## @evidence contracts/development/common.md#meaningful-documentation

States absolute scaling and the provisional square-root height ratio.

## @evidence contracts/development/implementation.md#principled-implementation

Speed and time use the same factor, while an absolute table keeps its own scale.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scaling choice and a square root produce the factor.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.timing

## @evidence contracts/development/common.md#meaningful-documentation

Defines the interpolation speed and distinguishes tempo-adjusted period from duty.

## @evidence contracts/development/implementation.md#principled-implementation

The requested finite speed and height select a closed bracket. The final period and spread must be representable. Duty uses the pre-tempo period and row-level hind fallback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Traverses the ordered rows to one bracket, then interpolates its fields directly.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.BEATS

## @evidence contracts/development/common.md#meaningful-documentation

Gives the one- and two-cycle carriage values and their gait names.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IElevation.fore

## @evidence contracts/development/common.md#meaningful-documentation

Names the fore cannon landmarks defining both endpoints.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IElevation.hind

## @evidence contracts/development/common.md#meaningful-documentation

Names the hind cannon landmarks defining both endpoints.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IGait.bob

## @evidence contracts/development/common.md#meaningful-documentation

Defines the withers-relative amplitude of trunk movement.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IGait.change

## @evidence contracts/development/common.md#meaningful-documentation

Names the preceding-gait relationship and the two cases without a rule.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IGait.elevation

## @evidence contracts/development/common.md#meaningful-documentation

Identifies landmark swing targets as the replacement for relative clearance.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IGait.fold

## @evidence contracts/development/common.md#meaningful-documentation

Names the two distal joint commands and their units.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IGait.lift

## @evidence contracts/development/common.md#meaningful-documentation

Defines the per-pair mid-swing clearance relative to withers height.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IGait.nod

## @evidence contracts/development/common.md#meaningful-documentation

Names the three existing pitch timing modes and the range unit.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IGait.phases

## @evidence contracts/development/common.md#meaningful-documentation

Defines left-fore phase origin, normalized range and original lead.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IGait.rows

## @evidence contracts/development/common.md#meaningful-documentation

States the ordering and meaning of a one-point clock.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IRow.deviation

## @evidence contracts/development/common.md#meaningful-documentation

Names the period spread in seconds and deterministic zero.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IRow.hindStance

## @evidence contracts/development/common.md#meaningful-documentation

States the optional per-row hind duration and fore fallback.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IRow.speed

## @evidence contracts/development/common.md#meaningful-documentation

Defines the clock query coordinate in metres per second.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IRow.stance

## @evidence contracts/development/common.md#meaningful-documentation

Defines the measured or authored fore contact time in seconds.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IRow.stride

## @evidence contracts/development/common.md#meaningful-documentation

Defines the complete repeating stride period in seconds.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IStride.gait

## @evidence contracts/development/common.md#meaningful-documentation

Identifies which catalogue clock is read.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IStride.lead

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the lead used by the phase permutation.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITable.collected

## @evidence contracts/development/common.md#meaningful-documentation

Explains parent mapping and faster-course handling by the ride clock.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITable.explicit

## @evidence contracts/development/common.md#meaningful-documentation

Identifies gaits requiring a named request.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITable.follow

## @evidence contracts/development/common.md#meaningful-documentation

Defines fore and hind travel shares used in top-joint placement.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITable.gaits

## @evidence contracts/development/common.md#meaningful-documentation

Relates each supplied definition to an automatic or explicit gait.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITable.hysteresis

## @evidence contracts/development/common.md#meaningful-documentation

Names the speed offset and reference-height unit.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITable.order

## @evidence contracts/development/common.md#meaningful-documentation

States that ordering compares minima, allowing overlap.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITable.reference

## @evidence contracts/development/common.md#meaningful-documentation

Names the height reference and its absolute-table use.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITable.scaling

## @evidence contracts/development/common.md#meaningful-documentation

States the absolute choice and result of leaving it unset.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITiming.deviation

## @evidence contracts/development/common.md#meaningful-documentation

Defines the returned scaled period spread.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITiming.duty

## @evidence contracts/development/common.md#meaningful-documentation

Names the fore ratio and the period before tempo modulation.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITiming.hindDuty

## @evidence contracts/development/common.md#meaningful-documentation

Identifies when the separate hind ratio is emitted and the fallback.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITiming.stride

## @evidence contracts/development/common.md#meaningful-documentation

Names the returned period and both adjustments.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.LEADED

## @evidence contracts/development/common.md#meaningful-documentation

Identifies exactly the two gaits for which right lead mirrors phase.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ClockSource

## @evidence contracts/development/common.md#meaningful-documentation

States which source records the low-level queries consume.

## @evidence contracts/development/design.md#principled-representation

A species name identifies refusals, and its admitted table supplies timing and phases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

No model or ride-planning fields are needed for the clock lookups.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.Gait

## @evidence contracts/development/common.md#meaningful-documentation

Describes the closed clock vocabulary and species-specific support.

## @evidence contracts/development/design.md#principled-representation

The same gait labels index rows, phase offsets and selection rules.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shares one vocabulary with table, clock and ride selection.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IElevation

## @evidence contracts/development/common.md#meaningful-documentation

Locates the swing targets on the supporting limbs.

## @evidence contracts/development/design.md#principled-representation

Each normalized value is interpreted along its own supporting cannon.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One share per limb pair specifies both vertical targets.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IGait

## @evidence contracts/development/common.md#meaningful-documentation

Names the clock, touchdown, transition and pose data of one gait.

## @evidence contracts/development/design.md#principled-representation

A gait owns its row timing and phase arrangement, with separate pose inputs for its ride.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This definition carries the fields the clock, selector and ride actually share.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IRow

## @evidence contracts/development/common.md#meaningful-documentation

Defines one clock point and recorded input provenance.

## @evidence contracts/development/design.md#principled-representation

Period, spread and time in stance share the speed coordinate in the same row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One optional hind value preserves compact common-contact tables.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.IStride

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the gait and lead used to read a single stride.

## @evidence contracts/development/design.md#principled-representation

The gait identifies stored phases, and lead selects the mirror when the gait has two leads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A pair of names is enough to distinguish the relevant clock and geometry order.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITable

## @evidence contracts/development/common.md#meaningful-documentation

Explains how a species declares automatic and named gaits and clock settings.

## @evidence contracts/development/design.md#principled-representation

One table ties both gait lists to their definitions, height scaling, transitions and support follow.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses a single gait definition for clock sampling, admission and ride planning.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.ITiming

## @evidence contracts/development/common.md#meaningful-documentation

Names period, spread and planted fractions at a sampled speed.

## @evidence contracts/development/design.md#principled-representation

The period and spread retain seconds while fore and optional hind duty remain dimensionless.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One optional field carries independent hind support when the bracket provides it.

# src/animals/AutoMovieArchetypeQuadrupedGait.ts#AutoMovieArchetypeQuadrupedGait.Lead

## @evidence contracts/development/common.md#meaningful-documentation

Names the two supported sides.

## @evidence contracts/development/design.md#principled-representation

A side determines whether the original leaded offsets are read or swapped.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed pair covers the two mirrored arrangements.
