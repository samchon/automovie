# src/grappling/HumanForceExchange.ts#HumanForceExchange.edge

## @evidence contracts/development/common.md#meaningful-documentation

States the measure, its inputs and the degenerate answers.

## @evidence contracts/development/implementation.md#principled-implementation

The ray from the centre along the direction exits a convex polygon at the nearest positive crossing of its edges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One hull, one pass over its edges.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A centre outside the base answers zero rather than the far crossing.

## @evidence contracts/development/implementation.md#efficient-algorithms

The hull's sort and a linear pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The hull is the engine's `convexHull2D`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.

# src/grappling/HumanForceExchange.ts#HumanForceExchange.breaking

## @evidence contracts/development/common.md#meaningful-documentation

States the law, the inputs and the unit.

## @evidence contracts/development/implementation.md#principled-implementation `F = e M ω² / (e^{ωT} - 1)`, the linear inverted pendulum's extrapolated centre reaching the base's edge at `T`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-positive inputs throw rather than return a force for a base that is already broken.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/grappling/HumanForceExchange.ts#HumanForceExchange.broken

## @evidence contracts/development/common.md#meaningful-documentation

States the law, the inputs and the infinite answer.

## @evidence contracts/development/implementation.md#principled-implementation `T = ln(1 + e M ω² / F) / ω`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pull of none never breaks the base, so its instant is infinite rather than clamped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/grappling/HumanForceExchange.ts#HumanForceExchange.drawn

## @evidence contracts/development/common.md#meaningful-documentation

States the three outputs and their units.

## @evidence contracts/development/implementation.md#principled-implementation `x = (F / M ω²)(cosh ωt - 1)`, `x' = (F / M ω) sinh ωt`, `ξ = x + x' / ω`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One full-sample facade shares HumanForceDrawn's coefficient, position and complete-state owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the original Math.max(0,seconds), arithmetic order and nonfinite propagation, with no added input repair or changed physical bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

One cosh, one sinh and constant scalar work produce one fresh three-field record without constructing a prepared factory; runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The complete one-shot and actual fixed-pull response readers share one analytic owner. Response requests offset only per yield frame and consumes a paired complete break-state once; this facade reads every supplied input anew.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh complete state and retains no props, clock, body, prepared factory, pose or numerical history.

# src/grappling/HumanForceExchange.ts#HumanForceExchange.resisted

## @evidence contracts/development/common.md#meaningful-documentation

States the law, the null and the inputs.

## @evidence contracts/development/implementation.md#principled-implementation

Static moment balance about the base: `M g s = F h`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form and one bound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A shift past the base is reported as null, never clamped to a lean.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/grappling/HumanForceExchange.ts#HumanForceExchange.swing

## @evidence contracts/development/common.md#meaningful-documentation

States the law, the start, the release rule and the null.

## @evidence contracts/development/implementation.md#principled-implementation `(I_c + M r²) φ'' = M g r sin φ + τ`, with the pull's moment `τ` while it lasts, integrated by the engine's fixed-step fourth-order integrator, in spans of the free swing's own time scale `sqrt(I / M g r)` until the angle passes `π / 2` or, once the drive has ended, the rate stops (a rate the drive is still reversing is not a stop); the release is found by bisection on the integrated angle to the step squared, finer than the step at which the motion is read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Integrate span by span, detect, bisect, read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A swing that stops short is null, never a scripted push over the fulcrum.

## @evidence contracts/development/implementation.md#efficient-algorithms

The original four right-hand sides per integrator step, span extension and release bisection remain. Fixed torque/moment and drive cutoff are prepared once, and one rate closure serves every span; every actual time/state still evaluates the pendulum sine and original drive condition. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The canonical integrator and bracketedBisection remain. This synchronous swing fixes mass, radius, moment, torque and cutoff, so their scalar drive geometry is prepared once; no trajectory sample, numerical state or different-time answer is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The swing holds its spans' trajectories for as long as its plan.

# src/grappling/HumanForceExchange.ts#HumanForceExchange.pull

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and how the force is spread.

## @evidence contracts/development/implementation.md#principled-implementation

A pull through several grips is their sum, so equal shares over the sites carry the whole force; each is `HumanForce.ISustained`, the one force input.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record per site.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No site is invented when none is given: the result is then empty.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the sites.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
