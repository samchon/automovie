# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IRay

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes original phase from reflected end-piece evaluation.

## @evidence contracts/development/design.md#principled-representation

ViewConic.read selects a quarter and piece, reverses the reflected-end orientation when used and keeps the native ray location with the original angular descriptors.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result extends the generic conic ray rather than evaluating a second numeric inverse for station derivatives.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IRay.quarter

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the index range in the cyclic source.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IRay.kind

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains the three possible native piece owners.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IRay.angle

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the caller-facing quarter angle.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IRay.distance

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains how reflected evaluation changes the sampled angle.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IQuarter

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the base geometry, controlling scalar and optional corrections.

## @evidence contracts/development/design.md#principled-representation

ConicPreparation builds each quarter from neighbouring support values and its shoulder. It establishes per-end geometric curvature and prepares patches only where the endpoint source requires them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The layout retains the native quadratic, correction controls and guide observations. Optional numeric partitions belong to the inspecting preparation.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IQuarter.extents

## @evidence contracts/development/common.md#meaningful-documentation

The comment fixes the controls' units and correspondence.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IQuarter.shoulder

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the scalar and its admissible range.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IQuarter.start

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains the source owner at the first endpoint.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IQuarter.end

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains the reflected source at the final endpoint.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IQuarter.parameters

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the value of this field by preparation capability.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IQuarter.guides

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives order, derivative units and the guide boundary behavior.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.IQuarter.curvatures

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes assigned geometric values and auxiliary derivatives at ties.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.ICurve

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the two observable preparation states.

## @evidence contracts/development/design.md#principled-representation

ConicPreparation builds quarters with admitted edge data, or returns no quarters and the original failure. ViewConic uses the success state to choose a native source ray.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One source representation supports numeric and derivative-aware preparation through the generic scalar type.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.ICurve.quarters

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies order and the failure case.

# src/construction/IAutoMovieViewConic.ts#IAutoMovieViewConic.ICurve.failure

## @evidence contracts/development/common.md#meaningful-documentation

The comment names the explicit preparation status.
