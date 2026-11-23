# src/index.ts#refineRecoveryFeasibleState

## @evidence contracts/development/implementation.md#principled-implementation

For C1 inequalities at a feasible state, negative objective derivative and strictly inward active derivatives admit sufficiently small feasible descent when other gates are interior. Optional complete-affine-QP mixing and a same-base minimum-metric correction are separate candidates, not a global or finite-trial convergence theorem. Baseline original KKT alone terminates normally.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner coordinates direction and normal termination; the same-base selector owns candidate ordering, while callbacks own metric/rank/gauge, qualification and charged allocations. A selected-step notification runs once before changing state/cost and may prepare the next existing model; rejected and qualified-unselected trials do not notify.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No boundary stalling, tiny accepted step, small objective decrease, initial-state fallback or abnormal multiplier is called convergence. No population, threshold, metric coefficient or budget is changed after refusal.

## @evidence contracts/development/common.md#meaningful-documentation

States physical KKT tolerance, multiplier support floor, mixed Armijo slope and same-base t*d+t^2*delta. Correction uses a 2.5 ceiling with a same-model dual-priced descent cap, whose scalar support and conditional local order are independent of actual gates and normal termination. The selector compares Tfull, Mfull, only failed-M SOCfull and one qualified-path half; exact ties keep the earlier candidate. Nominal min(1,physical SQP norm squared) and at most one original-row-derived support coefficient remain separate from actual selection and normal KKT.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most maxTrials actual evaluations and maxTrials+1 charged direction models run. Optional working transpose costs O(S*(q+H)*H^2+q*H^2); its one correction reuses the factor. Scans, inverse actions and every selected/unselected/full/half/backtracked geometry evaluation are charged under existing ceilings. Selection reserves256 visits per model and128+12*width per actual trial in addition to owner geometry work. Only an explicit estimate request prepays32 generic visits per selected precommit and adds them to directionWork before a fixed wrapper/null and the fifth argument; owner H-dependent copying is separately charged. Absent estimate requests retain the four-argument call and no wrapper charge. Every checked model separately prepays32 aggregate diagnostic-capture visits with physicalWork; directionWork includes them, while raw directionBudget.maxWork and its admission remain unchanged.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Backtracking retains one current model/direction until an actual state change. Every certificate uses every original physical row, without shared input-dependent result caches.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Current state, four detached candidates and chosen increments coexist with borrowed checkpoints, rows/metric and admitted factors. Owners admit that peak before copying and release any current design after the borrowed selected-step notification. Requested wrappers alias current qualified Arc arrays only during the callback; any next-model owned dual copy has separately admitted lifetime. Unselected trials expire; only the last feasible state and bounded reports transfer without history or handles. Actual tolerance and the last objective multiplier add two fixed scalar output properties; camera/report owners separately admit encoded/raw overlap and retained report populations.
