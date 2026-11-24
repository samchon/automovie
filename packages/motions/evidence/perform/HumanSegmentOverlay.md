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

Each branch merges the same overlay's pure posture at the same local second onto its own under-posture; fade and final contact fits retain their original order. A hand that holds a prop on past the overlay's end keeps its arm and fingers at the overlay's own weight through the fade and hands them on whole to the carrier's carry of the hold, captured where the overlay leaves them: a hold transfers continuously to its next owner instead of fading to the carrier's own arm and back. Plan contacts, hands and channel claims stay unchanged within the call, so metadata decisions are shared. Exact contact FK needs the body's unchanged skeleton topology; prepared blending additionally requires its constraints and clinical axes unchanged throughout this synchronous evaluation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Lazy posture/weight slots and prepared fixed-claim mergers feed the recursive branch builder, then ordinary contact refitting. Exact-name continuation and attachment admission retain their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

All active overlay branches, fade weights, seed names and contact windows remain. Every merged raw posture receives native joint admission and goal fitting; a shared under-posture reference cannot assert that its arbitrary overlay goals permit partial-leg reuse.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each demanded overlay samples raw posture, weight and ordinal once per query; whether a side's hand holds on past the end is read once per side and query, one pass over the person's holds. Fixed claims classify encountered bone names once per merger; no-digit merges omit digit-goal traversal. Contact windows are scanned once and missing explicit goals demand only their effector/lower FK ancestry. Up to 2^N fade leaves remain for N simultaneous partial overlays; checked source-leg reuse or bare observational selection may avoid only their proven independent fits. A leaf's swept fits start their bounded searches from the carrier's last leaf seeds (`HumanLimbIncumbent`), which order the search but never answer it. Runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Raw postures, weights, ordinals, claim mergers, drive metadata and blend preparation share within this query. The parent FK/ROM source reaches actual raw/canonical consumers while every branch keeps its original independent native goal fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Query slots, branch indexes, claim mergers, blender and local FK supplier release on return or throw. No returned pose, seed or goal retains them.
