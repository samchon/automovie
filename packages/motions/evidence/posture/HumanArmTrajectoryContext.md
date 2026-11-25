# src/posture/HumanArmTrajectoryContext.ts#HumanArmTrajectoryContext.IProblem

## @evidence contracts/development/common.md#meaningful-documentation

Defines body, seconds, original base frames, arm contact inputs and the still flag; coordinate and contact meanings remain with the geometry/model owners.

## @evidence contracts/development/design.md#principled-representation

Ordered per-arm sites and per-second bases describe the same deterministic trajectory whose coordinates are optimized.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every input is read by the setup, waypoint, rest or allowed-pair construction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Borrows the original body, poses and declarations without replacing unmet contacts or widening joint ranges; parallel time/base/site lengths remain caller premises.

# src/posture/HumanArmTrajectoryContext.ts#HumanArmTrajectoryContext.IProblem.share

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result's range and what reads it.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A callable slot with no body; the problem's owner supplies the share.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A callable slot with no body.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A callable slot with no body.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A callable slot selects no strategy.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A callable slot defines no cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A callable slot retains nothing.

# src/posture/HumanArmTrajectoryContext.ts#HumanArmTrajectoryContext

## @evidence contracts/development/common.md#meaningful-documentation

Specifies original problem inputs, continued-waypoint reuse and returned fixed context.

## @evidence contracts/development/implementation.md#principled-implementation

Prepares actual arm charts, hard intervals and contact geometry; exact same-base FK dependencies may share completed math across arms while every pose still receives full ordered admission and fresh outputs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Setup and per-second frame construction precede the waypoints and lazy pair-allowance readers; each shared FK reader is local to one base's synchronous setup map, created for a base two arms read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps arm/time order, original reference depths, bidirectional declared rests, grasp exemptions, still/open endpoints and hard-box rounding behavior; the shared FK reader is never retained in a context or reused at another second.

## @evidence contracts/development/implementation.md#efficient-algorithms

Full arm/base pose scans and fresh outputs remain; identical completed FK math can be reused for the second arm at one base. Each waypoint's geometry is built once per context, and allowance maps evaluate each requested pair key once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses existing setup, frame, waypoint and audit owners; one operation-local reader serves only the same base's arm frames; a refinement keeps its previous context's speed bound and beyond reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A same-base FK reader dies after its synchronous map. The context owns its waypoints and pair-key maps; closures borrow the original problem and current points, with no global result cache.

# src/posture/HumanArmTrajectoryContext.ts#HumanArmTrajectoryContext.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Copies fixed side order, prepares actual native setups and returns current-problem readers; body/rig/ROM mappings and returned borrowed setup metadata stay unchanged until release.

## @evidence contracts/development/implementation.md#principled-implementation

Arm charts, effective ROM, rest and mobile-axis metadata depend on fixed body/side rather than waypoint poses/sites, so only those invariants are prepared once; each current frame/allowance still builds normally.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A fixed native setup producer feeds the same private builder as ordinary of; changed body/side domains select its original fresh setup path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No caller-provided setup/index/verdict is accepted, and no pose, waypoint, physical query, box bound or candidate is dropped; ordinary of retains current-input preparation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Across Q contexts, fixed setup axes/ROM preparation costs O(A*B) once for A arms/B rig bones instead of Q repetitions; every dynamic frame/contact/allowance query and output remains actual, with unmeasured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The explicit unchanged body/canonical mappings and copied ordered sides establish only static setup equivalence. Current problem frames, sites, rests and previous-waypoint matching retain their owning builder.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The operation owns A native setups and copied sides until release; the reader stores no current problem/context, pose, FK reader or queried time. Returned contexts borrow fixed setups under the same unchanged-operation contract.
