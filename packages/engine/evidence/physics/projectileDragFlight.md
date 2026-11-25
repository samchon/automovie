# src/physics/projectileDragFlight.ts#projectileDragFlight

## @evidence contracts/development/implementation.md#principled-implementation

The quadratic drag law integrated by classical RK4 at a step from step doubling's error estimate, at the state where the drag's acceleration is largest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, choose the step and integrate chunks lazily. The interval reader maps the selected chunk's actual stored positions and position derivatives to adjacent vector states.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The step comes from a stated tolerance, not a frame grid. Actual interval endpoints are stored knots; zero drag retains quadratic constant-acceleration motion and reports an unbounded global speed when gravity is nonzero rather than substituting launch speed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four right-hand-side evaluations per integrated step. Ordinary reads evaluate one Hermite curve; interval reads make constant-size copies after existing lazy chunk integration with no extra f or interpolation evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The integrator is the engine's one; at, interval and projectileAt share one memoized launch trajectory and its actual stored knots.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The memo is weakly keyed by projectile, so knots go with it. Interval endpoint states own fresh vectors and retain no trajectory or knot-array references.

## @evidence contracts/development/common.md#meaningful-documentation

States equations, sourced step rule, speed bound, chunks and held start; the returned interval reader documents launch-relative time and independent adjacent states.
