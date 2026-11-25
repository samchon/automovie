# src/everyday/HumanBreath.ts#HumanBreath.layer

## @evidence contracts/development/common.md#meaningful-documentation

States the named additive layer, optional rate/exertion and film-second evaluation; the namespace documents physiological timing and provisional angles.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates `state` at each film second, with the resting rate and the initial phase drawn from the performer's counter-based streams and the sigh drawn per cycle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two readers keep the rate and the phase drawn from the last stream seed seen; each apply asks the context for its streams, evaluates `state` and adds the volume through `add`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A stored rate or phase is reused only for the very seed it was drawn from. Limitation: the layer API offers no per-performer start, so the draws are keyed by seed instead of being made once when the layer meets its performer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each rate or phase draw runs once while its stream seed stays the same; apply costs `state`'s O(B^3) in B exertion bouts plus fixed joint work. A changed seed redraws without growing any store.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A stream's seed and index fix its values, so a draw for the same seed is the same draw; time, exertion, volume and sighs are evaluated at every call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The layer holds its options and two last-seed records until it is released.

# src/everyday/HumanBreath.ts#HumanBreath.isNative

## @evidence contracts/development/common.md#meaningful-documentation

Defines the native layer identity used to keep breath in the displayed pose.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the producer's weak layer identity and checks the callable still owns its contribution.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One weak lookup and one callable comparison, with blend ownership checked for native records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A layer's name or channels cannot establish provenance. A replaced apply or effective blend retains caller-authored behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time and no allocation beyond the property descriptor for a native layer.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each query checks the effective layer instead of caching a result across consumer changes.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The check retains no data and returns a boolean.
