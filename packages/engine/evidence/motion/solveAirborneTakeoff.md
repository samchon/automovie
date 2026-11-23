# src/motion/solveAirborneTakeoff.ts#solveAirborneTakeoff

## @evidence contracts/development/implementation.md#principled-implementation

Newton's method with integrated sensitivity and analytic Euler-angle derivatives, actual-residual step-halving and continuation. The three momentum directions are an orthogonal unit basis with one physical unit. Sensitivity has a local matrix-error estimate, not a global Jacobian certificate; chart singularity, inaccurate derivatives or the finite iteration budget can still miss a feasible request.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A residual over one integration, a linearized start, then a fixed loop of Jacobian, solve and backtrack.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A request the flight cannot meet is reported as a miss with its residual; the caller refuses it.

## @evidence contracts/development/implementation.md#efficient-algorithms

The adaptive linear seed starts with five history samples and refines only its estimated angular error; fixed mode retains the integration grid. Every Newton point and backtracking trial is one integration with its nine sensitivity states, so an accepted trial, the usual full step, is never integrated twice; search flights skip the dense momentum probes, which only the one judged flight of the solution pays. Factory histories share error-checked exact time partitions across trials; their finest retained mesh can increase later stage counts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed flight and history make endpoint angles and Jacobian independent of the turn target. Reuses the current or last rejected evaluation only when every projected momentum component is Object.is equal, subtracting the new target from the original unwrapped endpoint rather than reconstructing it from an old residual. Different points still integrate independently. Each Newton point's unchanged residual norm serves all of its backtracking comparisons. Each unwrapping pass shares its unchanged reference-frame inverse through the same angle owner as the public single-angle reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Reuse checks only the call-local current or starting point and one last rejected trial; continuation also owns its accepted and last solved stage until replacement. A factory history additionally gives this solve one numeric time partition, cleared in finally on success or failure. There is no point map or cross-call cache. Playback retains the actual accepted numeric flight, never the partition or history. The caller separately clears the history after solving and preparing playback.

## @evidence contracts/development/common.md#meaningful-documentation

States the angle convention with its source, the unwrapping, the residual, the start, the iteration with its globalization, determinism and the miss.
