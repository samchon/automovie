# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld

## @evidence contracts/development/common.md#meaningful-documentation

States the substep's phases with their formulas, the determinism and the snapshot.

## @evidence contracts/development/design.md#principled-representation

SI units, world frame, one substep per step; bodies, colliders and joints keep creation order and integer handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the engine's physical simulation, which binds, tracks, reads and checkpoints it; the members are what those owners use.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every coefficient is an input: gravity, substep, allowed contact error and contact frequency.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.prototype.createBody

## @evidence contracts/development/common.md#meaningful-documentation

States the handle, order, default gravity scale, unset mass and ownership.

## @evidence contracts/development/implementation.md#principled-implementation

One handle counter for bodies, colliders and joints keeps handles unique in the world, and creation order is the order every step loop follows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Constructs the body and appends it; mass properties are the caller's to set.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Amortised constant work: one append.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call creates a distinct body.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The world holds the body for its own lifetime and has no removal; the body population grows by one per call.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.prototype.createCollider

## @evidence contracts/development/common.md#meaningful-documentation

States the handle, order, the shape's frame and that it is held, and ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The shared handle counter keeps handles unique; creation order is the contact detection's pair order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Constructs the collider and appends it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case; the material is stored as given.

## @evidence contracts/development/implementation.md#efficient-algorithms

Amortised constant work plus the collider's local box, linear in a hull's points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call creates a distinct collider.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The world holds the collider for its own lifetime and has no removal; the collider population grows by one per call.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.prototype.createJoint

## @evidence contracts/development/common.md#meaningful-documentation

States the handle, order, the collision exclusion, that the joint record is held, and ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The shared handle counter keeps handles unique; step reads the joint list to exclude joined pairs from contact detection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Constructs the joint and appends it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Amortised constant work: one append.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call creates a distinct joint.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The world holds the joint for its own lifetime and has no removal; the joint population grows by one per call.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.prototype.step

## @evidence contracts/development/common.md#meaningful-documentation

States the phases in order, the single passes, the pair exclusions and what the step keeps.

## @evidence contracts/development/implementation.md#principled-implementation

The substep of Mueller et al. 2020, Algorithm 2: predict, solve positions, derive velocities, solve velocities; the inverse inertia is held fixed over the substep's corrections. The joints' position pass solves each tree directly (`solveXpbdJointTree`) and the contacts' corrections move jointed bodies through their trees (`solveXpbdArticulation.responder`), both on the kept forest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Orders the phases; integration and derivation belong to AutoMovieXpbdIntegration, contacts to solveXpbdContacts and joints and motors to solveXpbdJoints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every coefficient is a world setting; no body, pair or scene has its own rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

For b bodies, j joints, c colliders and k found contacts, integration is O(b), the joined-pair set O(j), detection is solveXpbdContacts.detect's cost over c colliders, and the position and velocity passes are O(j + k).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The contacts found at the predicted poses serve every position and velocity pass of the substep and the readers after it; the forest is the world's, built once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Replaces the retained contact list each step; the joined-pair set and dynamic list are released at return.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.prototype.manifolds

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned and its reader.

## @evidence contracts/development/implementation.md#principled-implementation

The retained contacts and the substep are all the manifolds need.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to readXpbdManifolds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the step's contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built on demand from the retained contacts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records; retains nothing.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.prototype.intersections

## @evidence contracts/development/common.md#meaningful-documentation

States which overlaps are reported and their order.

## @evidence contracts/development/implementation.md#principled-implementation

A sensor takes part in no response, so its contacts are overlaps that the compliant layers measure themselves.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter and one map over the retained contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the step's contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built on demand from the retained contacts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records; retains nothing.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.prototype.takeSnapshot

## @evidence contracts/development/common.md#meaningful-documentation

States the encoding, the contents, the order and the negative-zero marking.

## @evidence contracts/development/implementation.md#principled-implementation

JSON writes every finite float64 so that parsing returns the same value, and the replacer keeps the one value it loses, negative zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The state's layout belongs to AutoMovieXpbdSnapshot.write; this method encodes it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No finite value is rounded or dropped; a non-finite value would become null, which JSON cannot avoid.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bodies, colliders, joints, hull points and contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each snapshot is of a different moment.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns bytes the caller owns; retains nothing.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.restoreSnapshot

## @evidence contracts/development/common.md#meaningful-documentation

States what is restored and the expected input.

## @evidence contracts/development/implementation.md#principled-implementation

Parses with the reviver that undoes the snapshot's negative-zero marker, then assigns every recorded value back, so the world continues bit for bit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Decodes here; the state's layout belongs to AutoMovieXpbdSnapshot.read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is recomputed; malformed bytes throw from the parser.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the snapshot's size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each restore builds its own objects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a world the caller owns; retains nothing.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.prototype.lastContacts

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned, that it is shared and read-only, and its snapshot reader.

## @evidence contracts/development/implementation.md#principled-implementation

Exposes the retained contacts so the snapshot records the state the next readers would see.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work; no copy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the step's own list until the next step replaces it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing new; the list lives until the next step or adoption.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.prototype.adoptContacts

## @evidence contracts/development/common.md#meaningful-documentation

States the effect, its lifetime and the input's premise and ownership.

## @evidence contracts/development/implementation.md#principled-implementation

A restored world reports the same last step as the world it was taken from.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field write; the snapshot rebuilds the records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the list until the next step replaces it.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.prototype.resume

## @evidence contracts/development/common.md#meaningful-documentation

States the effect and the value expected.

## @evidence contracts/development/implementation.md#principled-implementation

Handles stay unique when numbering continues past every restored handle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field write; the snapshot records the value.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one number.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.IRootTask

## @evidence contracts/development/common.md#meaningful-documentation

States what the record asks and of whom.

## @evidence contracts/development/design.md#principled-representation

A world force in newtons and a moment in newton metres about a world origin in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Set by trackPhysicalRoot under internal actuation and read by solveXpbdArticulationContacts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The wrench is the root controller's own demand; nothing is allocated before the solve.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.IManifold

## @evidence contracts/development/common.md#meaningful-documentation

States the pair, its normal, friction and points.

## @evidence contracts/development/design.md#principled-representation

Colliders, a unit normal, a dimensionless coefficient and points in world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the simulation's contact receipts and supports.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One record per pair; the points hold their own values.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.IManifoldPoint

## @evidence contracts/development/common.md#meaningful-documentation

States the witness midpoint, separation and impulse.

## @evidence contracts/development/design.md#principled-representation

World metres and newton seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read with its manifold.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Separation and impulse are the step's own values, not estimates.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.IIntersection

## @evidence contracts/development/common.md#meaningful-documentation

States the overlapping pair.

## @evidence contracts/development/design.md#principled-representation

The two colliders.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the compliant contacts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No measurement is attached; the reader measures what it needs.

# src/physics/AutoMovieXpbdWorld.ts#AutoMovieXpbdWorld.prototype.forest

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned and when it is rebuilt.

## @evidence contracts/development/implementation.md#principled-implementation

The forest depends only on the joints and the bodies' `dynamic` (`solveXpbdArticulation.forest`), so it is built on first use and again only after `createJoint` or a body's `setDynamic` changes it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One kept field, cleared by the two changes that stale it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No staleness test per step: the two changes clear it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant per read; one build per change.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every pass of every step reads the one forest.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one forest for the world's life, replaced on a change.