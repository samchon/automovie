# src/physics/IAutoMovieProjectileFlight.ts#IAutoMovieProjectileFlight

## @evidence contracts/development/common.md#meaningful-documentation

Documents launch-relative sampling, retained integration chunks and the meaning of the speed bound.

## @evidence contracts/development/design.md#principled-representation

step is seconds and fastest is m/s, with Infinity when nonzero gravity acts without drag and no finite whole-flight bound exists.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectileDragFlight owns the integrator and its cached chunks; projectileFirstContact consumes interval/at and derives a finite search-span bound when fastest is infinite.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reader is cached by projectile identity, so input data must stay unchanged; sampling does not expose or transfer the integration buffers.
