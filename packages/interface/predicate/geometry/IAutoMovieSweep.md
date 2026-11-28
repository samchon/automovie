# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep

## @evidence contracts/development/common.md#meaningful-documentation

Authored closed section family carried along a spine in model metres. Stations set its shape, optional guides and features modify it, and the scale profile applies last.

## @evidence contracts/development/design.md#principled-representation

The compiler evaluates direction-correspondence section samples and applies guides on an angular grid, compact feature displacements and final scale in that order. Parameter correspondence instead pairs equal section parameters between stations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The authored sweep owns source geometry and its interpolation choices. Evaluation frames, caches and posed buffers belong to the compiled surface and its transport.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.spine

## @evidence contracts/development/common.md#meaningful-documentation

Authored path and starting plane direction in model metres. Its control polygon sets the normalized chord-length coordinate.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.stations

## @evidence contracts/development/common.md#meaningful-documentation

Key sections in strictly increasing finite station order, with at least one entry.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.correspondence

## @evidence contracts/development/common.md#meaningful-documentation

Direction pairs polar rays and requires star-shaped sections. Parameter pairs curve parameters and permits simple concave sections and corresponding holes. Omission selects direction.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.orientation

## @evidence contracts/development/common.md#meaningful-documentation

Transported planes follow the rotation-minimizing frame. Fixed planes carry the initial axes along the spine. Omission selects transported.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.guides

## @evidence contracts/development/common.md#meaningful-documentation

Optional silhouette radius profiles at distinct polar directions under direction correspondence.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.scale

## @evidence contracts/development/common.md#meaningful-documentation

Optional positive dimensionless scale profile held in chord-length coordinates and applied after section, guide and feature evaluation. Omission gives unit scale.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.features

## @evidence contracts/development/common.md#meaningful-documentation

Optional compact radius correction bands for direction correspondence. Bands are applied before scale and add where they overlap.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IStation

## @evidence contracts/development/common.md#meaningful-documentation

One authored cross-section, chord-length station label and optional plane rotation.

## @evidence contracts/development/design.md#principled-representation

Compilation reads the section according to the sweep correspondence mode and converts the supplied absolute quaternion into a turn relative to the carried frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A station owns the source section, its voids and its optional turn. Curve correspondence and plane transport are sweep-wide choices.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IStation.at

## @evidence contracts/development/common.md#meaningful-documentation

Finite normalized chord-length coordinate in [0, 1], increasing across stations.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IStation.section

## @evidence contracts/development/common.md#meaningful-documentation

Outer section in its local metre plane. Supply a star-shaped section for direction correspondence or a simple curve for parameter correspondence.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IStation.holes

## @evidence contracts/development/common.md#meaningful-documentation

Interior section loops in matching order at every station under parameter correspondence. Keep holes inside the outer loop and separate from each other.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IStation.rotation

## @evidence contracts/development/common.md#meaningful-documentation

Optional finite nonzero model-frame quaternion taking the three coordinate axes to the station plane basis. The compiled relative turn is interpolated along the carried frame.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IGuide

## @evidence contracts/development/common.md#meaningful-documentation

An authored polar direction and its radius profile along the sweep.

## @evidence contracts/development/design.md#principled-representation

The compiler wraps its angle, compiles the metre profile and uses corrective guide samples at grid directions. Angular reconstruction is linear between stored samples.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A guide constrains one direction across stations. The sweep owns its angular sampling and interpolation with other guides.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IGuide.angle

## @evidence contracts/development/common.md#meaningful-documentation

Finite counterclockwise angle in radians from the section's first axis. Guide directions must be distinct after wrapping.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IGuide.radii

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite metre radii at strictly increasing normalized spine coordinates from 0 through 1, with at least two knots.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IKnot

## @evidence contracts/development/common.md#meaningful-documentation

An authored chord-coordinate profile sample with a scalar radius or scale value.

## @evidence contracts/development/design.md#principled-representation

Guide and scale compilation interpolate from the same finite station coordinates. The profile consumer supplies the value unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The knot carries a coordinate and one scalar. Radius and scale records define interpretation by ownership.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IKnot.at

## @evidence contracts/development/common.md#meaningful-documentation

Finite normalized chord-length coordinate in [0, 1], ordered within its profile.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IKnot.value

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite authored profile value. A guide interprets it in metres and a scale profile interprets it as dimensionless.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IFeature

## @evidence contracts/development/common.md#meaningful-documentation

Radius target or signed offset along a course, fading across a compact band before final sweep scale.

## @evidence contracts/development/design.md#principled-representation

Compilation unwraps feature angles, spaces course knots using a cylindrical metric and searches locally from dense seeds. Overlapping features add their radial corrections.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A feature holds course samples and the falloff half-width. The compiled sweep owns base-radius evaluation and applies scale afterward.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IFeature.points

## @evidence contracts/development/common.md#meaningful-documentation

At least two authored course points. Choose absolute radius for every point or signed offset for every point.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IFeature.width

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite half-width in metres for the compact radial correction band.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IFeaturePoint

## @evidence contracts/development/common.md#meaningful-documentation

One chord and polar coordinate with an absolute target radius or a signed radial displacement.

## @evidence contracts/development/design.md#principled-representation

Feature compilation unwraps successive angles along the shorter direction and interpolates the chosen scalar on the course's knot parameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A course point selects one value mode. Band width and final scale belong to the enclosing feature and sweep.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IFeaturePoint.at

## @evidence contracts/development/common.md#meaningful-documentation

Finite normalized chord coordinate in [0, 1]. Feature order follows the authored course.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IFeaturePoint.angle

## @evidence contracts/development/common.md#meaningful-documentation

Finite counterclockwise angle in radians from the first section axis. Adjacent samples take the shorter wrap.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IFeaturePoint.radius

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite target radius in metres from the spine point, consistently chosen across the feature when present.

# src/geometry/IAutoMovieSweep.ts#IAutoMovieSweep.IFeaturePoint.offset

## @evidence contracts/development/common.md#meaningful-documentation

Finite signed radial change in metres before scale. Positive moves outward. Use the same value mode across all feature points.
