# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.Window

## @evidence contracts/development/common.md#meaningful-documentation

Defines normalized start/end time and minimum-jerk interpolation within that window.

## @evidence contracts/development/design.md#principled-representation

A readonly ordered pair carries normalized endpoints; the law admits finite 0 <= start < end <= 1 at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the two endpoints consumed by the rest clock are exposed; seconds stay with the owning transition duration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No preset species timing or optional endpoint is encoded; malformed numeric ordering is explicitly left to admission.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.Rotation

## @evidence contracts/development/common.md#meaningful-documentation

States degrees, rig coordinates and null-neutral interpretation.

## @evidence contracts/development/design.md#principled-representation

Aliases the shared rig pose owner's coordinates, retaining the interface's nullable neutral convention without another joint format.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only coordinates consumed by the generic rig are included; quadruped bone identities remain the map key's existing owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No humanoid bone slot, measured ROM claim, widened value type or parallel joint declaration is introduced.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Every member states its units, model frame, timing, authored provenance or attachment ownership; foot rolling and biological limits are documented by the namespace and producer.

## @evidence contracts/development/design.md#principled-representation

Required finite durations, pitch, tail/distal carriage, normalized windows and complete carriers describe one level-floor cycle. Numeric domains and geometric feasibility are runtime-admitted rather than asserted by number types.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contains only the clock, geometry goals and bindings the rest producer consumes; the existing bone and transform owners supply their vocabularies.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All unsourced performance quantities are required authored inputs; no species preset, optional outcome combination, fixture geometry or invented clinical ROM determines an answer.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.ISample

## @evidence contracts/development/common.md#meaningful-documentation

Documents posed ownership, model-space transforms, degree joints, fixed footprints, metre clearance, support boolean and authored phase.

## @evidence contracts/development/design.md#principled-representation

One archetype, its generic joint/root coordinates and achieved support goals describe the same instant. A closed phase union excludes unnamed phases; runtime checks exclude goal misses and below-floor solids beyond binary64 roundoff.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The capture consumes the animal and composition/verification consume the clock, root and support result; no renderer object, simulated force or second bone vocabulary is exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The returned model preserves the source Id/Dimension type parameters and current contact semantics. No fixture snapshot, widened contact union or unsupported no-slip/ROM/GRF claim substitutes for it.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IClip

## @evidence contracts/development/common.md#meaningful-documentation

States seconds, exact authored support/phase events, independent time evaluation, retained plan ownership and sample refusal.

## @evidence contracts/development/design.md#principled-representation

A finite duration, four named event times and a sample-by-seconds operation represent one deterministic cycle. The producer admits time and geometry at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Captures need the duration/events and model at a requested time; no frame-rate state, stepping API, process or speculative cache member is added.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All successful times run the geometry law and return the source's typed contact vocabulary; invalid times or impossible configurations cannot select a static fallback result.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IClip.sample

## @evidence contracts/development/common.md#meaningful-documentation

States seconds, the finite time domain, independently posed output and geometry/input refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The producer evaluates one authored root clock, fixed footprint goals and exact length IK, then generic FK and primitive support checks at this time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The retained producer plan supplies scalar source data; the operation returns one complete sample without a frame-history dependency.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No last-frame state, geometry fallback, stretched bone, missed-contact clamp or unsupported clinical/dynamic claim is permitted by this operation.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(P+B+A) sample over parts, bones and affordances with four bounded analytic limb fits.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Immutable admitted source measurements and the authored plan are shared; completed frames are recomputed because the output owns current transforms.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns each output and the clip lifetime. Sampling acquires no process, file, global cache or external handle.
