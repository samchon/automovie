# src/production/IAutoMovieCompiledPopulationRepresentation.ts#IAutoMovieCompiledPopulationRepresentation.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Explains applicable tiers, default tier, radius units and fallback, and caller ownership of measurements and admission.

## @evidence contracts/development/design.md#principled-representation

Model-group IDs join tiers, model records and root-centred metre estimates. Numeric validity and geometric enclosure remain host responsibilities because the compiler only reads estimates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both compact population compilers supply the same four inputs; hero filtering stays with the formation caller rather than adding a population-kind switch.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing geometry is represented by explicit digest and radius fallback policies, not claimed as measured enclosure; no renderer handles or model catalogue is embedded.

# src/production/IAutoMovieCompiledPopulationRepresentation.ts#IAutoMovieCompiledPopulationRepresentation.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents output ownership, tier ordering, identity binding and the difference between radius estimates and an enclosure proof.

## @evidence contracts/development/design.md#principled-representation

Each tier keeps its authored distance policy and adds model digest/runtime identity; projectionRadius is a model-space metre estimate, not an exact population bound.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Materializers store the tier list and radius directly on compact formation or prototype records; no expanded member geometry is returned.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The numeric floor and missing-measurement fallback are explicit; finite supplied radii are a host premise and model-marker digests do not certify geometry.
