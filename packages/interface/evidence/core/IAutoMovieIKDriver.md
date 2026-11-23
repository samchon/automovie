# src/core/IAutoMovieIKDriver.ts#IAutoMovieIKDriver

## @evidence contracts/development/design.md#principled-representation `twoBone` places the middle joint by the law of cosines over the two bone lengths and the reach clamped to `[|l1 - l2| + 1e-5, l1 + l2 - 1e-5]`; `ccd` sweeps joints tip to root rotating the tip toward the goal, and `fabrik` runs backward and forward passes at fixed segment lengths, both stopping at the iteration cap or within `1e-6` m.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One driver type selects among three solvers by a tag, sharing the chain, goal, influence and the rotation write-back, with the pole and iteration fields read only by the solvers that need them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Iterative solves use positive safe-integer budgets, not a wall-clock cutoff, and unsupported twoBone chain lengths are deferred rather than switched to another solver. Zero-length segments refuse, but tiny positive lengths can invert the existing 1e-5 analytic reach shell without a separate shell-admission check.

## @evidence contracts/development/common.md#meaningful-documentation

States the pass, what each solver accepts and ignores, the reach clamp, what is preserved and blended, the deferral case, the default and stopping rule for iterations, and every throw.
