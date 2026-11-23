# src/physics/IAutoMovieProjectileState.ts#IAutoMovieProjectileState

## @evidence contracts/development/design.md#principled-representation

Separate position in metres from velocity in metres per second so projectileAt can return both results of the same time evaluation, and the body's rotation only where an attitude defines one; validity is admitted by that producer, not this structural type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two vectors and an optional rotation represent one instantaneous state without retaining launch data or trajectory history.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No collider, asset or fixture changes the representation; this state does not promise finite results when admitted finite inputs overflow arithmetic.

## @evidence contracts/development/common.md#meaningful-documentation

Members give world-space units and belong to the returned state; no acceleration or sample time is stored.
