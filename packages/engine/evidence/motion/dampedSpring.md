# src/motion/dampedSpring.ts#dampedSpring

## @evidence contracts/development/implementation.md#principled-implementation

Semi-implicit Euler updates velocity from the unit-mass damped restoring acceleration then advances value using that new velocity; the caller's timestep controls numerical stability and finite inputs alone do not preclude overflow.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A pure scalar step consumes caller-carried momentum and coefficients and returns the next state, keeping scheduling and per-axis application outside the integrator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid finite-domain or coefficient/timestep inputs throw; no timestep subdivision, joint clamp or hidden state masks an unstable caller-selected step.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the two update equations, scalar/angle use, input domain, carry-forward velocity and numerical stability/overflow limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each step performs fixed scalar arithmetic and admission checks with constant auxiliary storage, independent of the number of prior frames.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No trajectory cache exists: the caller explicitly feeds the prior value and velocity along with the current target and timestep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned value/velocity object survives a step; the integrator owns no retained history, timer or physics handle.
