# src/physics/PhysicalHullScalarWitness.ts#PhysicalHullScalarWitness

## @evidence contracts/development/common.md#meaningful-documentation

Defines the reached topology and private packed geometry whose continued use it tests.

## @evidence contracts/development/design.md#principled-representation

Retains authority and reached indices, with no persistent distance memo.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The actual topology and scalar query owners issue and consult the proof.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unknown hulls and borrowed typed backing decline. Current face getters and topology replacements keep ordinary reads.

# src/physics/PhysicalHullScalarWitness.ts#PhysicalHullScalarWitness.topology

## @evidence contracts/development/common.md#meaningful-documentation

Records actual native face and normal identities.

## @evidence contracts/development/implementation.md#principled-implementation

Only the allocator calls this after its known native array map.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Store one array identity and its face records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fields are frozen or replaced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in faces once per native hull.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Warm scalar queries share original topology authority.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Weak keys follow existing hull lifetime.

# src/physics/PhysicalHullScalarWitness.ts#PhysicalHullScalarWitness.prototype.read

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the actual hull, extent, reached index and normal.

## @evidence contracts/development/implementation.md#principled-implementation

Checks the actual normal against the topology receipt and the numeric owner's nonescaping backing proof.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A per-hull set retains each reached index once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A foreign topology or flat backing invalidates the witness before use.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per normal read with amortized set insertion.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated visits keep only the same reached index.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

State belongs to the requesting numerical operation.

# src/physics/PhysicalHullScalarWitness.ts#PhysicalHullScalarWitness.prototype.touched

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes a reached hull from an untouched witness.

## @evidence contracts/development/implementation.md#principled-implementation

A failed admission or a nonempty reached set both establish observation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the same two state variables owned by read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not prepare or query untouched geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

No observation state can be mistaken for known geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/physics/PhysicalHullScalarWitness.ts#PhysicalHullScalarWitness.prototype.current

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the currently verified identities and the disposition of an unproved read.

## @evidence contracts/development/implementation.md#principled-implementation

Follow each known record only after validating the own field that led to it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One descriptor comparison per edge on the reached path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not inspect or invoke getters on replacement arrays, faces or normals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of reached faces, independent of numerical probes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Stable reach returns the same pure scalar input as the original trial.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The check retains nothing.
