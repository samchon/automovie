# src/environment/IAutoMovieWallMount.ts#IAutoMovieWallMount

## @evidence contracts/development/design.md#principled-representation

A staged node, a stable wall id and the wall's inner face as a world point and a world unit normal into the room, in metres. A plane needs exactly a point and a normal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The furnishing producer emits one per `wall` piece in `IAutoMovieEnvironmentContribution.mounts`; the environment support report judges a piece that does not rest against it as wall-borne.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record states the wall, not a verdict: whether the piece touches it is the support report's measurement.

## @evidence contracts/development/common.md#meaningful-documentation

States the node identity, the wall id format, the frame and the normal's direction.
