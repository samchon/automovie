# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IIncidenceGroup

## @evidence contracts/development/common.md#meaningful-documentation

The record identifies both sides of a saved interval by loop ordinal and documents the support flag and optional explanation.

## @evidence contracts/development/design.md#principled-representation

The loft planner groups incoming and outgoing loop ordinals before deciding which bands it can emit. An unsupported group stays in the unresolved output.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two ordinal lists refer to existing section loops. Support belongs to the incidence producer, while the loft consumer owns tessellation and representation of its local gap.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IIncidenceGroup.before

## @evidence contracts/development/common.md#meaningful-documentation

Selects zero-based loops from the saved lower section. The contour planner reads this side of the incidence.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IIncidenceGroup.after

## @evidence contracts/development/common.md#meaningful-documentation

Selects the matching zero-based loop ordinals from the upper section.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IIncidenceGroup.supported

## @evidence contracts/development/common.md#meaningful-documentation

Carries the producer's explicit continuation decision. The loft preserves gaps for unsupported groups.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IIncidenceGroup.reason

## @evidence contracts/development/common.md#meaningful-documentation

Carries the producer's optional explanation alongside the support flag.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.ISectionLoop

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies the complete cubic field, its millimetre chart and its winding.

## @evidence contracts/development/design.md#principled-representation

The loft consumer samples the saved cubic section curve. The winding sign comes from the section producer and gives the intended orientation in the cutting plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A section loop needs only its curve and orientation. The section owns the cut coordinate, while source address tables stay outside this contract.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.ISectionLoop.curve

## @evidence contracts/development/common.md#meaningful-documentation

Points to the complete cubic curve that the contour sampler evaluates in the declared section chart.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.ISectionLoop.winding

## @evidence contracts/development/common.md#meaningful-documentation

Identifies outer or cavity orientation using the sign supplied by the section producer.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IPrimitiveRange

## @evidence contracts/development/common.md#meaningful-documentation

The declaration distinguishes output triangle ordinals, millimetre cut coordinates, group ownership and event attribution.

## @evidence contracts/development/design.md#principled-representation

The loft emitter records its output triangle count before writing a retained group and appends the number of emitted tiles. It publishes the original adjacent cuts, group ordinal and attributed event names.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The range connects retained triangles with their generating interval and group. Its ordinals address the separately returned triangle stream.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IPrimitiveRange.firstTriangle

## @evidence contracts/development/common.md#meaningful-documentation

Records the emitted mesh triangle ordinal before this group, measured in triples of scalar indices.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IPrimitiveRange.triangleCount

## @evidence contracts/development/common.md#meaningful-documentation

Counts the consecutive retained tiles emitted for this group.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IPrimitiveRange.beforeMm

## @evidence contracts/development/common.md#meaningful-documentation

Records the millimetre cut at the lower saved section of the emitted group.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IPrimitiveRange.afterMm

## @evidence contracts/development/common.md#meaningful-documentation

Records the millimetre cut at the upper saved section of the emitted group.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IPrimitiveRange.group

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the zero-based incidence group in the interval's plan.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IPrimitiveRange.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies a strip for a group with boundaries on both sides or its declared terminal cap.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IPrimitiveRange.eventNames

## @evidence contracts/development/common.md#meaningful-documentation

Carries the names of the declared critical events assigned to these triangles.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInteractionObservation

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names one side and pass, the observed refinement and tests, the status, and its optional elapsed milliseconds.

## @evidence contracts/development/design.md#principled-representation

Contour-boundary preparation appends observations for the actual pass under its cut interval and incidence group. It counts work actually visited and records whether that pass qualified, while diagnostics can document earlier attempts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record exposes scope, measured work and pass judgment. The search queues, geometry and elapsed measurement remain owned by the boundary implementation.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInteractionObservation.beforeMm

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the lower millimetre cut of the interval for this pass.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInteractionObservation.afterMm

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the upper millimetre cut of the interval for this pass.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInteractionObservation.group

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the zero-based group whose boundary leaves were checked.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInteractionObservation.pass

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the producer's pass ordinal within that contact-driven refinement.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInteractionObservation.side

## @evidence contracts/development/common.md#meaningful-documentation

Identifies which saved section supplied the sampled leaves for this pass.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInteractionObservation.qualified

## @evidence contracts/development/common.md#meaningful-documentation

Carries the observed result of this interaction pass independently of previous messages.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInteractionObservation.refinements

## @evidence contracts/development/common.md#meaningful-documentation

Counts actual source-leaf splits performed during the pass.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInteractionObservation.chordPairs

## @evidence contracts/development/common.md#meaningful-documentation

Counts chord pairs visited during this pass.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInteractionObservation.exactOrientationTests

## @evidence contracts/development/common.md#meaningful-documentation

Counts executed exact orientation predicates during qualification.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInteractionObservation.elapsedMs

## @evidence contracts/development/common.md#meaningful-documentation

Carries measured milliseconds only when the caller opts into work observation.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInteractionObservation.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

Carries the ordered messages generated by this localized interaction pass.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IStripObservation

## @evidence contracts/development/common.md#meaningful-documentation

The declaration gives strip scope, the sizes of the two walks, search work, optional timing and its own observed qualification.

## @evidence contracts/development/design.md#principled-representation

The loft emitter combines the strip solver's work record with interaction qualification and local geometry findings. The observation retains the proposed group's original cut interval and ordinal independently of its retained face count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The reported quantities let callers distinguish search work from structural qualification. The solver's private DP state and its branch queue stay outside the record.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IStripObservation.beforeMm

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the millimetre cut on the lower side of this strip group.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IStripObservation.afterMm

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the millimetre cut on the upper side of this strip group.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IStripObservation.group

## @evidence contracts/development/common.md#meaningful-documentation

Names the ordinal of the group's plan within its interval.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IStripObservation.n

## @evidence contracts/development/common.md#meaningful-documentation

Counts the first oriented walk's nodes after slit expansion, including repeated sheet occurrences.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IStripObservation.m

## @evidence contracts/development/common.md#meaningful-documentation

Counts the second input walk under the same expanded walk convention.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IStripObservation.dpCalls

## @evidence contracts/development/common.md#meaningful-documentation

Counts actual four-state solves, including attempts with no feasible result.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IStripObservation.expandedConflicts

## @evidence contracts/development/common.md#meaningful-documentation

Counts popped candidates that generated alternative branches after a qualification conflict.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IStripObservation.peakQueue

## @evidence contracts/development/common.md#meaningful-documentation

Records the maximum count of queued feasible candidates during the search.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IStripObservation.elapsedMs

## @evidence contracts/development/common.md#meaningful-documentation

Carries the measured duration of the strip work when observation is enabled.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IStripObservation.qualified

## @evidence contracts/development/common.md#meaningful-documentation

Records the topology and orientation judgment for the emitted candidate and its interaction evidence.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IStripObservation.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

Carries the solver and interaction messages, including unresolved local qualifications.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IConstructionBoundary

## @evidence contracts/development/common.md#meaningful-documentation

The declaration describes the producer identity, closed boundary flag, world-metre sample points and original curve phases.

## @evidence contracts/development/design.md#principled-representation

The contour result collects evaluated boundary points under the source-free construction identity. Its phases follow sample order, which can reverse under winding changes. Closed describes the sampled section loop.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The construction supplies the boundary line used to inspect the generator. The mesh and its completion remain separate outputs, with no source mesh index embedded in this line.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IConstructionBoundary.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the evaluated construction boundary with a producer-owned identity.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IConstructionBoundary.closed

## @evidence contracts/development/common.md#meaningful-documentation

Records that this construction line is a closed evaluated boundary.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IConstructionBoundary.points

## @evidence contracts/development/common.md#meaningful-documentation

Carries ordered world-metre boundary samples including separate sheet occurrences.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IConstructionBoundary.phases

## @evidence contracts/development/common.md#meaningful-documentation

Carries generating curve parameters aligned with those samples, with reversal and phase gaps allowed.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IUnresolvedRelationship

## @evidence contracts/development/common.md#meaningful-documentation

The declaration gives the millimetre cut interval, incident contour counts and reason for its unresolved generation.

## @evidence contracts/development/design.md#principled-representation

The loft emitter appends a record for a group that remains unresolved. It takes the side counts from the group's incoming and outgoing loops and preserves an unsupported or arithmetic reason.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This result lets callers inspect a missing relationship separately from the retained mesh. It includes only the affected interval and its group-level counts and explanation.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IUnresolvedRelationship.beforeMm

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the lower millimetre cut that bounds the unresolved group.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IUnresolvedRelationship.afterMm

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the upper millimetre cut that bounds the unresolved group.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IUnresolvedRelationship.incoming

## @evidence contracts/development/common.md#meaningful-documentation

Counts the incident contours on the lower side of the group.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IUnresolvedRelationship.outgoing

## @evidence contracts/development/common.md#meaningful-documentation

Counts the incident contours on the upper side of the group.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IUnresolvedRelationship.reason

## @evidence contracts/development/common.md#meaningful-documentation

Carries the unsupported relationship or generation explanation supplied for this gap.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInterval.groups

## @evidence contracts/development/common.md#meaningful-documentation

Documents the complete saved group partition across the cut interval. The loft uses these groups for explicit continuation.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.ISection.loops

## @evidence contracts/development/common.md#meaningful-documentation

Documents each section's generating oriented cubic loops in the shared chart.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IResult.primitiveRanges

## @evidence contracts/development/common.md#meaningful-documentation

Connects consecutive retained output triangles to their generating interval, group and named critical events.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IResult.interactionObservations

## @evidence contracts/development/common.md#meaningful-documentation

Carries optional recorded interaction passes and their actual refinement and geometry checks.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IResult.stripObservations

## @evidence contracts/development/common.md#meaningful-documentation

Carries optional strip search work and qualification for the groups that produce observations.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IResult.construction

## @evidence contracts/development/common.md#meaningful-documentation

Publishes evaluated world-metre section boundaries alongside the mesh.

# src/geometry/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IResult.unresolved

## @evidence contracts/development/common.md#meaningful-documentation

Carries local relationship gaps, incident counts and explanations while retaining unaffected output.
