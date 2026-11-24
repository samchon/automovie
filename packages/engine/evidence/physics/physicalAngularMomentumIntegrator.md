# src/physics/physicalAngularMomentumIntegrator.ts#physicalAngularMomentumIntegrator

## @evidence contracts/development/common.md#meaningful-documentation

States when the body is stuck and stays stuck, the integral's law with its leak, clamp and gain cut, why the reference's glitch window never acts, and the not-a-number behaviour, with units.

## @evidence contracts/development/implementation.md#principled-implementation

A line-by-line port of IHMC's `AngularMomentumIntegrator.update` (develop, l.55-88) with Zulu's gains. The reference's `GlitchFilteredYoBoolean` is only ever `set` (l.52, l.60, l.67), which clears its count and takes the value at once (`GlitchFilteredYoBoolean.set` l.50-57), so its window of (int) (0.03 / dt) never acts and the flag is a boolean. A not-a-number error propagates into the integral while stuck, as the reference's arithmetic does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function in the reference's order; the gains merge Zulu's defaults with the caller's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-10 gain cut is the reference's (l.81). There are no casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the caller owns the returned state.

# src/physics/physicalAngularMomentumIntegrator.ts#physicalAngularMomentumIntegrator.IState

## @evidence contracts/development/common.md#meaningful-documentation

Documents the flag and the integral with their reference names and units.

## @evidence contracts/development/design.md#principled-representation

The reference's `isICPStuck` and `feedbackCMPIntegral` in the caller's horizontal frame, metres, as plain data; a not-a-number integral is a reference state the type allows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the integrator and kept inside `physicalIcpController.IState`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalAngularMomentumIntegrator.ts#physicalAngularMomentumIntegrator.IGains

## @evidence contracts/development/common.md#meaningful-documentation

Documents each gain with its units.

## @evidence contracts/development/design.md#principled-representation

The integrator's switch and threshold from `ICPControllerParameters` and its gain, leak ratio and maximum from `ICPControlGains`/`IntegratorGains`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the integrator; `physicalIcpController` passes its parameters through it, and `ZULU` gives the defaults.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalAngularMomentumIntegrator.ts#physicalAngularMomentumIntegrator.create

## @evidence contracts/development/common.md#meaningful-documentation

States the new state.

## @evidence contracts/development/implementation.md#principled-implementation

The constructor's state: a flag set false (`GlitchFilteredYoBoolean` l.47) and a zero integral.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A fresh value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalAngularMomentumIntegrator.ts#physicalAngularMomentumIntegrator.reset

## @evidence contracts/development/common.md#meaningful-documentation

States that the flag clears and the integral stays.

## @evidence contracts/development/implementation.md#principled-implementation

`AngularMomentumIntegrator.reset` (l.50-53), which sets only the flag.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A fresh value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
