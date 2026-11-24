# src/physics/AutoMoviePhysicalSimulation.ts#AutoMoviePhysicalSimulation

## @evidence contracts/development/common.md#meaningful-documentation

Documents sampled-input ownership, checkpoint reuse conditions and the run-owned world; public results retain replay data, recomputed-step counts and tracking diagnostics for the completed run.

## @evidence contracts/development/design.md#principled-representation

Represents a completed fixed-step simulation over film seconds and SI physical inputs. The private constructor follows admission and execution; the run path validates and owns the input snapshot before building the world.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Engine owns simulation and checkpoint admission while interface owns input, diagnostic and replay contracts. Retained input and step counts support equivalence checks and incremental-run accounting.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sampled body and profile data carry variation instead of scene-specific members. Public readonly fields prevent reassignment, not mutation of every nested record; callers must preserve the admitted snapshot when requesting checkpoint reuse.

# src/physics/AutoMoviePhysicalSimulation.ts#AutoMoviePhysicalSimulation.prototype.trackingAt

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes radian joint error from cap forecasts and records the cached-time failure boundary.

## @evidence contracts/development/implementation.md#principled-implementation

samplePhysicalTracking samples the cached pose and authored targets, compares joint-frame relative rotations and selects forecasts from floor(seconds*rate)/rate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates target interpolation, cached-pose sampling and quaternion operations to their existing owners; the simulation supplies its admitted inputs and retained diagnostics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Recovery may intentionally depart from authored goals; reported error is not hidden by replacing the authored reference, and forecasts are not relabeled as measured torque.

## @evidence contracts/development/implementation.md#efficient-algorithms

For s segments, j joints and d retained diagnostics, cache/target sampling and comparison take O(s+j+d) work plus copied saturation entries, with transient maps and an O(j) result.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the completed cache and recorded forecasts without rerunning the solver. Dense arbitrary-time errors are computed on demand rather than retained for every film sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The simulation owns inputs/cache/forecast history; the query returns new diagnostic records and copies saturation lists, retaining no query result or solver state.

# src/physics/AutoMoviePhysicalSimulation.ts#AutoMoviePhysicalSimulation.identity

## @evidence contracts/development/common.md#meaningful-documentation

States defensive ownership, shared defaults/admission, digest scope and the solver-free boundary.

## @evidence contracts/development/implementation.md#principled-implementation

admitted clones, defaults, validates and freezes the physical input; physicalInputDigest canonicalizes all admitted data and hashes it with the protocol and pinned solver version.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Identity and compute call the same admitted boundary and digest owner, so omitted defaults do not create a different runtime interpretation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The key derives from actual profiles, settings, impulses and sampled targets, not an edit timestamp or caller-asserted manifest.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work includes cloning/freezing the input, full physical admission, target canonicalization/hashing and final metadata hashing; sizes of sampled targets, profiles and impulses drive cost. Canonicalization sorts object keys and admission may scan referenced populations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The digest owner hashes each identical target object once within the cloned graph using a call-local Map; distinct equal objects are still hashed separately. No digest is cached across independently mutable input arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owned snapshot, canonical strings and target-digest Map live only for this synchronous call; only the digest string escapes, with no solver world.

# src/physics/AutoMoviePhysicalSimulation.ts#AutoMoviePhysicalSimulation.compute

## @evidence contracts/development/common.md#meaningful-documentation

Documents owned admission, exact-result reuse, compatible-prefix resumption, kinematic execution and progress/cancellation behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Integrates admitted SI inputs at 1/(rate*substeps) seconds, applies interval policy and first-substep impulses, and records completed cache frames and causal contacts. Prefix equivalence is established from actual settings/targets/impulses before restoration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission/digest, prefix selection/restoration, the run's step and snapshot plan (`planPhysicalSimulationSteps`), checkpoint capture (`capturePhysicalSimulationCheckpoint`), world binding, tracking/contact owners and replay storage have separate responsibilities; this method coordinates their fixed-step order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Kinematic and exaggerated modes are explicit authored policy. Admitted body/segment/target populations and selected checkpoints justify internal lookups; valid previous results must retain their original input/checkpoint consistency. Missing geometry or exceeded floor bounds remain errors.

## @evidence contracts/development/implementation.md#efficient-algorithms

For r recomputed steps and u substeps, solver substeps and tracking/contact work dominate, with segment/shape and active-contact populations as dimensions. Each substep also scans all impulses, and prefix selection serializes prior samples while scanning impulses per candidate step; replay storage grows with total steps*segments plus checkpoint and contact data.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Equal complete identity returns the prior object; compatible prefixes reuse prior frames/receipts and coupled reports up to the resume step and restore copied solver/controller/balance state. Changed solver/profile/settings force restart; separate effectful compute calls are otherwise not merged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Restoration copies the causal prefix before building its world, which lives only for the run. Returned inputs, frames, receipts and checkpoint bytes remain caller-owned; step/segment admission bounds their populations but there is no total retained-byte budget.
