# src/render/inspection/IAutoMovieInspectionDiagnostics.ts#IAutoMovieInspectionDiagnostics

## @evidence contracts/development/design.md#principled-representation

A continuity scope and the source clock locate one sample. Findings describe observed evidence while separate coverage records describe what each check attempted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This packet carries only the clock, scope, findings and coverage consumed by the episode reducer and inspection hosts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An output frame comes from the delivery clock and is optional at an arbitrary seek. Coarse evidence and unavailable coverage cannot claim a confirmed fault.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the scope, timebase, finding identity, evidence ranking, and coverage states.

# src/render/inspection/IAutoMovieInspectionDiagnostics.ts#IAutoMovieInspectionDiagnostics.ITime

## @evidence contracts/development/design.md#principled-representation

Separates the film seconds from the optional zero-based output index and the producer's shot-local seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The reducer reads film seconds and output index. Review consumers retain the shot address when its owner supplies it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Off-grid samples leave the output index absent. A generic subject can leave both optional fields absent.

## @evidence contracts/development/common.md#meaningful-documentation

Names the coordinate origin and units of all stored clocks.

# src/render/inspection/IAutoMovieInspectionDiagnostics.ts#IAutoMovieInspectionDiagnostics.IShotTime

## @evidence contracts/development/design.md#principled-representation

A path addresses the shot occurrence and seconds describe the owner's local clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Retains the address and local time a reviewer can use to locate the evidence.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The owner supplies these facts when known. The report cannot infer them from the output clock.

## @evidence contracts/development/common.md#meaningful-documentation

Names the origin of the path and the seconds.

# src/render/inspection/IAutoMovieInspectionDiagnostics.ts#IAutoMovieInspectionDiagnostics.IFinding

## @evidence contracts/development/design.md#principled-representation

Portable codes, owned keys and paths identify findings. Category and confidence jointly determine whether observed evidence blocks delivery.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Places the identifying data beside the message and witness that the Viewer and report need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reducer groups by identifiers and compares declared witness rank without parsing the message.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the coverage identity, code, paths, confidence, category and witness.

# src/render/inspection/IAutoMovieInspectionDiagnostics.ts#IAutoMovieInspectionDiagnostics.IWitness

## @evidence contracts/development/design.md#principled-representation

World points, exact times, finite ranks and named measurements keep spatial and temporal evidence independent from the text message.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each optional member is consumed by the report, the reducer's witness comparison or the inspection presentation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bounds and sampled witness time are separate. An interval bracket alone does not invent an exact collision time or output frame.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the optional time, world coordinate system, interval and ranking semantics.

# src/render/inspection/IAutoMovieInspectionDiagnostics.ts#IAutoMovieInspectionDiagnostics.IInterval

## @evidence contracts/development/design.md#principled-representation

Two finite seconds locate the reported interval while the witness can separately name a measured instant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Retains only the endpoints supplied by the check.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The interval carries no assumed interpolation law or presentation-frame rounding.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the bounds in film seconds.

# src/render/inspection/IAutoMovieInspectionDiagnostics.ts#IAutoMovieInspectionDiagnostics.IMeasurement

## @evidence contracts/development/design.md#principled-representation

A number holds a finite measurement while a decimal string can preserve a native timestamp beyond exact binary64 integer range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Name and unit give the value meaning outside its producer. Only checks with a comparison limit need supply one.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reports retain native values and units. The episode reducer ranks the separate declared witness rank without interpreting arbitrary units.

## @evidence contracts/development/common.md#meaningful-documentation

States how values, limits and units are interpreted.

# src/render/inspection/IAutoMovieInspectionDiagnostics.ts#IAutoMovieInspectionDiagnostics.ICoverage

## @evidence contracts/development/design.md#principled-representation

A checker and stable key address an obligation. The status distinguishes successful observation, explicit exclusion and unresolved coverage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same row supports release gating and explains incomplete or excluded scope.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every unresolved or excluded row carries a reason. The required flag is chosen by the obligation owner.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the four statuses and the scope of the required flag.

# src/render/inspection/IAutoMovieInspectionDiagnostics.ts#IAutoMovieInspectionDiagnostics.IObservation

## @evidence contracts/development/design.md#principled-representation

Joins the source finding to its exact witness time or the enclosing sample time when no override was given.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used for the first and worst witnesses in the same episode.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the source clock without rounding.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the exact time chosen for the observation.

# src/render/inspection/IAutoMovieInspectionDiagnostics.ts#IAutoMovieInspectionDiagnostics.IEpisode

## @evidence contracts/development/design.md#principled-representation

First and worst observations preserve distinct evidence. The last sample and count describe the observed extent. The optional clock proof includes both the enclosing samples and shot-addressed witnesses, including those outside the retained observations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supports review jumps, delivery diagnostics and inspection history with two full witnesses.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reducer joins only adjacent output frames with checked coverage for that identity and a matching shot clock.

## @evidence contracts/development/common.md#meaningful-documentation

States the scope, first and worst observation, last sample, sample count and the optional clock proof.

# src/render/inspection/IAutoMovieInspectionDiagnostics.ts#IAutoMovieInspectionDiagnostics.ICoverageRange

## @evidence contracts/development/design.md#principled-representation

A scoped status and two sample clocks describe the observed range, with a count that measures records actually seen. The optional continuity proof records whether those samples share the first sample's shot clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reports long unchanged coverage without repeating the same row for every frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Adjacency comes from output indices. The reducer splits ranges on skipped frames, changed scope, changed shot clock and changed outcomes.

## @evidence contracts/development/common.md#meaningful-documentation

States that the endpoints are observations, what the count measures and why older audits can omit clock proof.

# src/render/inspection/IAutoMovieInspectionDiagnostics.ts#IAutoMovieInspectionDiagnostics.IAudit

## @evidence contracts/development/design.md#principled-representation

Episodes and coverage ranges retain observed evidence. Separate verdict flags distinguish confirmed errors and unresolved delivery obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries evidence, the observed delivery count and the two facts needed by a host to gate publication.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sparse capture requires no fabricated expected frame count, and incomplete required coverage cannot pass a declared delivery schedule.

## @evidence contracts/development/common.md#meaningful-documentation

Defines what the coverage, frame counts and decision flags claim.
