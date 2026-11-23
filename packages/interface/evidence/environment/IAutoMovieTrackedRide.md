# src/environment/IAutoMovieTrackedRide.ts#IAutoMovieTrackedRide

## @evidence contracts/development/design.md#principled-representation

Several carriers can use the same spatial course with independent authored schedules. Each schedule interpolates distance by seconds and repeated distances hold position.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One model supplies the carrier, its boarding threshold and its named rider affordances, with optional dimensions only for the static track and platforms.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The scenic producer refuses incompatible docking and malformed timing. It does not derive operating speeds, certify accessibility or model restraint dynamics.

## @evidence contracts/development/common.md#meaningful-documentation

Explains the course and clock, supported motion and what remains outside the scenic record.

# src/environment/IAutoMovieTrackedRide.ts#IAutoMovieTrackedRide.IMark

## @evidence contracts/development/design.md#principled-representation

A separate distance from time permits a pause without zeroing the curve's tangent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two scalars describe a timed station; the spatial course owns height and orientation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The staging producer rejects nonfinite or out-of-order marks and distances outside the course.

## @evidence contracts/development/common.md#meaningful-documentation

Defines both units and the interpretation of equal or decreasing adjacent distances.
