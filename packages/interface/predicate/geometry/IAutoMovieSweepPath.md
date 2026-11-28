# src/geometry/IAutoMovieSweepPath.ts#IAutoMovieSweepPath

## @evidence contracts/development/common.md#meaningful-documentation

A spine path's point, unit tangent and rotation-minimizing frame under chord-length parameterization.

## @evidence contracts/development/design.md#principled-representation

The sweep compiles centripetal cubic segments and carries its frame along the tangent by double reflection. It evaluates point, tangent and frame from the same path parameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The path exposes geometric evaluation and polygon length. Mutable packed transport buffers remain behind the callbacks.

# src/geometry/IAutoMovieSweepPath.ts#IAutoMovieSweepPath.length

## @evidence contracts/development/common.md#meaningful-documentation

Metre length of the input spine's control polygon when this path was created. It scales the normalized chord parameter.

# src/geometry/IAutoMovieSweepPath.ts#IAutoMovieSweepPath.point

## @evidence contracts/development/common.md#meaningful-documentation

Position on the compiled curve in model metres. Values below zero and above one evaluate at the corresponding endpoint.

# src/geometry/IAutoMovieSweepPath.ts#IAutoMovieSweepPath.tangent

## @evidence contracts/development/common.md#meaningful-documentation

Unit tangent in the direction of increasing path parameter. Endpoints use their admitted end derivative directions.

# src/geometry/IAutoMovieSweepPath.ts#IAutoMovieSweepPath.frame

## @evidence contracts/development/common.md#meaningful-documentation

Rotation-minimizing frame whose origin lies on the spine and whose normal follows the unit tangent. The transverse axes carry the starting direction along the path.
