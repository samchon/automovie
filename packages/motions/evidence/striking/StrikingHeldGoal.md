# src/striking/StrikingHeldGoal.ts#StrikingHeldGoal.goal

## @evidence contracts/development/common.md#meaningful-documentation

Uses the current canonical body, tool, actual hand frame, kept-point distance and fallback bend to construct the original physical goal.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the canonical grip and delegates the rigid wrist placement, original strain/contact/planted policy and the two actual working-line limits to the shared builder.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One grip read and one goal builder preserve the one-shot StrikingHeld.goal path without a prepared closure or fixed-result copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains exact wrist subtraction, contact offsets, both MISS bounds and bare-hand absence of prop limits/planting; no fit or acceptance is supplied.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant rigid/vector work and the original goal/contact/optional two-limit allocation; no search, scan or additional prepared state is built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One-shot and prepared goals share the same builder and tool-offset primitive; every current frame/bend is still consumed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing. The caller owns fresh goal/contact/limit records, while frame rotation and bend retain their original borrowed-input semantics.

# src/striking/StrikingHeldGoal.ts#StrikingHeldGoal.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Defines one fixed canonical body/tool/back operation and changing actual frame/bend inputs; each output keeps fresh task records.

## @evidence contracts/development/implementation.md#principled-implementation

The fixed grip and tool geometry determine local kept-point contact and the two original limit offsets independently of world frame and posture, so their exact original vector expressions run once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed geometry record feeds the same goal builder as the one-shot path; no alternate goal or solver policy exists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves strain, planting, contact, original point-limit order and MISS values; frame/bend are always actual inputs and each mutable contact/limit output is independent.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant setup removes repeated grip lookup and fixed local vector arithmetic across K candidates; each candidate still performs actual wrist rotation/subtraction, fresh output copying and all later physical fits. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Explicit unchanged canonical body, tool scalar geometry and kept-point distance establish equivalence; changing those requires another producer, while changing frames/bends are evaluated normally.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The enclosing fixed-tool action or synchronous candidate operation owns one grip, contact and at most two fixed limit records until its release; returned goals clone mutable task geometry and retain no producer or candidate history. Rotation/bend borrow inputs as before.

# src/striking/StrikingHeldGoal.ts#StrikingHeldGoal.offset

## @evidence contracts/development/common.md#meaningful-documentation

Defines tool tip minus its axis times the distance behind the tip, in the hand frame.

## @evidence contracts/development/implementation.md#principled-implementation

The original rigid line expression tip-axis*back gives the same kept point for hand alignment, read-back and task goals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scale and subtraction form the common tool-point primitive.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the exact supplied back/tool values without clamping, normalization or a substituted working point.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic and one fresh vector; no scan or solver is invoked.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All real held-point consumers delegate this one unchanged expression; the function caches no result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one independent vector and retains no tool, context, state or resource.
