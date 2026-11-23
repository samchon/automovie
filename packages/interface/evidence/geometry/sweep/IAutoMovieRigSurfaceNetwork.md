# src/geometry/sweep/IAutoMovieRigSurfaceNetwork.ts#IAutoMovieRigSurfaceNetwork

## @evidence contracts/development/common.md#meaningful-documentation

A rest metre network, sampling tier and optional bindings compile one topology reused across poses. Optional bindings require rest bones when nonempty; fit=false keeps samples as controls without changing ring pins or rest girth constraints.

## @evidence contracts/development/design.md#principled-representation

A rest metre network, sampling tier and optional bindings compile one topology reused across poses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSurfaceNetwork owns registration, fitting and pose updates while importing the canonical network and bone contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional bindings require rest bones when nonempty; fit=false keeps samples as controls without changing ring pins or rest girth constraints.

# src/geometry/sweep/IAutoMovieRigSurfaceNetwork.ts#IAutoMovieRigSurfaceNetwork.IProps

## @evidence contracts/development/design.md#principled-representation

Canonical model-metre geometry and named bone bindings preserve one topology at a tier. Compilation admits counts, component names, required rest bones, topology and rest-fit residual.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This is the shared compiler input used by sampleAutoMovieSurfaceNetwork for a rest cage and by posed consumers for retained rig evaluation; construction adds optional observation counts only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Binding categories are independent optional tables; unknown names and missing rest bones are rejected, while absent entries keep rest geometry and fit=false has a defined sample-as-control meaning.

## @evidence contracts/development/common.md#meaningful-documentation

Documents retained geometry, defaults, binding categories, admission ownership, sampling/filtering semantics and observation timing.
