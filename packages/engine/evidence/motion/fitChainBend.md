# src/motion/fitChainBend.ts#fitChainBend

## @evidence contracts/development/common.md#meaningful-documentation

States the order of the candidates, the ranking and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The swivel parameterisation of Tolani, Goswami and Badler 2000 for a hinged mid joint (`fitHingedChainCandidate`), and a pole vector's bend plane as game-engine two-bone IK takes it, every candidate judged by its clamped forward kinematics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The search alone: preparation, the analytic solve, the swivel candidate and the candidate's forward kinematics have their own owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A degenerate preparation or solve keeps the given pose; no ideal measurement replaces the clamped forward kinematics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Free-bend search retains at most 34 initial candidates plus 32 minima times 20 refinements, stopping under its original rule; hinged requests add their unchanged search. Every candidate computes actual clamped FK/residual, but geodesic continuity runs only for equal residual buckets or the original explicit-reference stop. The incumbent retains only its actual clamped joint pair; exactly the final fitted winner copies the ordered O(J) source prefix, while a source winner returns by identity. Invariant geometry/factors stay shared and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Targets share prepared frames/domains, authored/reference data, ordered source prefix and resolved clamps. A candidate's admitted raw quaternions serve actual FK and its lazy memoized continuity, whose numerical value is independent of comparison order under fixed source/reference inputs. Lexicographic comparison reads that value only after an equal residual bucket; every needed ranking/stop and cold/near decision remains the same. Target-owned composers still perform each candidate's original angle/frame admission and fresh outer product while sharing pure factors.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Sweep/minima arrays hold at most 32 entries each, with two raw rotations and a lazy continuity reader per retained score. The incumbent additionally holds two clamped joint records rather than a copied full pose. Composers retain bounded factors. Search records release with the target, including on throw; only one final pose/seed escape, with no history or handles.
