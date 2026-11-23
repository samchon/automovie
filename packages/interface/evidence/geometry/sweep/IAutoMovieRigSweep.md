# src/geometry/sweep/IAutoMovieRigSweep.ts#IAutoMovieRigSweep

## @evidence contracts/development/common.md#meaningful-documentation

Model-metre rest sweeps and aligned bone-buffer indices compile fixed frame and scale registrations for later poses. Omitted binding stays at rest; array lengths are checked, while valid bone indices and one/two station cardinality remain caller premises.

## @evidence contracts/development/design.md#principled-representation

Model-metre rest sweeps and aligned bone-buffer indices compile fixed frame and scale registrations for later poses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSweep owns the live sampling slots consumed by the surface network; authored sweep contracts remain shared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Omitted binding stays at rest; array lengths are checked, while valid bone indices and one/two station cardinality remain caller premises.

# src/geometry/sweep/IAutoMovieRigSweep.ts#IAutoMovieRigSweep.IProps

## @evidence contracts/development/design.md#principled-representation

Rest geometry uses model metres; binding numbers are bone-buffer indices rather than bone identities. Outer array alignment is checked, but index validity and station cardinality remain caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSurfaceNetwork resolves authored bone identities once and passes indexed bindings to rigAutoMovieSweep for repeated pose evaluation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The compiled number[][] station shape admits unsupported lengths despite the one/two-bone runtime premise; documentation exposes that gap rather than claiming tuple enforcement.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes retained indexed bindings from authored identities, states unbound behavior and explains volume-before-girth ordering.
