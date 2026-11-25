# src/motion/IAutoMovieIntegrateAirborneRotation.ts#IAutoMovieIntegrateAirborneRotation.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Separates world angular momentum from root-frame shape history and names time, sensitivity and tolerance units.

## @evidence contracts/development/design.md#principled-representation

The trajectory integrator admits finite ordered times, positive steps and tolerances; callers supply unit q0 and finite nonsingular inertia histories.

## @evidence contracts/development/design.md#minimal-and-owned-surface

integrateAirborneRotation consumes this request synchronously and returns readers over the integrated trajectory.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Variation directions reuse world momentum vectors, while returned tangents explicitly use body-frame radians per direction unit.

# src/motion/IAutoMovieIntegrateAirborneRotation.ts#IAutoMovieIntegrateAirborneRotation.IHistory

## @evidence contracts/development/common.md#meaningful-documentation

Explains root-frame samples and exact-time cache ownership in the history factory.

## @evidence contracts/development/design.md#principled-representation

A pure time reader returns composite inertia and relative momentum on the same clock as flight integration; factory samples are shared cached records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

integrateAirborneRotation.history retains the shape reader and sampled records for the returned reader's lifetime; integration invokes it during planning.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The callback carries physical mass data without a rig implementation handle or asynchronous lifecycle.

# src/motion/IAutoMovieIntegrateAirborneRotation.ts#IAutoMovieIntegrateAirborneRotation.IInstant

## @evidence contracts/development/common.md#meaningful-documentation

Defines centre-of-mass inertia and segment-relative momentum in the root frame.

## @evidence contracts/development/design.md#principled-representation

Principal moments have kg m-squared units and relative angular momentum kg m-squared/second; callers provide positive nonsingular moments.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Airborne integration rate applies the inverse principal tensor to carried momentum minus this relative momentum.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Inertia reuses the existing principal-frame contract rather than duplicating an eigenframe representation.

# src/motion/IAutoMovieIntegrateAirborneRotation.ts#IAutoMovieIntegrateAirborneRotation.IFlight

## @evidence contracts/development/common.md#meaningful-documentation

Describes the retained orientation and sensitivity readers with held endpoints and knot telemetry.

## @evidence contracts/development/design.md#principled-representation

Flight times share the history clock; orientations are world quaternions and sensitivity vectors are instantaneous-body-frame rotation tangents.

## @evidence contracts/development/design.md#minimal-and-owned-surface

integrateAirborneRotation returns these readers over its completed trajectory; callers release the flight to release retained integration data.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No direction requested yields an empty tangent list rather than an invented derivative vector.

# src/motion/IAutoMovieIntegrateAirborneRotation.ts#IAutoMovieIntegrateAirborneRotation.IHistorySpan

## @evidence contracts/development/common.md#meaningful-documentation

Explains the finite-difference stencil's supported interval and lack of clamping for the requested inertia sample.

## @evidence contracts/development/design.md#principled-representation

from and to are seconds on the shape clock with finite from < to supplied by the caller; history does not admit this interval separately.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The history factory uses the span to keep derivative samples inside the shape's supported flight interval.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The interval restricts sampling and contains no motion callback or alternate time origin.
