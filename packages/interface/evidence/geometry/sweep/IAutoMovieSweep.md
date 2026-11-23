# src/geometry/sweep/IAutoMovieSweep.ts#IAutoMovieSweep

## @evidence contracts/development/design.md#principled-representation

A generalized cylinder whose section radii are interpolated per direction with a C2 spline and sampled overshoot policy, as sweep-based modelling interpolates key sections, with silhouette guides and compact feature fields as lofting controls; the Gordon correction is sampled on the angular grid.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record holds the spine, stations, guides and features of one surface; evaluation and every constraint's rule live in `compileAutoMovieSweep`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Stations, guides and features are applied in a fixed order with stated rules; nothing is tuned per consumer.

## @evidence contracts/development/common.md#meaningful-documentation

States the two parameters, the four evaluation layers and what each guarantees, the frame, and the unit.

# src/geometry/sweep/IAutoMovieSweep.ts#IAutoMovieSweep.IStation

## @evidence contracts/development/design.md#principled-representation

A key section placed at a spine parameter with an optional plane rotation, the key-section form of sweep-based modelling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Parameter, section, holes and rotation in one record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unordered or out-of-range stations are refused by the compiler.

## @evidence contracts/development/common.md#meaningful-documentation

States the parameter, the section plane, holes and the rotation rule.

# src/geometry/sweep/IAutoMovieSweep.ts#IAutoMovieSweep.IGuide

## @evidence contracts/development/design.md#principled-representation

A silhouette curve at one direction, joined to the stations as a Gordon surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A direction and a profile.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Guides sharing a direction are refused.

## @evidence contracts/development/common.md#meaningful-documentation

States the Gordon role and the silhouette reading.

# src/geometry/sweep/IAutoMovieSweep.ts#IAutoMovieSweep.IKnot

## @evidence contracts/development/design.md#principled-representation

One sample of a spline profile along the spine.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Parameter and value.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values must be positive.

## @evidence contracts/development/common.md#meaningful-documentation

States both fields.

# src/geometry/sweep/IAutoMovieSweep.ts#IAutoMovieSweep.IFeature

## @evidence contracts/development/design.md#principled-representation

A pass-through constraint along a smooth curve in the domain, applied as a compactly supported C2 bump.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Points and a band width.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Overlapping bands add; the limitation is stated on the compiler.

## @evidence contracts/development/common.md#meaningful-documentation

States the curve, its values, the falloff and the order of layers.

# src/geometry/sweep/IAutoMovieSweep.ts#IAutoMovieSweep.IFeaturePoint

## @evidence contracts/development/design.md#principled-representation

One point a feature curve passes through, with its radius or offset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Domain point plus one of two values.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Mixing radius and offset in one feature is refused.

## @evidence contracts/development/common.md#meaningful-documentation

States each field and the shorter-way rule.
