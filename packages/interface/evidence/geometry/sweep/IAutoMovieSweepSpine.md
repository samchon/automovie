# src/geometry/sweep/IAutoMovieSweepSpine.ts#IAutoMovieSweepSpine

## @evidence contracts/development/design.md#principled-representation

A centre curve through ordered points with chord-length knots, as sweep-based modelling interpolates key-section centres, through a centripetal Catmull-Rom spline so the path has no cusp at a bent joint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Points plus one starting direction are the least a frame-transported sweep needs; twist belongs to the stations' rotations, not to the spine; optional end directions are the one constraint a curve meeting a surface adds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No point is smoothed away or added; a path that doubles back on itself is refused where its tangent vanishes.

## @evidence contracts/development/common.md#meaningful-documentation

States interpolation, parameterization, the frame transport, and the meaning, unit and constraints of each field.
