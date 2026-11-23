# src/kinematics/refineHingedSwivel.ts#refineHingedSwivel

## @evidence contracts/development/common.md#meaningful-documentation

Defines degree-valued brackets, caller-owned ordering, tied-probe symmetry and actual returned-probe policy.

## @evidence contracts/development/implementation.md#principled-implementation

Golden-section search reuses one interior probe when one bracket side is discarded; equal probes close both ends under the existing symmetric refinement convention.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns the same bracket law used by both coarse-minimum and near-seed refinement; hingedArmArticulation owns candidates, legality and score/tie policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps original step/ratio/count and tie updates until finite probes become Object.is-identical. Their next tie collapses both bounds to that number, so all remaining values/objectives match. This exact representability stop uses no epsilon, guessed convergence or arbitrary sample reduction and distinguishes signed zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two initial probes and one new probe per ordinary pass, two on a tie, cost O(P) scoring. Bit-identical finite probes omit guaranteed-identical remaining work. Retained state is constant-size; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A surviving actual candidate remains shared. At bit-identical finite probes the original final comparison suffices because every further value/objective would match under the same unchanged scorer; no score crosses refinement calls or targets.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Two current candidates and scalar bracket state are local until return; only the selected actual candidate escapes, with no history, global state or handles.
