# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IClock

## @evidence contracts/development/common.md#meaningful-documentation

Every member names its SI unit, positivity or ordering constraint and explicitly authored origin; shorter stances leave a positive swing.

## @evidence contracts/development/design.md#principled-representation

Speed, complete stride period and separate fore/hind stance durations are required numbers; no missing period or contact duration can be filled by a biological default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplies only the four independent authoring quantities converted by the camel/deer builders to the existing AutoMovieArchetypeQuadrupedGait.IRow contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional hind clock, implicit duty factor, encoded measurement or sentinel speed disguises missing authored timing.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.ICamel

## @evidence contracts/development/common.md#meaningful-documentation

Names the required nonempty increasing pace rows and their separation from the species' experimental walking point.

## @evidence contracts/development/design.md#principled-representation

One required array of independently authored SI clock points represents the one additional camel gait; row admission enforces nonemptiness and strict speed order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The camel builder's complete authored input; the measured walk, lateral phase construction and common gait schema remain with their owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default pace clock, relabelled horse trot or optional timing bundle substitutes for the caller's values.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IDeer

## @evidence contracts/development/common.md#meaningful-documentation

Names both phase constructions, the required-clock branches and the speed order when both gaits are supplied.

## @evidence contracts/development/design.md#principled-representation

A union requires trot, rotary gallop or both; the empty combination is excluded statically and still refused at runtime for unchecked callers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The deer builder's authored faster-gait selection imports the shared IClock and retains the measured walking point without duplicating species or solver contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No all-optional empty configuration or measured-gallop claim can be inferred from an absent clock; rotary intervals remain explicitly constructed.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.camel

## @evidence contracts/development/common.md#meaningful-documentation

Names the required authoring values, lateral construction, retained walk and absence of measured faster-gait shape claims.

## @evidence contracts/development/implementation.md#principled-implementation

Copies the measured walk and builds pace rows solely from the caller's speed, stride and separate fore/hind stance times; each side lands together at half-stride separation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One species table plus one authored gait, passed through shared admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No mean clock or speed is supplied by a default, and the construction is not called an experimental dromedary sample.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear time and retained rows in the supplied clock count; admission occurs when building, never per frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses CamelGait's walk and the shared row builder/admission; the common ride evaluates the resulting table.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns only the bounded table snapshot; no cache, model or external handle is retained.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.deer

## @evidence contracts/development/common.md#meaningful-documentation

States required clocks, optional-gait absence and the constructed diagonal or opposite-lead rotary contact order.

## @evidence contracts/development/implementation.md#principled-implementation

Adds only the caller's declared trot/gallop rows to DeerGait's observed walk; constant phase constructions express diagonal pairing or LH→RH→RF→LF rotary order without asserting measured intervals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Assemble present closed gait choices in order, then admit the complete table once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No horse transverse gallop or fabricated sika clock fills an absent authored gait.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear time and retained rows in the supplied clock count, with at most three gaits.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses DeerGait's walk, shared authored-row construction and shared table admission.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the finite table snapshot and retains no model, registry or external resource.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.admit

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted numeric domains, complete-table requirement and snapshot ownership at the ride boundary.

## @evidence contracts/development/implementation.md#principled-implementation

Validates finite positive clock values and representable reciprocal frequency, strictly increasing rows within each gait and minimum speeds between gaits, 0≤phase<1 with leftFore zero, positive stances below period and each transition's declared rule, then copies every consumed nested value. Gait maxima may overlap or nest, as the measured horse canter and gallop do.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Table header, closed gait order, per-gait pose/rows/phases and transition admission, then one result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects invalid values rather than clamping, inventing periods or mutating the source species; snapshotting needs no registry or monkeypatch.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear time and retained space in row count plus gait count; four limb phases and bounded pose fields add constant work per gait.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by both authored builders and rideQuadruped's optional-table boundary; no validation is repeated while sampling frames.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocations belong only to the returned finite table; no global state, pending work or external handle survives the call.
