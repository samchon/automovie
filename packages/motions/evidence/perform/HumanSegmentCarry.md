# src/perform/HumanSegmentCarry.ts#HumanSegmentCarry.borne

## @evidence contracts/development/common.md#meaningful-documentation

Defines exact source/window/drive exclusions, the capture-instant order and ordered per-hand riding priority, with the recursion the order prevents; returns a fresh array of original held references.

## @evidence contracts/development/implementation.md#principled-implementation

The original active-window filter and subsequent riding-priority filter are independent ordered passes over unchanged internal hold records, so one pass can carry the same two side states without changing their decisions. `capture` evaluates a hold's source at its capture instant and reads the holds this filter admits there; admitting a hold only when its (capture instant, source end) precedes the evaluation's (second, carrier end) lexicographically makes that key strictly decrease along every nested capture, so each terminates. The same order is causality: no carry is read before the instant it is captured from.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Active-window admission precedes lazy per-side drive lookup, then the original first-riding-hold priority; carry-frame capture remains separate in carries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains inclusive starts, strict ends, source exclusion, riding fade and older-carrier cutoff exactly; the capture-instant order removes only holds whose source action has not yet ended at this second, which a running overlay drives anyway, or which ends with or after the carrier at this very second. Internal held producers own the closed two-side domain; no hold, contact or source pose is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(H) hold traversal and at most two original plan drive scans replace two arrays/passes and a set/object. Empty holds allocate only the fresh returned array and perform no drive/contact lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only a fixed plan's per-side drive result is shared within this call; current hold windows and riding order are read at each exact second without retained selection or pose results.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Four scalar side states end with the call. The returned fresh array borrows the original holds, retains no reader or process, and lives only as long as its displayed evaluation.

# src/perform/HumanSegmentCarry.ts#HumanSegmentCarry.carries

## @evidence contracts/development/common.md#meaningful-documentation

States chest-relative capture, displayed arm goals, held records and the optional borrowed FK source and lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Captures the actual displayed source hand/elbow relative to its chest and returns that rigid relation attached to the chest, so every fit of the goal composes it with the chest of the pose it fits; a world goal placed from one pose's chest would be missed by a refit on a pose the clamp moved. Every capture still evaluates the source pose; borrowed FK shares only exactly equal scalar prerequisites under the same unchanged skeleton topology.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

An empty-hold return and one ordered map of holding hands keep capture and ordinary FK in private helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hold, source pose, capture, hand transform or fit is skipped; standalone calls retain their ordinary fresh-FK path, and the optional source never enters h.carry or a returned goal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For H holds, O(H) record copies and no current FK (the fit places the chest it already resolves); each of M uncaptured holds adds its complete source-pose evaluation and demanded chest/hand/elbow FK. Ordered joint admission remains, while unrelated world-bone outputs are omitted. A supplied parent shares exact math; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Existing h.carry stores each hand's numerical source relation once until forget. An explicit parent lends its same genuine projection and lazy exact reader to complete first source-pose evaluation and current/captured FK; changed pose/rest/parent scalars miss normally and all source poses/fits remain actual independent evaluations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local getter borrows its parent's raw operation key until this call ends; canonical body FK owns O(K) successful dependency rows under that weak key. Holds keep only numerical carry frames/reference until forget. Returned arrays/tuples/goals/vectors are fresh, reference stays borrowed, and none retains the getter or key.
