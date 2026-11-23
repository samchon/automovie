# src/handling/HumanClaspClearance.ts#HumanClaspClearance.IPhalanx

## @evidence contracts/development/common.md#meaningful-documentation

Documents world-metre segment endpoints and capsule radius.

## @evidence contracts/development/design.md#principled-representation

Endpoints and radius represent the uniform-radius capsule HumanGrip.chain declares, including its stated approximation of wider phalanges.

## @evidence contracts/development/design.md#minimal-and-owned-surface

prepareDigits produces and between consumes all three fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The skeleton and capsule profile determine the data; no distance or contact verdict is stored.

# src/handling/HumanClaspClearance.ts#HumanClaspClearance.prepareDigits

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed body and hand, the bone input and the segments returned.

## @evidence contracts/development/implementation.md#principled-implementation

HumanGrip.chain owns capsule selection, distal tip and minimum radius; each segment runs from a phalanx joint to the next, the last to the rigidly placed distal tip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Five chains read on first use, one placement loop per candidate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing capsule throws in HumanGrip.chain; no thickness is guessed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Five chain readings serve every candidate; each candidate places fifteen segments.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The chains depend only on the body and side, which the search holds fixed; segments are placed per candidate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds at most five chains until the search releases it; no global cache.

# src/handling/HumanClaspClearance.ts#HumanClaspClearance.bones

## @evidence contracts/development/common.md#meaningful-documentation

States the bones and their use.

## @evidence contracts/development/implementation.md#principled-implementation

The lower arm places the forearm collider; the hand and digit frames place every phalanx and closure collider.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Digit membership comes from HumanGrip's power-grip table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Lists only bones the geometry reads; FK still resolves their ancestors.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed seventeen-name set.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Candidate frames and the ordered closure request the same set.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh set and retains nothing.

# src/handling/HumanClaspClearance.ts#HumanClaspClearance.forearm

## @evidence contracts/development/common.md#meaningful-documentation

States the bone input, the side and the reader returned.

## @evidence contracts/development/implementation.md#principled-implementation

The person's same-side lower-arm collider, placed by HumanColliders.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A one-bone subset fed to the shared collider reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No shape or radius is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

One placement serves every pair the candidate enters.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The candidate's forearm frame is fixed through the search; each candidate gets its own reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader ends with the pair search.

# src/handling/HumanClaspClearance.ts#HumanClaspClearance.between

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the signed metre result.

## @evidence contracts/development/implementation.md#principled-implementation

A capsule's gap is its core segment's distance to the collider less its radius; the hand's is the least over its phalanges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reduction over the segments.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every segment is queried; no broad phase or tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fifteen distance queries per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reduction over its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains nothing.
