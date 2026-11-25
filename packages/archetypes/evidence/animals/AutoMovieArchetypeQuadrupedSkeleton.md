# src/animals/AutoMovieArchetypeQuadrupedSkeleton.ts#AutoMovieArchetypeQuadrupedSkeleton.of

## @evidence contracts/development/common.md#meaningful-documentation

States model-part ownership, neutral parent frames, units and unknown anatomical limits.

## @evidence contracts/development/implementation.md#principled-implementation

Each bar's upper endpoint defines the joint origin and its rotation defines the local frame; inverse rigid composition expresses that joint relative to its parent. Thus articulation turns about the shared bar endpoint instead of the mesh centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Index parts, enumerate the closed hierarchy, and convert each current frame to one local rest frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No proportion table rebuilds a different animal, no humanoid slot or species branch is used, and unknown limits are null rather than copied human or horse measurements.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P+B) indexing and rigid conversions for P parts and B bones, with O(P+B) temporary/output storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each part is indexed once and every conversion uses the shared quaternion/vector owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned scalar transforms and axes are independent copies and retain no model, geometry array or resource handle.

# src/animals/AutoMovieArchetypeQuadrupedSkeleton.ts#AutoMovieArchetypeQuadrupedSkeleton.pose

## @evidence contracts/development/common.md#meaningful-documentation

States local degree input, explicit accessory/contact ownership, optional root placement and independent posed output.

## @evidence contracts/development/implementation.md#principled-implementation

Shared generic FK resolves the named tree; each accessory and contact receives newCarrier times inverseOldCarrier, so its rigid coordinates relative to that carrier are invariant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the rig and resolve neutral/current frames, then delegate part/contact emission to apply, which prepared ride/Rest samplers reuse directly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every non-bone part and contact has an explicit valid carrier; no nearest-bone heuristic, species case, modified source model, dummy humanoid bone or static stale contact substitutes for the pose.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B+P+A+J+V) work for bones, parts, affordances, named input joints and independently copied geometry values; maps avoid repeated hierarchy traversal. Preparation occurs once per operation and no fitted pose cache is retained.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One admitted tree supplies both neutral/current frames and one rigid delta per bone serves every attached accessory/contact.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader is call-local; apply returns independently copied part geometry/transforms and contact frames while the producer retains ownership of immutable material/rest mass metadata.

# src/animals/AutoMovieArchetypeQuadrupedSkeleton.ts#AutoMovieArchetypeQuadrupedSkeleton.apply

## @evidence contracts/development/common.md#meaningful-documentation

States same-tree complete frame ownership, null accessory identity, explicit carriers, rigid admission, independent geometry and preserved contact semantics.

## @evidence contracts/development/implementation.md#principled-implementation

Each carrier receives current times inverse-neutral, a rigid delta preserving all source-local coordinates. Applying that same delta to the part and contact frames preserves attachment invariants without rebuilding geometry or changing source identities.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared QuadrupedRigDelta owner admits complete frames and computes carrier maps; copy and move parts and original contact frames through that same owner. pose and prepared samplers share this emission operation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No nearest-bone guess, ignored nonunit scale, uncarried part/contact, invented identity or stretched primitive is accepted. Null accessories retain the model contract's identity interpretation.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B+P+A+V) work/output for bones, parts, affordances and copied geometry values; one delta map prevents repeated rigid inversion per attachment.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the caller's already computed FK states, with one shared rigid delta per carrier; no graph preparation or completed-pose cache is created here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All maps are call-local. Returned parts own independent geometry records/buffers and transforms, returned contacts own new frames, and no frame map, process or external handle is retained.
