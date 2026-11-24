# src/geometry/curve/measureAutoMovieCurveLength64.ts#measureAutoMovieCurveLength64

## @evidence contracts/development/common.md#meaningful-documentation

States derivative and domain units, pure-callback ownership, piece-chart independence, finite endpoint admission and the observed result. The parameter schedule reports one fixed piece's endpoint and interior requests in the original parameter units and numerical order.

## @evidence contracts/development/implementation.md#principled-implementation

Integrates the norm of the original world derivative over each actual finite parameter domain. The measure uses the eight-point Gauss–Legendre nodes and weights and compares K and 2K panels. The parameter schedule enumerates those same addresses after domain and panel admission.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The public owner checks the source domain. The shared quadrature owns the address order and integration. Original curve producers supply their derivatives from that same domain.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses finite closed-domain derivatives and representable nodes and contributions. Finite zero speed is permitted and callback failures propagate. The measured panel difference remains an observation. Domain and subdivision bounds apply to both paths, while derivative and contribution checks belong to the measurement.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N pieces and K subdivisions the measurement reads at most 24 N K interior derivatives plus 2 N endpoints, with K bounded at 1024. The parameter schedule emits 2 + 24K values in one traversal for the single supplied piece. Quadrature scratch is constant-size apart from the output schedule and the caller's callback work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The measurement and the parameter schedule use the same module-constant node and weight tables. An original source can prepare the actual requested stations. The coarse and fine observations still evaluate their own numerical contributions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The measure borrows callbacks synchronously and returns two scalars. The parameter schedule retains only its plain address array. Both share the fixed sixteen quadrature constants.
