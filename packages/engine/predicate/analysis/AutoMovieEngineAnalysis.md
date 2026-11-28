# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.analysisMetric

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the finite measured and null-gap shapes, gap default, target premise, comparison and warning side effect.

## @evidence contracts/development/implementation.md#principled-implementation

The value/gap shape is checked first. Finite measurement admission precedes target lookup or writes to the warning sink. The first matching key decides the target, exact unit comparison guards the inclusive threshold test, and mismatched units append the located untargeted warning.

## @evidence contracts/development/implementation.md#efficient-algorithms

Gaps return immediately. A measured metric scans targets only to the first matching key, performs at most one comparison and appends at most one warning.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.assertAnalysisTargets

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc defines admissible target fields and the deterministic first-error order.

## @evidence contracts/development/implementation.md#principled-implementation

The check tests blank fields, numeric finiteness and the comparison vocabulary before inserting each exact key into a set. A repeated key throws at its declaration.

## @evidence contracts/development/implementation.md#efficient-algorithms

The scan stops at the first invalid target and retains only the earlier keys for duplicate detection.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.analysisRunDigest

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the archive protocol, covered rows and order, shaped-input premise and fixed digest spelling.

## @evidence contracts/development/implementation.md#principled-implementation

The header and issued outcome are serialized as fixed-order arrays. JSON escapes field separators inside a string, and newline separators distinguish rows. The existing SHA-256 helper hashes the resulting text, and the sealing and validation owners share this function.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each covered row is encoded once before joining and hashing. Temporary storage scales with the encoded lines, and only the digest is returned.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.analysisSettingsTargets

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the input premise, canonical selected fields, ordering and output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

A map emits each target's four contract fields explicitly. Extra runtime properties never enter the settings data, while target order is reproduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Projection uses one pass and allocates exactly one output record per target.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.analysisTargetMet

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies input finiteness and common unit, since it compares without unit conversion.

## @evidence contracts/development/implementation.md#principled-implementation

The declared comparison selects the inclusive numeric inequality directly, keeping the equality boundary consistent in both directions.

## @evidence contracts/development/implementation.md#efficient-algorithms

The typed comparison requires one branch and one scalar comparison.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.sealAnalysisRun

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc explains settings and content hashes, refusal order and ownership of returned nested records.

## @evidence contracts/development/implementation.md#principled-implementation

The builder sets the run version and protocol, hashes the supplied settings, and checks the draft with the same contents gate used by replayed runs. Numeric admission occurs before the shared archive digest is written. Failed admission names the first violation.

## @evidence contracts/development/implementation.md#efficient-algorithms

One settings hash and one ordered validation precede the content hash. The returned run adds its digest around existing solver and outcome records.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.summarizeAnalysis

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states required inputs and refusals, precedence, gap defaults and ordering, and digest coverage.

## @evidence contracts/development/implementation.md#principled-implementation

Each admitted run contributes to one domain rollup. Stale runs add a gap before their outcome can affect verdict counts. A solved current run counts measurements and target outcomes, while unsupported or absent answers supply reasons. The report seals the ordered domain table, bounded listed gaps and omitted count.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each supplied run is validated once and visited for rollup. The report stores at most the requested number of gap records and counts the remainder.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.validateAnalysisRun

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc defines the typed input premise, check order, digest requirement and optional staleness check.

## @evidence contracts/development/implementation.md#principled-implementation

The shared contents gate validates stored measurements, verdicts and samples. The stored digest is checked for syntax and recomputed with the writer's archive method. Exact revision equality determines staleness when requested.

## @evidence contracts/development/implementation.md#efficient-algorithms

The contents are scanned once and encoded once for the digest. The only retained result is the validation and its collected findings.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.validateAnalysisRunContents

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the semantic scope, caller-owned sink, numeric requirements, null-gap rule, sample count and reference premise.

## @evidence contracts/development/implementation.md#principled-implementation

Typed record checks distinguish measured and unavailable outcomes. Numeric failures retain the affected metric, target or sample component path. Verdict comparison uses finite operands and inclusive direction, and sample IDs and keys are checked against the run's own fields and limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass each over metrics, samples and warnings checks their fields. Local sets support uniqueness and sample-key membership, while the caller retains findings.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.acoustics

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc distinguishes the broadband models, their diffuse-field and numerical gaps, the unsupported speech index and the per-receiver sample rule.

## @evidence contracts/development/implementation.md#principled-implementation

The Sabine model uses 0.161 times volume divided by equivalent absorption area. The room constant divides that absorption by one minus mean absorption. Source energies add in linear power before the log, and transmission uses area-weighted power. A receiver distance at or below 1e-12 metres refuses before division by distance squared. If one receiver level underflows or overflows, the level metrics and receiver samples are unavailable.

## @evidence contracts/development/implementation.md#efficient-algorithms

Room constants are computed once. Surface and partition aggregation each read their own inputs, and receiver evaluation visits the sources for each receiver.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.daylight

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the light transport terms, occlusion, sampling limits and distinct missing-input and unsupported outcomes.

## @evidence contracts/development/implementation.md#principled-implementation

The workplane frame and grid define each sample position. Beam, sampled sky and inverse-square light add at each cell. The report retains supported components and explicitly reports dark contrast or unimplemented reflection.

## @evidence contracts/development/implementation.md#efficient-algorithms

One workplane frame and one sky-direction preparation serve all cells. At each cell, the modeled light paths perform only the relevant obstruction queries.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.envelope

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the shared settings, resistance and surface formulas and the boundaries of the two reports.

## @evidence contracts/development/implementation.md#principled-implementation

Each assembly reduces to a series resistance, surface temperature and factor. Linear bridges add separately. The moisture run reuses the same exterior boundary and applies the indoor dew-point comparison to assembly surfaces.

## @evidence contracts/development/implementation.md#efficient-algorithms

The solver aggregates the declared layers and bridges directly and reuses the resulting per-assembly quantities across the two runs.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.spaceAir

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives each modeled scalar, the zero-flow cases and the spatial limits of the well-mixed assumption.

## @evidence contracts/development/implementation.md#principled-implementation

The well-mixed balance uses the declared volume, occupancy, ventilation and source generation directly. Each unit conversion is fixed by the output units. Missing flow gaps all flow-dependent outputs, zero occupancy gaps per-person flow, and zero supply flow gaps the concentration balance. Velocity and spatial stagnation remain unsupported.

## @evidence contracts/development/implementation.md#efficient-algorithms

The modeled quantities each use a fixed number of operations. The remaining work is target matching and building the bounded metric records.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.assertAnalysisSolids

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the duplicate-ID scope, first-error ordering, label and the limits of half-space validation.

## @evidence contracts/development/implementation.md#principled-implementation

A local ID set detects repeats. Each solid goes through the same indexed plane checks as an environment occluder, and the first finding for that solid becomes an error.

## @evidence contracts/development/implementation.md#efficient-algorithms

The function makes one forward pass and stops on the first rejected solid. Each reached plane list is read once.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.resolveDaylightRequest

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the returned orientation and instant, finite positive dimensions, grid bound and request error conditions.

## @evidence contracts/development/implementation.md#principled-implementation

The resolver admits the context and its observation, checks grid and light fields, normalizes the two authored axes, and derives the measured face from their cross product. Shading and target checks use their shared owners.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fixed-size frame is calculated once. Validation reads the declared context, lights, shades and targets without allocating one record per workplane cell.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.resolveEnvelopeRequest

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the borrowed instant, indoor humidity boundaries, finite assembly and bridge fields, and list/reference requirements.

## @evidence contracts/development/implementation.md#principled-implementation

The resolver checks the context and named observation, then indoor fields, assemblies and layers, bridges, and targets. Per-list sets decide repeated IDs and assembly references.

## @evidence contracts/development/implementation.md#efficient-algorithms

The declared assemblies, layers, bridges and targets are visited once after context validation. Membership and uniqueness reuse the corresponding sets.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.validateSolidPlanes

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the half-space convention, minimum count, numerical fields, caller-owned sink and geometry premise.

## @evidence contracts/development/implementation.md#principled-implementation

The helper checks the length and then visits resident array slots by index. It passes each normal and offset through the shared field validators so missing slots and malformed fields keep their local paths.

## @evidence contracts/development/implementation.md#efficient-algorithms

The helper visits each authored plane once, appending only findings and constructing no intersection.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.warnAnalysisTargetKeys

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the warning, order, append behavior and how multi-run and unmeasured keys participate.

## @evidence contracts/development/implementation.md#principled-implementation

Metric keys become a set. A target without a matching key receives its own warning, while targets for gapped metrics stay attached to the reported key.

## @evidence contracts/development/implementation.md#efficient-algorithms

One set construction indexes all reported keys. The check visits each target once and only allocates unmatched warnings.

# src/analysis/AutoMovieEngineAnalysis.ts#AutoMovieEngineAnalysis.skyIlluminance

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the returned point evaluator, denominator, horizon and obstruction rules, and the finite-illuminance overflow recovery.

## @evidence contracts/development/implementation.md#principled-implementation

The sampler produces cosine-weighted directions. Each measured point counts the rays that pass the horizon and obstruction checks. Multiplying illuminance by the visible count before division preserves ordinary rounding. When this intermediate overflows for finite illuminance, computing the fraction first keeps it between zero and one before scaling. A full aperture in that branch returns the supplied illuminance, and a closed aperture gives zero for finite illuminance.

## @evidence contracts/development/implementation.md#efficient-algorithms

The direction generation and horizon filter run once. A point query casts only rays above the horizon and stops each ray at the first blocking solid. The ratio needs only scalar arithmetic and retains no per-point state.
