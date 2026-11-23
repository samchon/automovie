# src/validation/detectBodyCollision.ts#detectBodyCollision

## @evidence contracts/development/implementation.md#principled-implementation

Finite positive sample rate and canonical reachable-capsule admission precede endpoint-inclusive pose sampling; every capsule pair uses shared closest-segment distance and strict summed-radius penetration. An unsuppressed overlap requests a response only after both actors declare a body, finite positive mass and finite restitution in [0,1]; every missing or invalid response quantity is reported while geometric contacts remain available.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pose/FK, distance and impact-response owners remain shared, while this detector owns sampled cross-body population and warning/event correspondence; runtime repository consumers are portable tests rather than an installed film collision host.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither absent bodies nor missing mass/restitution receive guessed values. PhysicsIntent and non-contact paths request no physical response, while malformed capsules fail before sampling. The existing adviser still uses its documented hardness/penetrability heuristic and geometric fallback normal. Sampling is not continuous collision proof; final truncated-interval velocity still uses nominal rate, and derived numeric failures can propagate.

## @evidence contracts/development/common.md#meaningful-documentation

States sample-clock scope, shortest duration, response-only body/mass/coefficient admission, retained contacts on refusal, strict penetration, deepest tie order and uncorrected final-interval velocity approximation.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F frames, J resolved bones and A/B capsules, pose maps cost O(F*J), pair checks O(F*A*B), and deepest-contact sorting O(E log E) for E penetrations; storage is O(F*J+E).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each actor pose resolves once per frame and its map serves all capsule pairs; one retained penetration list supplies events, warnings and deepest response without a cross-call motion cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local pose maps and penetration rows are discarded; fresh events, validation and response transfer to the caller without retaining sampled poses or owning a physics/render task.
