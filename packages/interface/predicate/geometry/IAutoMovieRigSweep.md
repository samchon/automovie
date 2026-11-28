# src/geometry/IAutoMovieRigSweep.ts#IAutoMovieRigSweep.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Rest sweep, optional compiled bone indices and volume-compensation choice for a reusable rig.

## @evidence contracts/development/design.md#principled-representation

The rig compiles the rest sweep and updates bound spine and section transforms in reusable buffers. Joint volume and girth correction act on registered scales in that order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input binds authored geometry to a pose buffer namespace. The rig owns positional slots, compiled shape samples and numerical state.

# src/geometry/IAutoMovieRigSweep.ts#IAutoMovieRigSweep.IProps.sweep

## @evidence contracts/development/common.md#meaningful-documentation

Compiled rig's borrowed rest sweep in model metres. Keep authored geometry stable while compiled slots use it.

# src/geometry/IAutoMovieRigSweep.ts#IAutoMovieRigSweep.IProps.binding

## @evidence contracts/development/common.md#meaningful-documentation

Optional mapping into the later bone buffer. Omission leaves the sweep at rest.

# src/geometry/IAutoMovieRigSweep.ts#IAutoMovieRigSweep.IProps.preserveVolume

## @evidence contracts/development/common.md#meaningful-documentation

Enable joint volume settlement for bound two-bone stations. Girth multipliers are applied afterward.

# src/geometry/IAutoMovieRigSweep.ts#IAutoMovieRigSweep.IPropsBinding

## @evidence contracts/development/common.md#meaningful-documentation

Compiled bone-buffer assignments aligned with the sweep's rest data.

## @evidence contracts/development/design.md#principled-representation

Pose updates read one bone index per spine point and one or two per station. Two station indices select the spherical midpoint of their rotations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mapping holds buffer order only. Authored humanoid identities and actual pose transforms are owned separately.

# src/geometry/IAutoMovieRigSweep.ts#IAutoMovieRigSweep.IPropsBinding.points

## @evidence contracts/development/common.md#meaningful-documentation

One nonnegative integer bone-buffer index per spine control in spine order. This retained array must keep the same identities.

# src/geometry/IAutoMovieRigSweep.ts#IAutoMovieRigSweep.IPropsBinding.stations

## @evidence contracts/development/common.md#meaningful-documentation

One retained list of one or two bone-buffer indices per station. Supply indices valid in each later pose buffer.
