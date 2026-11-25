# src/animals/QuadrupedPosePlan.ts#QuadrupedPosePlan.Rotation

## @evidence contracts/development/common.md#meaningful-documentation

States the existing generic-rig degree coordinates and null-neutral convention.

## @evidence contracts/development/design.md#principled-representation

Picks the three coordinates already owned by the interface joint pose rather than declaring a second angle format.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Omits the humanoid bone field; quadruped identities are map keys.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No widened numeric type or human bone aliases bypass the rigid tree.

# src/animals/QuadrupedPosePlan.ts#QuadrupedPosePlan.Axial

## @evidence contracts/development/common.md#meaningful-documentation

Names the trunk, hindquarters, neck, head, tail and shoulder blades as the permitted carriage-goal keys.

## @evidence contracts/development/design.md#principled-representation

A closed subset of the existing bone vocabulary excludes limb goals from this map; solved limbs have their own complete point input.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Ride needs the neck's nod and the shoulder blades' turns and Rest needs the tail's carriage; whole-body placement remains the separate rigid root.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No animal kind or humanoid joint determines carriage, and a free-text goal cannot override a solved limb.

# src/animals/QuadrupedPosePlan.ts#QuadrupedPosePlan.Goal

## @evidence contracts/development/common.md#meaningful-documentation

Rotation means a finite nonzero world quaternion, normalized on admission; direction means a finite nonzero world vector whose magnitude is immaterial.

## @evidence contracts/development/design.md#principled-representation

A discriminated union allows exactly one orientation specification. Direction keeps the bar's carriage from its current parent through shortest-arc aiming; rotation specifies that carriage fully.

## @evidence contracts/development/design.md#minimal-and-owned-surface

World quaternion nods and world tail directions serve the two consumers; no angular sign table or extra pose layer is exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Contradictory optional rotation/direction fields are excluded, and unknown clinical limits are not supplied by a target.

# src/animals/QuadrupedPosePlan.ts#QuadrupedPosePlan.IState

## @evidence contracts/development/common.md#meaningful-documentation

Joint maps use degree coordinates and frames use world metres with unit scale; each evaluation owns all output records.

## @evidence contracts/development/design.md#principled-representation

One joint map and the same query's generic FK frames describe one current state, with absent joint coordinates neutral.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Root feasibility reads current frames and sampling carries the same joint/frame result into part/contact emission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No target points masquerade as achieved frames and no previous-frame state supplies the result.

# src/animals/QuadrupedPosePlan.ts#QuadrupedPosePlan.ISample

## @evidence contracts/development/common.md#meaningful-documentation

The typed archetype shares the state's instant, preserves source contact identities and owns new part geometry/transforms and contact frames.

## @evidence contracts/development/design.md#principled-representation

Extends the achieved generic state with its model rather than introducing another rig or renderer representation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Ride and Rest consume animal for drawing and frames/joints for contact/closure observations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Source Id/Dimension parameters remain intact; no renderer-only replacement or widened contact union is returned.

# src/animals/QuadrupedPosePlan.ts#QuadrupedPosePlan.Lowering

## @evidence contracts/development/common.md#meaningful-documentation

Root is an optional rigid world placement, limbs are four optional complete five-point world chains, and axial goals use the existing closed vocabulary; returned coordinates/frames are fresh.

## @evidence contracts/development/design.md#principled-representation

One callable evaluates an admitted tree from current goals alone; omitted limbs request an axial-only preview, while supplied limbs must include all four.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The implementation owner and legacy Rest adapter share this one lowering operation; full geometry/length closure belongs to the prepared model sampler.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The call owns no time history, species dispatch, anatomical limit table or implicit fallback pose.

# src/animals/QuadrupedPosePlan.ts#QuadrupedPosePlan.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

States preparation lifetime, world-root/goal inputs, complete solved chains, independent geometry/frame outputs and geometric refusal.

## @evidence contracts/development/design.md#principled-representation

Separates axial/root preview from complete model sampling while both evaluate the same admitted tree and basis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Preview, non-limb floor support and final pose emission serve the current whole-body root controller and its two consumers; no cached frame, graph mutation, renderer or body-specific option escapes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing limb, stretched source bar, relocated per-limb root, stale contact or non-rigid model cannot be accepted as a completed sample.

# src/animals/QuadrupedPosePlan.ts#QuadrupedPosePlan.IPrepared.read

## @evidence contracts/development/common.md#meaningful-documentation

States rigid world root, axial goal coordinates, neutral defaults and fresh achieved joint/frame output.

## @evidence contracts/development/implementation.md#principled-implementation

Resolve axial goals through inverse parent/neutral frames and the real axes, then use the shared generic FK reader.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegate to the one prepared lowering owner with no solved limb input.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No previous frame, root-per-limb correction, species branch or clinical angle table supplies a preview.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B+G) work and O(B+G) fresh state for bones and supplied goals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the admitted graph, neutral axes and parent ordering prepared once for this source snapshot.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each result belongs to its caller; no result cache, task or external handle is retained.

# src/animals/QuadrupedPosePlan.ts#QuadrupedPosePlan.IPrepared.bodyFloor

## @evidence contracts/development/common.md#meaningful-documentation

States complete achieved frames, metre/world convention, exact sixteen-part exclusion, included accessories/spans and refusal without a fallback bound.

## @evidence contracts/development/implementation.md#principled-implementation

Apply the same admitted current-times-inverse-neutral carrier deltas as model emission to private part transforms, relay spans from current endpoint/contact origins, and use the existing exact primitive support owner for minimum Y.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuse prepared bindings and geometry, transform non-limb parts only when there are no spans, or shallow-transform the endpoint parts/contacts required by the existing span owner before measuring the same non-limb set.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No whole temporary AutoMovieArchetype, deep geometry copy, second sample call, guessed bound, dropped tack/line or cloned rigid/span arithmetic supplies the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B+P) work without spans and O(B+P+A+S(P+A)) with the current span locator for B bones, P parts, A contacts and S spans. Temporary scalar frames/records and span-only shape records are call-local; full geometry buffers are never copied.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the prepared private source geometry, neutral frames, bindings and source span records; the same delta and exact-support owners serve every query with no completed-frame cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no supplied frame map or computed bound. Temporary transforms, contacts, delta map and span-only shape records end with the query; no model, handle or external resource is created.

# src/animals/QuadrupedPosePlan.ts#QuadrupedPosePlan.IPrepared.sample

## @evidence contracts/development/common.md#meaningful-documentation

States complete four-limb five-point world goals, rigid root, optional axial carriage, included root placement and independent output geometry/frames.

## @evidence contracts/development/implementation.md#principled-implementation

Aim each bar from its current parent carriage, lower the quaternion through its real neutral frame/basis, perform generic FK and refuse any endpoint that misses the supplied chain beyond binary64 arithmetic error.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Share lowering with read, verify complete length/root closure, then apply one rigid carrier delta to each part/contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No stretched geometry, moved support, per-limb root, partial chain, fake bone or uncarried contact substitutes for a solved sample.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B+P+A+V) work/output for bones, parts, affordances and copied geometry values; four fixed chains add constant geometric checks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Source snapshots, admitted graph, axes, lengths and bindings are retained once; current FK, geometry copies and contact frames are freshly evaluated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns each sample and prepared lifetime. No previous sample, global cache, file, process or other external handle is retained.
