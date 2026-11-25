# src/handling/HumanGrip.ts#HumanGrip.bones

## @evidence contracts/development/common.md#meaningful-documentation

States hand side and proximal-to-distal order, including the thumb's metacarpal naming.

## @evidence contracts/development/implementation.md#principled-implementation

Constructs the existing three canonical suffixes for each closed side/digit alternative.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One thumb-versus-finger suffix choice and one name mapping own the canonical ordering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The existing enum cast follows the closed side/digit and fixed suffix construction; no bone is invented, validated or substituted.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three fixed names, with no rig traversal.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A fresh three-name list has no operation-dependent metadata to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new array and retains no body, input or handle.

# src/handling/HumanGrip.ts#HumanGrip.chain

## @evidence contracts/development/common.md#meaningful-documentation

States distal-local tip, metre radius, capsule provenance and refusal, including the uniform minimum-radius approximation.

## @evidence contracts/development/implementation.md#principled-implementation

The capsule's declared rigid transform places its far core endpoint; the existing minimum of all three radii supplies the engine's uniform chain radius.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One first-capsule lookup rule serves the distal tip and the three ordered radius reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing capsules throw at the same distal-first stage, and no phalanx width is guessed; wider phalanges retain the documented uniform-radius limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three O(P+S) profile and capsule searches for P segments and at most S shapes per segment; the distal capsule serves both the tip and its radius.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The distal capsule is read once per call; no chain is cached across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh chain/name array/tip with a scalar radius, borrowing no mutable transform output and retaining no body, profile index or handle.

# src/handling/HumanGrip.ts#HumanGrip.close

## @evidence contracts/development/common.md#meaningful-documentation

States start angles, hand/object world frames, digit ordering and returned clinical tuples/metre gaps.

## @evidence contracts/development/implementation.md#principled-implementation

One rigid transform carries the world colliders into the rest hand's frame, then the engine's ordered first-contact curl (the auto-grasp stopping rule of Miller and Allen 2004, IEEE Robot. Autom. Mag. 11(4):110) closes each chain within its range of motion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Canonical poseBones owns the rest-hand FK, chain owns capsule metadata, and curlChainUntilContact alone owns numerical closure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves CLOSING order, starting angles and missing-capsule refusals; uniform digit radii keep their stated approximation and no physical success is invented.

## @evidence contracts/development/implementation.md#efficient-algorithms

The rest hand is resolved on its own ancestry; C collider transforms and D chain readings precede the engine's curl probes, which share the body's FK data.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The body's skeleton, canonical axes and topology feed the curl; the rest hand is placed once for every collider.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary FK/collider/search records end with return or throw; the caller owns fresh joint tuples/gaps and no plan, body cache, workspace or handle is retained here.

# src/handling/HumanGrip.ts#HumanGrip.fingers

## @evidence contracts/development/common.md#meaningful-documentation

States side-selected canonical digit channels and clinical-degree tuples, with null channels read as zero.

## @evidence contracts/development/implementation.md#principled-implementation

The existing fifteen-name membership set selects this hand's authored digit records in source order, with later duplicates replacing earlier values.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Canonical bones generates the membership names; one pose scan builds the returned authored-joint record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Performs no FK, clamp, invented digit value or other-hand rewrite; absent channels remain absent.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fifteen generated keys and one O(J) pose scan preserve output order and fresh tuples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One fixed-size set belongs to this query, with no cross-pose result cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns new tuples and releases its temporary set, retaining no pose or handle.

# src/handling/HumanGrip.ts#HumanGrip.aperture

## @evidence contracts/development/common.md#meaningful-documentation

States thumb-index tip distance and its metre unit on the supplied clinical hand shape.

## @evidence contracts/development/implementation.md#principled-implementation

Canonical FK places the requested joints; each distal capsule core tip is rigidly placed and their Euclidean separation is the existing aperture measure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One poseBones map serves both digit-tip placements, using the same chain geometry owner as closure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the distal capsules' core tips, without a fitted opening or radius compensation.

## @evidence contracts/development/implementation.md#efficient-algorithms

One aperture reader, then FK of the two distal ancestries over the J authored joints.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both tips share one FK of the shape; a search over many shapes prepares the reader once with prepareAperture.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and releases its temporary pose/map/chains, retaining no input, workspace or handle.

# src/handling/HumanGrip.ts#HumanGrip.prepareAperture

## @evidence contracts/development/common.md#meaningful-documentation

States fixed geometry, per-reading clinical shape, metre distance and synchronous ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Each reading resolves the supplied joints by canonical FK, places both distal capsule tips rigidly and returns their Euclidean distance; the two chains are read on first use and kept for later shapes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One tuple reader resolves each shape at a null root; one tip reader places both tips.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every shape is resolved by FK; no interpolated aperture or guessed tip.

## @evidence contracts/development/implementation.md#efficient-algorithms

Capsule searches and name binding happen once for T shapes; each shape costs O(J) staging and FK of the two distal ancestries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The chains depend only on the fixed body and side; each shape computes its own FK and distance.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller releases two chains and one lazy FK reader with its synchronous aperture search; the builder must not be stored in a returned plan or frame history and no global cache is added.
