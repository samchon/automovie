# src/motion/prepareChainFitRig.ts#prepareChainFitRig

## @evidence contracts/development/common.md#meaningful-documentation

States merged-axis and matching-geometry premises, lazy admission, source-only reuse, the lent rig-only record and the owning workspace lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Fixed rig and source data determine effective ROM, normalized bases, clamps, projector coefficients, fixed-rest inverse and reference/hinge readings independently of target; getters preserve original defaults, lookup conventions and diagnostic paths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

prepareChainRigConstants owns the rig-only members; this owner adds the source pose's held effector, posed swing and hinge geometry and the goal's reference and weight. prepareChainFit owns FK/continuity and target consumers own analytic solving, projection queries and candidate ranking.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No target score, user callback result, projected joint or continuation seed is cached. Hinged references retain first-record lookup and held source effectors retain last-record lookup; changed dependencies require another workspace. A chain's carried readers are its constants' own, built with them for the tables its fits pass; that premise is the owner's who places the chain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Held/reference scans are O(J) once; the hinge source inverse is a lazy constant-size preparation. The rig-only members cost what prepareChainRigConstants states, once per workspace or, carried by the chain's constants, once per those constants. Every target query still runs; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unchanged source/rig/mappings prove equivalence across targets and goal bindings. A supplied fixed source rig shares every source-only method, but each binding creates fresh first-record reference and weight readers using that same admitted joint basis. A chain's carried rig-only record shares pure functions of the rig and of the constants the chain was placed from; held products, inverses and hinge geometry keep their original grouping and lazy sites, and changing goals own every query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller's workspace owns source/reference values and, when the chain carries none, the rig-only record until release. Inputs are borrowed, loader callbacks and target results are not retained, and no global collection, handle or task owns this context.
