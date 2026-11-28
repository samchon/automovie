# src/geometry/IAutoMovieProfilePoint.ts#IAutoMovieProfilePoint

## @evidence contracts/development/common.md#meaningful-documentation

One local metre coordinate pair for authored construction profiles.

## @evidence contracts/development/design.md#principled-representation

Extrusion uses local XY, revolution reads radius and height, and sweep or loft uses the enclosing plane axes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The point carries two coordinates without a builder-specific label or placement. The consuming operation supplies the mapping and admission.

# src/geometry/IAutoMovieProfilePoint.ts#IAutoMovieProfilePoint.x

## @evidence contracts/development/common.md#meaningful-documentation

First finite profile coordinate in metres, interpreted as local X, section-axis distance or radius by the consumer.

# src/geometry/IAutoMovieProfilePoint.ts#IAutoMovieProfilePoint.y

## @evidence contracts/development/common.md#meaningful-documentation

Second finite profile coordinate in metres, interpreted as local Y, section-axis distance or height by the consumer.
