# src/geometry/IAutoMovieHeightSurface.ts#IAutoMovieHeightSurface

## @evidence contracts/development/common.md#meaningful-documentation

Structural height recipe shared by authored scene surfaces and built supports.

## @evidence contracts/development/design.md#principled-representation

The height reader evaluates an explicit rule first. Otherwise it projects the query onto the optional ramp axis or reads an anchor height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This bridge carries only vertical evaluation data. Footprint selection and walkability remain separate surface and space policies.

# src/geometry/IAutoMovieHeightSurface.ts#IAutoMovieHeightSurface.height

## @evidence contracts/development/common.md#meaningful-documentation

Optional general height rule. When supplied it takes precedence over the anchor and ramp fields.

# src/geometry/IAutoMovieHeightSurface.ts#IAutoMovieHeightSurface.anchor

## @evidence contracts/development/common.md#meaningful-documentation

First endpoint of the anchored spelling. Its Y is the flat datum when the optional ramp is absent. An absent anchor reads zero.

# src/geometry/IAutoMovieHeightSurface.ts#IAutoMovieHeightSurface.rampTo

## @evidence contracts/development/common.md#meaningful-documentation

Optional second endpoint of the anchor ramp. Null and omission both retain the anchor height.
