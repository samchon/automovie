# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder

## @evidence contracts/development/common.md#meaningful-documentation

States what a producer writes with it, the coarseness rule it serves and what `build` derives.

## @evidence contracts/development/design.md#principled-representation

Code CAD over named dimensions and formula-defined primitives or convex cells. One recorded cell supplies visible and physical boundaries; producer-authored corner formulas own the wall profile.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Existing primitive, span, contact and build calls remain unchanged. Armour uses convex to express hollow walls that filled primitives cannot represent; recording/material ownership is shared with existing parts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No call knows a kind of object; a repeated part id is a producer's defect and throws at once.

# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder.prototype.box

## @evidence contracts/development/common.md#meaningful-documentation

States each input's unit and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's box primitive at the stated centre and rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of the shared part recorder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A repeated id throws; nothing is renamed.

## @evidence contracts/development/implementation.md#efficient-algorithms

A scan of the parts so far for the id, tens at most.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Records one independent part or contact per call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The builder keeps what it records until `build` hands it to the archetype.

# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder.prototype.rod

## @evidence contracts/development/common.md#meaningful-documentation

States each input's unit and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

A cylinder or capsule whose axis, the primitive's `+Y`, is turned onto the line between the two ends by the shortest rotation and centred between them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Span, then one call of the shared part recorder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Two coincident ends give a bar of no length, which the model validator refuses; nothing is guessed here.

## @evidence contracts/development/implementation.md#efficient-algorithms

A scan of the parts so far for the id, tens at most.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Records one independent part or contact per call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The builder keeps what it records until `build` hands it to the archetype.

# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder.prototype.ball

## @evidence contracts/development/common.md#meaningful-documentation

States each input's unit and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's sphere primitive at the stated centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of the shared part recorder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A repeated id throws; nothing is renamed.

## @evidence contracts/development/implementation.md#efficient-algorithms

A scan of the parts so far for the id, tens at most.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Records one independent part or contact per call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The builder keeps what it records until `build` hands it to the archetype.

# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder.prototype.convex

## @evidence contracts/development/common.md#meaningful-documentation

Defines the copied local point set, rigid placement and cell premise.

## @evidence contracts/development/implementation.md#principled-implementation

AutoMovieArchetypeConvexCell derives the visible polyhedron, hull collider and local integrated mass from one explicit convex volume. An already admitted immutable cell can be reused for exactly rigid-equivalent instances, with each part's own transform. Hollow forms use separate wall cells.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Use a prepared cell or derive it from copied corners, record its exact mesh through the common part owner, then retain its physical correspondence by id.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No whole-shell hull or hidden solid fills a cavity, and no arbitrary mesh is guessed convex.

## @evidence contracts/development/implementation.md#efficient-algorithms

Raw corners require one small V-corner hull preparation. A prepared cell reuses all geometry and integration in constant time; every added part still scans P existing ids. Both build reductions reuse the prepared mass record.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One admitted cell serves rendering, mass, collision and subsequent rigid poses; optical material recording is shared with primitives.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Raw corners are copied into owned cell buffers; a supplied immutable prepared cell is explicitly shared. The builder retains cells until build hands them to the archetype. No caller raw-point array or external resource is retained.

# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder.prototype.visualMesh

## @evidence contracts/development/common.md#meaningful-documentation

States placement, optional inputs and buffer ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Records a mesh through the common part inventory without declaring a primitive or convex cell, so mass and shape reductions omit it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One inventory call using the mesh unchanged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither assigns mass options nor implies that the mesh is a collider.

## @evidence contracts/development/implementation.md#efficient-algorithms

The shared inventory scans the existing part ids; the vertex buffers are neither scanned nor copied.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same placement, material and id recording as primitives.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Buffers pass through the inventory to the built model without external resources.

# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder.prototype.span

## @evidence contracts/development/common.md#meaningful-documentation

States each input's unit, what an end may name and when, and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

Shared span state resolves both rest anchors and any held extension before recording the cylinder, so rest mass uses its full drawn length. The archetype resolves the same declaration after each pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Locate, record the rod, record the span.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An end must already exist, so the rest line is the one every pose lays; coincident ends are refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

A scan of the parts and affordances so far, tens at most.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses rod construction and the same state operation used by posed lines and grip frames.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The builder keeps what it records until `build` hands it to the archetype.

# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder.prototype.anchor

## @evidence contracts/development/common.md#meaningful-documentation

Converts model metres to the named carrier's local span coordinates.

## @evidence contracts/development/implementation.md#principled-implementation

Delegate rigid-frame inversion to the shared span-anchor owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call, without recording an extra part or contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No reconstructed carrier frame or hidden world anchor is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owner performs one O(P) part lookup and constant rigid arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the already-built frame and the common anchor conversion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new local endpoint without retaining a query or external handle.

# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder.prototype.affordance

## @evidence contracts/development/common.md#meaningful-documentation

States each input's unit and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The record is kept as written; its id is checked against the producer's closed id type by the compiler.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One push.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is validated here: `validateModel` admits the built archetype's affordances, as the contract test runs for every producer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Records one independent part or contact per call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The builder keeps what it records until `build` hands it to the archetype.

# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder.prototype.fracture

## @evidence contracts/development/common.md#meaningful-documentation

States what a set is, where the threshold goes and the failures.

## @evidence contracts/development/implementation.md#principled-implementation

Each set's id is unique and its parts exist, at least one, each named once across the sets, so every part is in at most one fragment and the remainder is the rest; each contact a set carries is declared and carried by one set only.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One check per part, then the record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A repeated id, an empty set, or an unknown or shared part or contact throws rather than being dropped.

## @evidence contracts/development/implementation.md#efficient-algorithms

A scan of the parts per named part, tens at most.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Records once per producer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The builder keeps the sets until `build` hands them to the archetype.

# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder.prototype.build

## @evidence contracts/development/common.md#meaningful-documentation

States each input's unit and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

Admits the producer's physical material and only an explicit authored restitution through AutoMovieArchetypeMaterial, selects cited resting-pair friction, and computes mass properties from the recorded parts under the stated mass. Published restitution measurements retain pair, speed and specimen conditions separately.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Material and contact admission precede one construction from the builder's recorded geometry and mass properties.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing material is refused. Unmeasured restitution and undeclared resting friction remain absent; neither becomes zero or a universal coefficient. The mass remains the producer's cited value rather than a guessed density-derived total.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the parts, through `AutoMovieArchetypeMass.of`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Aggregate and per-part mass reductions share admitted cell integration records and the same local-solid/weight owners; geometry and material records pass directly to the built archetype.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The builder keeps what it records until `build` hands it to the archetype.

# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Preserves the public builder-input name and delegates fields and units to the shared type owner.

## @evidence contracts/development/design.md#principled-representation

Aliases the unchanged producer identity, typed dimension provenance and physical reference material record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Existing constructors and producer helpers keep their established import and generic dimension parameter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Introduces no parallel fields or broader name/coefficient representation.

# src/core/AutoMovieArchetypeBuilder.ts#AutoMovieArchetypeBuilder.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

Delegates optical colour, mass, rigid placement and physical surface meanings to the shared type owner.

## @evidence contracts/development/design.md#principled-representation

Aliases the same part-option record and existing geometry/material types.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Existing box, rod and ball callers retain their current option type while its fields have one owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Adds no producer-specific option or duplicate physical coefficient.
