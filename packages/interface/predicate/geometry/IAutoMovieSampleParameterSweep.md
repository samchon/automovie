# src/geometry/IAutoMovieSampleParameterSweep.ts#IAutoMovieSampleParameterSweep.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Fixed local quadrature footprint and live frame and scale access for a parameter-correspondence sample writer.

## @evidence contracts/development/design.md#principled-representation

The writer retains up to nine weighted rest shape points, averages signed coordinates under per-station scale and stages finite world coordinates before output.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sample owns its compiled shape and slot addresses. The rig owns current frame and scale buffers.

# src/geometry/IAutoMovieSampleParameterSweep.ts#IAutoMovieSampleParameterSweep.IProps.surface

## @evidence contracts/development/common.md#meaningful-documentation

Compiled rest sweep whose unscaled shape returns chart metre X and Y. Registration samples and retains the needed shape coordinates.

# src/geometry/IAutoMovieSampleParameterSweep.ts#IAutoMovieSampleParameterSweep.IProps.u

## @evidence contracts/development/common.md#meaningful-documentation

Central normalized spine coordinate. Offset quadrature stations are clamped to [0, 1].

# src/geometry/IAutoMovieSampleParameterSweep.ts#IAutoMovieSampleParameterSweep.IProps.v

## @evidence contracts/development/common.md#meaningful-documentation

Central curve parameter in turns. The shape evaluator wraps around the section seam.

# src/geometry/IAutoMovieSampleParameterSweep.ts#IAutoMovieSampleParameterSweep.IProps.cell

## @evidence contracts/development/common.md#meaningful-documentation

Finite nonnegative spacings below and above u, then below and above v. Samples are at half-spacing offsets, with a zero pair taking the centre only.

# src/geometry/IAutoMovieSampleParameterSweep.ts#IAutoMovieSampleParameterSweep.IProps.frame

## @evidence contracts/development/common.md#meaningful-documentation

Scalar offset into the live frame buffer, addressing metre origin XYZ followed by the first and second axis vectors.

# src/geometry/IAutoMovieSampleParameterSweep.ts#IAutoMovieSampleParameterSweep.IProps.scale

## @evidence contracts/development/common.md#meaningful-documentation

Register each sampled spine coordinate and return its stable integer scale slot.

# src/geometry/IAutoMovieSampleParameterSweep.ts#IAutoMovieSampleParameterSweep.IProps.readScale

## @evidence contracts/development/common.md#meaningful-documentation

Read the current positive finite dimensionless scale for a previously registered slot. Invalid sampled products refuse before output writes.

# src/geometry/IAutoMovieSampleParameterSweep.ts#IAutoMovieSampleParameterSweep.IProps.frames

## @evidence contracts/development/common.md#meaningful-documentation

Return the rig's current borrowed frame array. The writer obtains it anew before applying the centre frame.
