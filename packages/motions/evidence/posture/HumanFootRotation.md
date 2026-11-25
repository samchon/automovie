# src/posture/HumanFootRotation.ts#HumanFootRotation

## @evidence contracts/development/common.md#meaningful-documentation

States raw axes, angular conventions, roll default, order and fresh output; the prepare companion documents fixed heading/roll and its varying toes-up pitch reader.

## @evidence contracts/development/implementation.md#principled-implementation

Raw construction uses yaw-times-roll, negative pitch and final normalization. prepare retains exactly that unnormalized prefix, then applies each negative pitch and the same normalization; prepared-axis readers preserve the engine's exact degree/half-angle and component arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation owner serves the raw API, HumanFoot.preparePivot and a stance's toe-pad-turn reader; only each fixed-prefix reader retains its own prefix, while Quaternion owns all axis-angle and normalization formulas.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither path adds prefix normalization, changes the foot convention, or caches a completed quaternion. Every varying angle is evaluated in the original order without skipping, clamping, sampling or rounding it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three private canonical axes prepare direction/length once. Raw rotation stays constant work; prepare computes its fixed prefix once, then each pitch retains actual trigonometry, one product and normalization. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Private canonical axes remain unchanged and unexposed. Each prepare reader belongs to its fixed heading and roll and must be recreated when either changes; every pitch still returns a fresh normalized result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module retains three constant-size axis readers for its lifetime, and each rocker retains one private prefix/closure until released. Neither scope retains a body, target, queried output quaternion or queried-angle history.
