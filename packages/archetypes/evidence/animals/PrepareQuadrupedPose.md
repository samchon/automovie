# src/animals/PrepareQuadrupedPose.ts#PrepareQuadrupedPose.ordinary

## @evidence contracts/development/common.md#meaningful-documentation

States source/contact ownership, one-time rigid preparation, complete world-point chains, included root placement, independent geometry/frames and refusal of unsupported geometry or closure.

## @evidence contracts/development/implementation.md#principled-implementation

Admit the model, prepare its named generic rig once, snapshot parts/contact frames and verify neutral bar adjacency. Shared basis-aware lowering computes current FK; every requested origin and endpoint must agree with those fixed-length bars before one rigid carrier delta emits the model.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation owns admission, private source measurements/bindings and reusable graph/lowering metadata. read previews parents; bodyFloor uses shared carrier deltas and exact primitive/span owners without model emission; sample verifies achieved chains and delegates emission to the shared carrier owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No species case, human bone, scaled geometry, per-limb root shift, stretched bar, stale contact, completed-frame cache or silent partial chain is accepted. The only positional budget is scale-dependent binary64 arithmetic error, not an authored goal gap.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation and sampling cost O(B+P+A+V); preview costs O(B+G). Body floor costs O(B+P) without spans and O(B+P+A+S(P+A)) with the existing span locator, using shallow current records and span-only geometry. B/P/A/V/G/S count bones, parts, contacts, copied geometry values, goals and spans; four fixed chains add constant closure checks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One admitted rig/reader, neutral state, private source geometry/span records, lengths and explicit carrier copies serve every query. Model emission and body floor share the same rigid-delta owner; current frames and bounds are never cached by sampled time.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prepared owner retains O(B+P+A+V) independent source data for its lifetime; returned models/frames own their mutable geometry/transforms. No caller goal map, prior sample, process, file or global resource is retained.

# src/animals/PrepareQuadrupedPose.ts#PrepareQuadrupedPose.ride

## @evidence contracts/development/common.md#meaningful-documentation

Defines the native course authority and achieved ride geometry.

## @evidence contracts/development/implementation.md#principled-implementation

Share ordinary admission and offer exact achieved-state reuse only to the private ride.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegate the same source inputs to the sole geometry preparer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Native emissions still use closure, source parts, contacts and floor tests.

## @evidence contracts/development/implementation.md#efficient-algorithms

Same preparation work and bounded source data as ordinary preparation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Leaves the FK and physical checks with the single shared preparer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The private prepared owner retains source data only for its lifetime.

# src/animals/PrepareQuadrupedPose.ts#PrepareQuadrupedPose.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

States the internal exact source and achieved geometry.

## @evidence contracts/development/design.md#principled-representation

Public preparation and ride preparation share one admitted FK.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept at the two true prepared consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No new public prepared result field or completed model history.

# src/animals/PrepareQuadrupedPose.ts#PrepareQuadrupedPose.IPrepared.position

## @evidence contracts/development/common.md#meaningful-documentation

Separates complete achieved FK from fresh model emission.

## @evidence contracts/development/implementation.md#principled-implementation

This admission validates all four achieved chains before creating an emission capability.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The ordinary sample and the exact same-operation witness use this same lowering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Incomplete or approximate geometry cannot issue an emission capability.

## @evidence contracts/development/implementation.md#efficient-algorithms

Lowering takes O(B) for B admitted bones and emits independently on demand.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

An owning operation can retain the admitted lowering without sharing emitted models.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned capability keeps only its own FK state and prepared owner.

# src/animals/PrepareQuadrupedPose.ts#PrepareQuadrupedPose.IPosition

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes admitted FK from model ownership.

## @evidence contracts/development/design.md#principled-representation

A prepared FK result owns the exact frames that drive model emission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The existing tow and sample paths share the same model emission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No emitted model lives in the shared geometry.

# src/animals/PrepareQuadrupedPose.ts#PrepareQuadrupedPose.IPosition.emit

## @evidence contracts/development/common.md#meaningful-documentation

States the geometry and fresh model ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Apply the original carrier deltas and repose the native source from the achieved FK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegate to the existing skeleton emitter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Fresh parts, contacts and live model metadata are emitted on each call.

## @evidence contracts/development/implementation.md#efficient-algorithms

Emission does the original O(B+P+A+V) carrier and copy work for bones, parts, contacts and geometry values, plus span relaying when present.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuse the admitted FK and preparation while executing the original repose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The capability retains its achieved frames, and each emitted model belongs to its caller.
