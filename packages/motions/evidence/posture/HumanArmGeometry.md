# src/posture/HumanArmGeometry.ts#HumanArmGeometry.IBase

## @evidence contracts/development/common.md#meaningful-documentation

Delegates ignored moving-arm joints and borrowed external world placements to the shared IBase declaration.

## @evidence contracts/development/design.md#principled-representation

The interface preserves the existing two-input frame-construction contract and borrowed geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Current mirror, frame and trajectory callers keep their existing name with one definition of its members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Does not add cached pose results, fixture-specific partners or deep-immutability claims.

# src/posture/HumanArmGeometry.ts#HumanArmGeometry.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the body, arm and returned setup; the namespace and setup members define coordinate units, clinical frames and carried rig data.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves this skeleton's current declared axes over the canonical family once, then uses that same table for the shoulder's swing-twist frame and every setup FK/chart reading; constraints retain first-matching-bone/default precedence.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One axes table and one setup record pair the three actual arm bones, effective constraints, rest transforms and mobile-axis flags; the engine fromAxes constructor owns the shoulder's canonical rest-frame pairing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No authored angle, ROM limit or rest transform is approximated, and the required upper-arm domain and actual rig bones remain caller premises rather than fabricated defaults.

## @evidence contracts/development/implementation.md#efficient-algorithms

Initial preparation is O(B): three first-bone scans serve both constraint and rest lookup instead of six, plus one axes merge. First requested clamps lazily index B bones and D names; bases are admitted once per name. Separate setups still read current rig data, actual projection/composition remains, and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One resolved axes table serves the shoulder frame and every FK/chart reading, and lazy per-name clamps/bases are shared only within this unchanged setup; a later preparation reads current skeleton contents instead of using a skeleton-identity snapshot.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the setup, its optional B-bone clamp index, at most D clamp/basis entries, one lazy shoulder-frame basis and one derived axes table, borrowing body/rest/constraint/axis records; all setup state is released with the operation without a global skeleton map.

# src/posture/HumanArmGeometry.ts#HumanArmGeometry.parent

## @evidence contracts/development/common.md#meaningful-documentation

States the requested bone and returned parent; the namespace documents the nonroot-bone premise.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the first matching actual skeleton bone's declared parent, the same parent link used by FK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared bone lookup and one parent read keep the hierarchy with its rig owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The existing cast assumes an actual nonroot arm bone; missing or null-parent input is outside that caller premise and is not repaired or newly admitted here.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(B) first-match scan over B skeleton bones, with constant output space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the local first-bone lookup owner and returns the actual parent name; no hierarchy snapshot is retained across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state and returns one borrowed semantic bone name.

# src/posture/HumanArmGeometry.ts#HumanArmGeometry.rotation

## @evidence contracts/development/common.md#meaningful-documentation

States clinical degree inputs, rig-ROM projection and the returned rest-relative articulation used by displayed FK.

## @evidence contracts/development/implementation.md#principled-implementation

First runs the setup's actual skeleton clamp, then admits its clinical basis at the original jointToQuaternion path and composes through jointToQuaternionOnBasis with the canonical rest frame, retaining final quaternion normalization.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared clamped triple, lazy basis reader and engine composition separate rig metadata from each requested numerical rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No articulation is replayed or approximated; basis admission remains after the clamp and before angle/frame composition, and failed admission is not stored.

## @evidence contracts/development/implementation.md#efficient-algorithms

After operation metadata is prepared, one actual clamp and fixed-size quaternion composition per call; each requested basis is admitted once rather than rechecking its unchanged components per candidate.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares only setup-scoped constraint/frame/basis preparation under the unchanged-body premise; every incoming clinical triple still produces its own computed quaternion.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned quaternion; preparation belongs to the supplied setup, and this call retains no angle or rotation result.

# src/posture/HumanArmGeometry.ts#HumanArmGeometry.clamped

## @evidence contracts/development/common.md#meaningful-documentation

States the clinical degree triple, actual skeleton-ROM projection and its relationship to rotation.

## @evidence contracts/development/implementation.md#principled-implementation

Converts the triple to the existing joint record, applies the setup's actual clamp and reads the same three projected axes, preserving the existing null-to-zero lowering.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One joint adapter delegates projection to the shared engine clamp factory instead of rebuilding rig metadata in each FK candidate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the first matching rig override and canonical fallback through the existing clamp owner; no cached joint result or relaxed ROM substitutes for projection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Initial setup metadata is O(B+D) across B bones and D requested names; each later call performs the existing numerical projection and constant-size record/triple conversion without a bone scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the setup's operation-scoped clamp metadata for its unchanged skeleton while projecting every actual triple separately.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only temporary input/result records and one caller-owned triple are allocated; metadata lifetime belongs to the supplied setup and no projected answer is retained.

# src/posture/HumanArmGeometry.ts#HumanArmGeometry.encode

## @evidence contracts/development/common.md#meaningful-documentation

States the arm's clinical triples and returned coordinates; the namespace defines shoulder chart scaling and elbow/wrist degree coordinates.

## @evidence contracts/development/implementation.md#principled-implementation

Projects the incoming shoulder as its actual displayed rotation, maps it through the swing-twist chart, scales its two disc coordinates by SCALE and appends separately projected elbow/wrist clinical triples.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shoulder chart plus two clamped triples assemble the existing nine-coordinate order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Out-of-range source angles enter as the actually clamped arm; the existing SCALE changes coordinate units rather than fitting a desired answer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three actual joint projections and one chart lookup with fixed-size output, after one-time setup metadata and the existing region-table preparation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the setup's fixed chart frame, operation-scoped clamps/basis and existing region table; each supplied arm is encoded anew.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one caller-owned nine-entry array and retains no source arm or coordinate result; shared rig metadata remains setup-owned.

# src/posture/HumanArmGeometry.ts#HumanArmGeometry.shoulder

## @evidence contracts/development/common.md#meaningful-documentation

States the chart's antipodal singularity, the ROM_TOLERANCE angular margin and returned shoulder articulation.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the region radius at the coordinate's azimuth, scales only a swing reaching the antipode back to 180 minus ROM_TOLERANCE degrees and applies the existing inverse swing-twist chart.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One coordinate norm, one admissible radial scale and one engine chart inversion expose the singularity handling.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The existing angular resolution keeps the undefined antipode outside the chart and does not widen a ROM bound; coordinates require the existing finite nine-entry caller contract and valid shoulder domain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic and two existing region-radius/chart queries after the shared region table is prepared; no skeleton traversal or limb solve occurs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the unchanged setup shoulder constraint/frame and existing cached region table, recomputing the requested coordinate's actual rotation each call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no coordinates or result; the caller owns the returned quaternion and the region cache remains with its existing owner.

# src/posture/HumanArmGeometry.ts#HumanArmGeometry.arm

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinate input and returned clinical triples; the namespace documents their units and coordinate order.

## @evidence contracts/development/implementation.md#principled-implementation

Decodes the shoulder's actual chart rotation through its lazily admitted basis at the original decomposeJointRotation path, canonical rest frame and box-only ROM copy to choose an equivalent clinical reading; elbow/wrist coordinates remain their supplied degree triples.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shoulder chart inversion/decomposition and two direct triple slices preserve the established representation boundary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Clearing swingTwist only for the decomposition's chart preference avoids a second radial projection; lower/hand coordinates are not silently clamped here, and consumers requiring display projection call rotation or clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-size chart inversion, existing Euler decomposition and three output triples, with no bone scan or limb search; a swing-twist domain shares the inverse owner's box preparation instead of another spread per decode, while other domains keep their former copy path.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the setup's actual axes, canonical rest frame and shoulder constraint while decoding each coordinate vector independently.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns caller-owned triples and a wrapper, retaining no coordinate population. The inverse's existing weak per-constraint cache owns a swing-twist domain's box copy; other domains retain the former temporary copy, with no new persistent owner here.

# src/posture/HumanArmGeometry.ts#HumanArmGeometry.chain

## @evidence contracts/development/common.md#meaningful-documentation

States actual FK, omitted observations, coordinate/frame inputs and fresh world-metre/rotation outputs.

## @evidence contracts/development/implementation.md#principled-implementation

Performs the original parent-first upper/forearm/hand compositions in the same order; an actual full-FK shoulder point for the same unchanged parent/rest frame is copied when present, otherwise the original offset calculation runs. Joint projection/chart owners and ignored rest scale are unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates the one FK body to resolveHumanArmChain with the existing pure shoulder/rotation functions; full placement attaches observations afterwards and an explicit derivative reader may share exact local work through that same body.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Recomputes every joint's actual transform for this candidate and parent frame; omits only unused fingertip/probe construction and caches no chain result or projection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed three-joint FK, one chart inversion and two actual joint projections after setup/region preparation, without the eight axis probes or P collider transforms; full placement pays one additional fixed-size intermediate chain record.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses unchanged setup metadata and, when supplied, the exact completed full-FK shoulder point for the same parent/rest dependencies with a fresh output copy; each candidate's world rotations and remaining joint positions are recomputed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns one fresh chain record and its six world vectors/quaternions; no input frame, candidate or computed chain is retained after return.

# src/posture/HumanArmGeometry.ts#HumanArmGeometry.prepareChain

## @evidence contracts/development/common.md#meaningful-documentation

States the one-derivative scope, unchanged dependencies, exact local-work reuse and caller release boundary.

## @evidence contracts/development/implementation.md#principled-implementation

A local shoulder or joint rotation depends only on its exact three coordinates, bone and fixed rig/domain; prepareHumanArmChain compares with Object.is and shares successful identical local work while recomputing the complete world prefix for every query.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One explicit prepared reader wraps the same pure shoulder/rotation owners used by cold chain; resolveHumanArmChain remains the single hierarchy implementation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every distinct local input still executes actual projection/composition, failures are not remembered and no target/user callback or final world-chain result is cached; private frozen quaternion copies cannot escape through mutable outputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant three-scalar equality work per local reader query, with the original numerical primitive on a miss and fixed world FK every time; at most one shoulder and two joint entries are held, without a runtime speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The reader's single unchanged setup/frame/domain scope and bone plus Object.is-equal local triples prove equivalence; keys snapshot scalars, input coordinate buffers are not retained and output world records are fresh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One derivative invocation owns the reader, three latest local entries and borrowed setup/frame until completion or failure; no global collection or cross-fit, seed, instant or trajectory memo is introduced.

# src/posture/HumanArmGeometry.ts#HumanArmGeometry.placed

## @evidence contracts/development/common.md#meaningful-documentation

States the setup/frame/coordinate inputs, optional collider-probe placement and returned actual arm geometry.

## @evidence contracts/development/implementation.md#principled-implementation

Parent-first quaternion/rest-offset FK places the upper arm, forearm, hand and fingertip; the shoulder uses chart inversion, lower/hand joints use actual ROM projection and clinical composition, and local surface probes follow their declared carrying segment.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One chain call feeds the probe attachment owner, so derivative readers share the same actual FK while full placement retains the fixed eight axis probes and optional surface map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the existing coarse axis-probe fractions and radius taper conventions unchanged, without claiming measured anatomy or an exact collider surface; surface probes retain zero radius and aligned owner indices remain a frame-producer premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

After setup metadata and region preparation, fixed three-joint FK, eight axis probes and O(P) requested surface transforms; one additional fixed-size chain record separates these phases, and disabling surface skips only its existing map.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses one unchanged setup's rig axes/clamps/bases, rest transforms and shoulder chart, but all world frames, joint projections and selected probe positions are actually computed for this candidate and instant.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh placed record and eight-plus-P probe array; the temporary chain wrapper is released after attachment and its world vectors stay shared with the output, with no retained candidate or frame.
