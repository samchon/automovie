# src/geometry/IAutoMovieSweepSpine.ts#IAutoMovieSweepSpine.tangents

## @evidence contracts/development/common.md#meaningful-documentation

The option gives independent endpoint directions, default spline behavior and preservation of endpoint speed.

# src/geometry/IAutoMovieSweepSpine.ts#IAutoMovieSweepSpine.IEndpointTangents

## @evidence contracts/development/common.md#meaningful-documentation

The record presents separate optional nonzero directions for the first and last point, with omission retaining the spline direction.

## @evidence contracts/development/design.md#principled-representation

The spine loader copies supplied tangent components to the matching transport endpoint. Transport normalizes direction at an endpoint and applies the spline's existing speed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The overrides represent endpoint directions alone. The authored points, section normal and compiled frames belong to the spine and transport.

# src/geometry/IAutoMovieSweepSpine.ts#IAutoMovieSweepSpine.IEndpointTangents.start

## @evidence contracts/development/common.md#meaningful-documentation

The optional finite nonzero start direction overrides the spline direction while retaining its original speed.

# src/geometry/IAutoMovieSweepSpine.ts#IAutoMovieSweepSpine.IEndpointTangents.end

## @evidence contracts/development/common.md#meaningful-documentation

The optional finite nonzero end direction overrides the spline direction while retaining its original speed.
