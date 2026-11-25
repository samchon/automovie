# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

States that the pose and its source are values.

## @evidence contracts/development/design.md#principled-representation

The public pose and the source it was solved from, held on the preparation itself.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members: the pose readers take and the source the placements read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The source is a field of the preparation, not a side record found by identity.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.ISource

## @evidence contracts/development/common.md#meaningful-documentation

States each member and when a solve is placeable.

## @evidence contracts/development/design.md#principled-representation

The body, the authoring, its solve and whether that solve may be moved rigidly with the authoring.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, each read by a placement or an observation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Placeability is decided once, at preparation, from the reader and the authoring's domain.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.IPlaced

## @evidence contracts/development/common.md#meaningful-documentation

States the placed authoring, its source and its solve.

## @evidence contracts/development/design.md#principled-representation

A placed posture and the solve that belongs to it, so the solve travels with the posture (prepare, then read as f(t)).

## @evidence contracts/development/design.md#minimal-and-owned-surface

The posture, its source and one reader of its solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The solve is read from the source when asked, not looked up by the posture's identity.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the value semantics of the authoring and its pose.

## @evidence contracts/development/implementation.md#principled-implementation

Solves the authoring once with the owned cold source solver, or the ordinary resolver for a foreign reader.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to the one current preparation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every goal and joint of the authoring is solved; nothing is skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One solve per preparation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every later placement reads this one solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The preparation owns the authoring, its solve and the shown pose; it is released with its caller.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.continued

## @evidence contracts/development/common.md#meaningful-documentation

States the deterministic continuation seeds.

## @evidence contracts/development/implementation.md#principled-implementation

Solves the authoring once, continuing the given seeds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to the one current preparation with the continued solver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every goal and joint is solved; the seeds only start the solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

One continued solve per preparation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every later placement reads this one solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The preparation is released with its caller.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.seeds

## @evidence contracts/development/common.md#meaningful-documentation

States that only branch/swivel seeds are copied.

## @evidence contracts/development/implementation.md#principled-implementation

The solve's own per-limb seeds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The seeds are copied, never shared.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the limbs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the preparation's solve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh copy.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.source

## @evidence contracts/development/common.md#meaningful-documentation

States the observed facts and the undefined case.

## @evidence contracts/development/implementation.md#principled-implementation

The solve's joints in order and its demanded bones under the body's canonical FK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One joint pass and one FK read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unplaceable source returns undefined instead of facts of another solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the joints plus one demanded FK.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the preparation's solve; a native lent reader shares its FK dependencies.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh arrays and maps.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.IObservation

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its order and unit.

## @evidence contracts/development/design.md#principled-representation

Flat clinical values by ordered bone and the demanded bones.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, each read by the free curve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values are copied numbers, not pose records.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.bones

## @evidence contracts/development/common.md#meaningful-documentation

States the solve read and the foreign-reader case.

## @evidence contracts/development/implementation.md#principled-implementation

The placeable solve's bones under canonical FK; otherwise the authoring's ordinary cold resolution.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose choice and one FK read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A foreign reader never reads the native solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

One demanded FK.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the preparation's solve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh map.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.placed

## @evidence contracts/development/common.md#meaningful-documentation

States the centre and the placed result.

## @evidence contracts/development/implementation.md#principled-implementation

The solve's centre of mass moved to the demanded centre by translating the authoring.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One centre read and one translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The centre is read from the solve's own bones, never estimated.

## @evidence contracts/development/implementation.md#efficient-algorithms

One demanded FK and one translation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the preparation's solve and ``translated``.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh placement.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.translated

## @evidence contracts/development/common.md#meaningful-documentation

States what moves and what keeps its frame.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid translation moves the authoring's world demands and the solve's root alike.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One raw translation and one placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Attached goals keep their own frames.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the goals; the solve is moved only when read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The placed solve is the preparation's, moved.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh placement.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.turned

## @evidence contracts/development/common.md#meaningful-documentation

States the turn carried by the posture and its solve.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid turn of the posture turns its solve's root by the same turn (``turnHumanPosture``).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The posture takes the rotation; its solve reader turns the placed solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unplaceable source's posture is solved ordinarily, not turned from another solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work beyond the placed solve, when read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the placed solve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh placement.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.articulated

## @evidence contracts/development/common.md#meaningful-documentation

States what the posture keeps, what it drops and how a neutral coordinate reads.

## @evidence contracts/development/implementation.md#principled-implementation

The placed solve's clinical angles on the placed root, heading and turn: forward kinematics of these joints reproduces the solve, so a reader needs no goal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read of the placed solve and one joint pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angles are the solve's own; no goal is re-solved and none is kept for a reader to solve again.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the joints beyond the placed solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the placement's solve (``IPlaced.fit``).

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh posture.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.rigid

## @evidence contracts/development/common.md#meaningful-documentation

States the throw.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid placement of a joint-only shape (``tryRigid``).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to ``tryRigid``.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unsupported source throws instead of placing another shape.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

As ``tryRigid``.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses ``tryRigid``.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh placement.

# src/posture/HumanPosturePreparation.ts#HumanPosturePreparation.tryRigid

## @evidence contracts/development/common.md#meaningful-documentation

States the declined sources.

## @evidence contracts/development/implementation.md#principled-implementation

A joint-only shape keeps its solve under any root and heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One raw translation, the heading, one placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A source with limb goals or not placeable is declined.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work; the solve is moved only when read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The placed solve is the preparation's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh placement.
