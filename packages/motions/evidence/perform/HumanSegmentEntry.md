# src/perform/HumanSegmentEntry.ts#HumanSegmentEntry.entry

## @evidence contracts/development/common.md#meaningful-documentation

Defines film-second entry, optional decay duration, displayed pose/rates and the feet/support/base/hold state returned to the next action.

## @evidence contracts/development/implementation.md#principled-implementation

Preserves the existing complete shown or cold-plus-continued one-sided pose/rate samples at STEP seconds. World foot velocity, acceleration and spin consume only the two foot frames and retain their original difference formulas; four demanded FK reads share exact scalar prerequisites under the same unchanged skeleton topology.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One same-body evaluation preparation reaches every actual source pose, raw posture, layer and four foot FK reads; then derive the two feet and one support list read by both the entry and its base classification.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the cold pose distinct from a continued instant and evaluates every distinct source pose and FK input. The next action carries its posture without native breath, while displayed pose, rates and feet still sample the fully layered evaluation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Before a first action, the same static initial pose serves all three rate samples and the two foot frames are read once. A moving entry computes only the foot ancestors and does not repeat FK when the displayed and sampled poses are the same object. One O(C) support scan serves entry and base.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The unresolved initial posture has no time input, so its rate samples read one unchanged result. Distinct moving and continued samples keep their own frames. Base classification borrows the current support list without mutating or retaining it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One entry-owned preparation holds rig metadata and last successful joint/world scalar snapshots per visited bone name, O(K) for K identities, until return or throw. The four fresh demanded maps are local; returned foot vectors/quaternions retain their original value ownership, while complete pose/posture/from-plan/support references remain as before. No reader or supplier enters the returned entry or a retained plan.

# src/perform/HumanSegmentEntry.ts#HumanSegmentEntry.supports

## @evidence contracts/development/common.md#meaningful-documentation

States initial ground plants and current non-grip/non-strike supports at film seconds.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the previous plan's actual contact windows at its clamped share, retaining the existing 1e-9 comparison allowance and declared contact/support representations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Return two initial ground plants or one ordered contact filter and projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps duplicates and order, excludes only grip/strike kinds and does not alter window endpoints or invent a support for an existing action.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans C contact windows in O(C) time and returns O(A) wrappers for A active supports; the initial case has two entries.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads current windows and creates its own result; no support snapshot is cached across changing placement or queries.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state. The returned array/wrappers are fresh; existing contact support payloads stay borrowed, while initial ground payloads are new.
