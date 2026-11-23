# src/production/IAutoMovieCompileLaunch.ts#IAutoMovieCompileLaunch.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Compose the `launch` verb's engine primitives into one result: the projectile's flight and the struck target's reaction, timed to the engine-computed hit rather than a number the model had to guess. Member documentation states the supplied records, units and absence meanings used by compileLaunch.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The target callback is an explicit sampling dependency, not a pre-baked answer; numeric and reference validity remain the compiler's admission responsibility.

## @evidence contracts/development/design.md#principled-representation

Launch inputs preserve the authored world-space trajectory, shot-local clock and optional moving-target lookup; compileLaunch resolves the release and flight from that context.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieCompileLaunch.IProps, used by compileLaunch. Its action, origin, target, targetNode, targetAt, gravity, arc, fps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
