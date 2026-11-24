# src/posture/HumanPathParameterization.ts#HumanPathParameterization.IPath

## @evidence contracts/development/common.md#meaningful-documentation

gridpoints: the path parameter's grid. first, second: each coordinate's derivatives by s at each gridpoint.

## @evidence contracts/development/design.md#principled-representation

What TOPP-RA's constraints read of its `GeometricPath` (`eval_single(s, 1)`, `eval_single(s, 2)` at each gridpoint, toppra at commit 8a2a9252e42089f1082d8d5d69b9852f32d0b338, MIT, Copyright (c) 2017 Hung Pham). The premise is the paper's: the path is fixed (Pham and Pham 2018, section II).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: test/src/features/geometry/test_geometry_path_parameterization.ts (the closed-form cases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller reads its own path; nothing is resampled here.

# src/posture/HumanPathParameterization.ts#HumanPathParameterization.IVelocity

## @evidence contracts/development/common.md#meaningful-documentation

first: each quantity's derivative by s. lower, upper: its rate limits at each gridpoint.

## @evidence contracts/development/design.md#principled-representation

TOPP-RA's `LinearJointVelocity`, with the limits read at each gridpoint as its `computeVelocityLimits(gridpoints[i])` reads them. A quantity is any one whose rate is first · ṡ.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: test/src/features/geometry/test_geometry_path_parameterization.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The limits are the caller's; none is set here.

# src/posture/HumanPathParameterization.ts#HumanPathParameterization.IAcceleration

## @evidence contracts/development/common.md#meaningful-documentation

lower, upper: each coordinate's acceleration limits.

## @evidence contracts/development/design.md#principled-representation

TOPP-RA's `LinearJointAcceleration`: `q̈ = q' u + q'' x` bounded per coordinate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: test/src/features/geometry/test_geometry_path_parameterization.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The limits are the caller's; none is set here.

# src/posture/HumanPathParameterization.ts#HumanPathParameterization.IProblem

## @evidence contracts/development/common.md#meaningful-documentation

The path, its two kinds of constraint and the path velocities at the ends.

## @evidence contracts/development/design.md#principled-representation

TOPP-RA's `PathParametrizationAlgorithm` inputs: constraints, path, `vel_start`, `vel_end`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: test/src/features/geometry/test_geometry_path_parameterization.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default is supplied for any member.

# src/posture/HumanPathParameterization.ts#HumanPathParameterization.Status

## @evidence contracts/development/common.md#meaningful-documentation

Names the three ends.

## @evidence contracts/development/design.md#principled-representation

TOPP-RA's `ReturnCode` values `OK`, `ERR_FAIL_CONTROLLABLE` and `ERR_FAIL_FORWARD_PASS`, the ones computePathParametrization returns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: test/src/features/geometry/test_geometry_path_parameterization.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only the codes the ported passes return.

# src/posture/HumanPathParameterization.ts#HumanPathParameterization.IResult

## @evidence contracts/development/common.md#meaningful-documentation

status, the squared path velocity at each gridpoint, and the controllable sets.

## @evidence contracts/development/design.md#principled-representation

TOPP-RA's `ParametrizationData`: `parametrization` and `controllable_sets`, with the return code.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: test/src/features/geometry/test_geometry_path_parameterization.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing derived is stored.

# src/posture/HumanPathParameterization.ts#HumanPathParameterization.ITimed

## @evidence contracts/development/common.md#meaningful-documentation

times, velocities at each gridpoint; accelerations over each interval.

## @evidence contracts/development/design.md#principled-representation

TOPP-RA's `ConstAccel` members `m_ts`, `m_vs`, `m_us`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: test/src/features/geometry/test_geometry_path_parameterization.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing beyond the source's members.

# src/posture/HumanPathParameterization.ts#HumanPathParameterization.parametrize

## @evidence contracts/development/common.md#meaningful-documentation

States the two passes, the result and the infeasible velocity constraint it throws on.

## @evidence contracts/development/implementation.md#principled-implementation

Ported line for line from toppra at commit 8a2a9252e42089f1082d8d5d69b9852f32d0b338 (MIT, Copyright (c) 2017 Hung Pham):
- The stages come from `Seidel::initialize`. Each acceleration constraint gives the rows `F (a u + b x + c) <= g` of `LinearJointAcceleration`, interpolated to the next gridpoint by `collocationToInterpolate`. Each velocity constraint gives the bound on x of `LinearJointVelocity::computeParams_impl`. Every stage is then presolved.
- `computeControllableSets` runs backward from `vel_end²`, with the initial bound [0, 100] (`m_initXBound`).
- `TOPPRA::computeForwardPass` maximises each next x, uses the controllable set's upper control at a degenerate vertex, and lands a step on the upper bound within 4 epsilon of its rounding.

Pham and Pham 2018 (IEEE T-RO 34(3):645), sections III to V.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The public pass reads as the source's two passes; the stages' preparation and the stage solve are private functions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every constant is the source's: the objectives' 1e-9, the initial bound 100, `m_maxsd` 1e8, the forward pass's 4 epsilon. A failed stage returns the source's code; nothing is retried.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two stage programs per gridpoint backward and one forward, each a two-variable Seidel program: linear in the gridpoints.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The stages are prepared once per call and serve every pass; only the two next-stage rows change per solve, as in the source.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The stages live for the call; the result holds only the parameterisation and the sets.

# src/posture/HumanPathParameterization.ts#HumanPathParameterization.timed

## @evidence contracts/development/common.md#meaningful-documentation

States the gridpoints, the parameterisation and the time map returned.

## @evidence contracts/development/implementation.md#principled-implementation

`ConstAccel::process_internals` of toppra's const_accel.cpp: ṡ = √x, `u_i = (ṡ_{i+1}² - ṡ_i²) / (2 Δs)`, `t_{i+1} = t_i + 2 Δs / (ṡ_{i+1} + ṡ_i)`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the intervals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: a closed form per interval.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(gridpoints).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only the returned arrays.
