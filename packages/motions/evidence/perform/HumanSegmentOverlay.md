# src/perform/HumanSegmentOverlay.ts#HumanSegmentOverlay

## @evidence contracts/development/common.md#meaningful-documentation

States what the file owns and what it reads from its siblings.

## @evidence contracts/development/design.md#principled-representation

One responsibility of a placed action's evaluation, over the records `HumanSegment` declares.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Split from `HumanSegment` unchanged, so each file holds one responsibility.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the sibling owners; nothing is duplicated between them.

# src/perform/HumanSegmentOverlay.ts#HumanSegmentOverlay.IOverlaid

## @evidence contracts/development/common.md#meaningful-documentation

States which goals survive fading and their coordinate convention.

## @evidence contracts/development/design.md#principled-representation

The displayed pose and its active constraints, kept together through final resolution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Adds only active contact goals to the existing seeded pose record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the posture's own goal type, preserving all constraint data.

# src/perform/HumanSegmentOverlay.ts#HumanSegmentOverlay.overlaid

## @evidence contracts/development/common.md#meaningful-documentation

States the fade, carry, contact and seed behavior and which raw posture and weight evaluations are shared.

## @evidence contracts/development/implementation.md#principled-implementation

Each branch merges the same overlay's pure posture at the same local second onto its own under-posture; fade and final contact fits retain their original order. Plan contacts, hands and channel claims stay unchanged within the call, so metadata decisions are shared. Exact contact FK needs the body's unchanged skeleton topology; prepared blending additionally requires its constraints and clinical axes unchanged throughout this synchronous evaluation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Lazy posture/weight slots and prepared fixed-claim mergers feed the recursive branch builder, then ordinary contact refitting. Exact-name continuation and attachment admission retain their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

All active overlay branches, fade weights, seed names and contact windows remain. Every merged raw posture receives native joint admission and goal fitting; a shared under-posture reference cannot assert that its arbitrary overlay goals permit partial-leg reuse.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each demanded overlay samples raw posture, weight and ordinal once per query. Fixed claims classify encountered bone names once per merger; no-digit merges omit digit-goal traversal. Contact windows are scanned once and missing explicit goals demand only their effector/lower FK ancestry. Up to 2^N fade leaves remain for N simultaneous partial overlays; checked source-leg reuse or bare observational selection may avoid only their proven independent fits. A leaf's swept fits start their bounded searches from the carrier's last leaf seeds (`HumanLimbIncumbent`), which order the search but never answer it. Runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Raw postures, weights, ordinals, claim mergers, drive metadata and blend preparation share within this query. The parent FK/ROM source reaches actual raw/canonical consumers while every branch keeps its original independent native goal fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Query slots, branch indexes, claim mergers, blender and local FK supplier release on return or throw. No returned pose, seed or goal retains them.

# src/perform/HumanSegmentOverlay.ts#HumanSegmentOverlay.running

## @evidence contracts/development/common.md#meaningful-documentation

States film-second input, placement-order output and inclusive comparisons with the existing endpoint allowance.

## @evidence contracts/development/implementation.md#principled-implementation

Filters the person's placed overlays by their active entry and end instants, retaining the existing 1e-12-second comparison allowance at both endpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered filter owns active-overlay selection; posture composition remains with the overlay evaluator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads every overlay's actual interval without changing contact windows, ordering or physical tolerances.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans N placed overlays in O(N) time and allocates an array of the K active references, O(K) space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each query reads current overlay intervals and seconds; no persistent selection cache assumes unchanged placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a caller-owned array of borrowed overlays and retains no query, person or external handle.

# src/perform/HumanSegmentOverlay.ts#HumanSegmentOverlay.handing

## @evidence contracts/development/common.md#meaningful-documentation

States the scope, its second and why the entry reads the act's end.

## @evidence contracts/development/implementation.md#principled-implementation

A sequence hands each act's channels to the next at its end, as a blend tree's transition hands a pose on, so the next act starts where the last one ended; a release to the carrier belongs only to an act nothing follows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scoped second, saved and restored in finally.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only overlays ending at exactly that second are read as handing on; scopes nest and restore on throw.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The second lives for the synchronous read.
