# src/physics/IAutoMoviePhysicalSimulationInput.ts#IAutoMoviePhysicalSimulationInput.ITarget

## @evidence contracts/development/common.md#meaningful-documentation

Authored world poses and causal ownership/control policy for one cache sample.

## @evidence contracts/development/design.md#principled-representation

Sample k supplies continuous poses at k/rate seconds but its discrete policy owns the preceding interval [(k-1)/rate,k/rate); sample zero initializes ownership.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMoviePhysicalSimulation clones targets before admission and identity hashing; physical target fitting may derive different motor goals without rewriting these authored samples.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

admitPhysicalTargets requires complete segment coverage, finite positions, unit quaternions and strengths in [0,1]. dynamicSegments must explicitly include descendants of every selected parent.

# src/physics/IAutoMoviePhysicalSimulationInput.ts#IAutoMoviePhysicalSimulationInput.IBody

## @evidence contracts/development/common.md#meaningful-documentation

One scene body's physical profile, authored samples and bounded controller policy.

## @evidence contracts/development/design.md#principled-representation

targets includes zero and all duration times rate endpoints; translational gains use N/m and N s/m, angular gains N m/rad and N m s/rad.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Simulation compute clones this descriptor, supplies documented defaults and admits it before allocating native objects; optional controllers add only the declared physical policy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

admitPhysicalBody, admitPhysicalReleasePolicy and admitPhysicalTargets own cross-field validation. Internal actuation requires supportTracking or balance; omitted optional controllers are inactive.

# src/physics/IAutoMoviePhysicalSimulationInput.ts#IAutoMoviePhysicalSimulationInput.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Complete sampled scene and explicit work budgets for deterministic fixed-step simulation.

## @evidence contracts/development/design.md#principled-representation

rate is cached intervals/s; substeps multiplies it into native ticks/s. Positive duration times rate is an exact safe integer bounded by maximumSteps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMoviePhysicalSimulation owns a clone with defaults applied; settings, profiles, targets and impulses participate in content identity and checkpoint compatibility.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

admitPhysicalSimulation checks finite scalars, floor dimensions, population and clock budgets before world allocation. Empty arrays are valid where no body or impulse is needed; invalid references or budgets throw.

# src/physics/IAutoMoviePhysicalSimulationInput.ts#IAutoMoviePhysicalSimulationInput.IDiagnostic

## @evidence contracts/development/common.md#meaningful-documentation

A joint tracking error and requested-torque saturation diagnostic at one output instant.

## @evidence contracts/development/design.md#principled-representation

seconds uses local film time and error is a shortest-arc norm in radians; saturated names joint-frame coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

trackPhysicalWorld records material pre-solve demands, while trackingAt allocates diagnostics against the original authored target and borrows saturation history by completed step.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No diagnostic claims achieved torque or contact load; recovery-fitted targets can differ from authored targets. Stored rows omit unsaturated negligible errors.
