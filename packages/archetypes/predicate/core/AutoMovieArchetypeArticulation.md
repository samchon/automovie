# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Lists the engine's supported joints whose travel can move attached model data.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IPosed

## @evidence contracts/development/common.md#meaningful-documentation

The type identifies rest or posed parts and affordances in the model's own frame.

## @evidence contracts/development/design.md#principled-representation

Both collections preserve the existing model record types. Preparation uses the affordance records by ID and reads each declared part owner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The projection needs the two collections without the rest of a model's metadata.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IPosed.parts

## @evidence contracts/development/common.md#meaningful-documentation

Stores the parts and their optional model-local transforms.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IPosed.affordances

## @evidence contracts/development/common.md#meaningful-documentation

Stores named contacts and their model-local frames, including carrier and drive relationships.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Adds the actual travel of every admitted articulation to the posed parts and contacts.

## @evidence contracts/development/design.md#principled-representation

Travel lookup records leaders and their resolved followers at the same state. Omitted independent drives resolve to zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result keeps geometry and contact records in the established model types and adds only the state explanation.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IResult.travels

## @evidence contracts/development/common.md#meaningful-documentation

Keys actual travel by articulation ID. Leader, default and linked values share the kind's coordinate and unit.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.range

## @evidence contracts/development/common.md#meaningful-documentation

Documents degrees or metres through the joint kind, the relevant reverse limits and null open ends.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates range resolution to the Engine owner that validates the same affordance records. A wheel's sided travel, reverse sliders and other joint types use that shared admission policy.

## @evidence contracts/development/implementation.md#efficient-algorithms

One call resolves two bounds. There is no geometry traversal or retained state.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.motion

## @evidence contracts/development/common.md#meaningful-documentation

Documents rest in model space, degrees for turning joints, metres for linear joints and a caller-owned result.

## @evidence contracts/development/implementation.md#principled-implementation

Turn axes come from the rest frame. Linear affordances shift along their own signed axis. A stationary contact receives the identity. Each result owns its vectors, so mutating a returned value leaves the next motion unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

One branch selects the joint's operation. Each returns constant-sized geometry and the function retains no result.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.pose

## @evidence contracts/development/common.md#meaningful-documentation

Documents leader and reversible-follower input, default rest, reused static parts and invalid states.

## @evidence contracts/development/implementation.md#principled-implementation

Preparation first admits the linked travel graph. The same resolved motion moves every carried affordance and part, keeping its frame registered to the model. An uninfluenced part retains its record.

## @evidence contracts/development/implementation.md#efficient-algorithms

A preparation indexes contacts before one projection. The method walks contacts and parts once and builds coordinate records for moved outputs. Intermediate maps last for this pose call.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.travels

## @evidence contracts/development/common.md#meaningful-documentation

Documents absolute authored entries and omission of undefined keys.

## @evidence contracts/development/implementation.md#principled-implementation

Copies defined entries so the state resolver handles admission separately. A deliberate zero is a supplied absolute travel.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal of the input entries populates a call-owned map proportional to the number of supplied values.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IProjection

## @evidence contracts/development/common.md#meaningful-documentation

The type distinguishes actual travels, a model-space motion and an optional resolved frame.

## @evidence contracts/development/design.md#principled-representation

An admitted state owns the travel map and keyed motion evaluation. Frame lookup reports absence for an unknown contact. Motion reads expose copies of that state's data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Callers can resolve a single contact without materializing the full model. The travel record supplies the context for the read.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IProjection.travels

## @evidence contracts/development/common.md#meaningful-documentation

The read-only map reports each admitted leader and follower value by contact ID.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IProjection.motion

## @evidence contracts/development/common.md#meaningful-documentation

Returns an owned motion for an indexed rest contact in model space. Mutating that result leaves cached placement intact.

## @evidence contracts/development/implementation.md#principled-implementation

The prepared projection evaluates the contact in the admitted carrier and travel state. Its public reader copies both cached vectors before returning, preserving the same model-space motion for later queries.

## @evidence contracts/development/implementation.md#efficient-algorithms

The state computes one motion per needed contact. Each public read copies the two fixed-size vector records and keeps the motion computation cached for later reads.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.IProjection.frame

## @evidence contracts/development/common.md#meaningful-documentation

Evaluates and returns the chosen model-space frame or undefined for an absent ID.

## @evidence contracts/development/implementation.md#principled-implementation

Looks up the indexed rest contact and applies its cached model-space motion to the rest frame. An unknown ID yields no frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

The reader uses a keyed lookup and the existing demand-driven motion map. A successful read applies one rigid move to create its returned frame.

# src/core/AutoMovieArchetypeArticulation.ts#AutoMovieArchetypeArticulation.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Documents fixed rest input during reuse, per-state validation, default rest and caller ownership of motion and frame reads.

## @evidence contracts/development/implementation.md#principled-implementation

Indexes named contacts and material carriers once. Each submitted state resolves the coupled travel graph before applying the separate spatial carrier chain. This preserves shared drives, local rotations and pedal orientation. Exposed motion reads copy the cached value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation retains indexes bounded by rest contact and attached-part count. Each projection holds its own travel and demand-driven motion maps, with at most one memoized motion per indexed ID. Frame queries use the memo directly. A public motion read copies two vectors.
