# src/validation/IAutoMovieBodyCollisionResult.ts#IAutoMovieBodyCollisionResult

## @evidence contracts/development/design.md#principled-representation

Capsule distances below summed radii create sampled penetration events; malformed sampling/topology/proxies return errors, while valid overlaps warn unless physicsIntent suppresses warnings. A requested response additionally requires both authored bodies and their valid mass/restitution; refusal preserves observed events.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One result packages the check's observations and deepest-penetration suggestion without applying that suggestion to either actor.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Events are sampled proxy contacts rather than continuous collision proof, and suppressed warnings do not remove contact events; response is null when absent, explicitly suppressed or missing its physical admission facts, with no guessed mass or coefficient.

## @evidence contracts/development/common.md#meaningful-documentation

Documents validation severity, shot-clock event population and optional response ownership rather than claiming a delivered reaction host.
