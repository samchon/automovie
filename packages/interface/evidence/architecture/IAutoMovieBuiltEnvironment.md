# src/architecture/IAutoMovieBuiltEnvironment.ts#IAutoMovieBuiltEnvironment

## @evidence contracts/development/design.md#principled-representation `validateBuiltEnvironment` checks version/units, models and references, spaces and element hierarchy, population declarations, building-unit ownership, boundaries/openings, connectors and support surfaces. With no prior error it checks rest panel fit, carriage-origin service and finite world-TRS named configurations. Lowering and guarded drawing/schedule/quantity entry points refuse rejected records; low-level queries can instead require already admitted inputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Flat arrays of separately validated records joined by ids, so each concern (elements, spaces, boundaries, openings, connectors, surfaces, populations) is owned by one list and one validator section rather than by nested element trees.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Site context is a separate contract; collision checking against building-reserved ids requires the context caller to supply those ids, which production build review does rather than every standalone analysis call. Compact populations remain compact through lowering, and absent units or unattributed hierarchy members refuse. Typed nested containers and executable traversal/resource depth remain premises; validation does not authenticate imported bytes or prove every geometric containment and physical relation.

## @evidence contracts/development/common.md#meaningful-documentation

States the element and space separation, the building scope and what lives outside it, the units, the lowering naming scheme, unit ownership, the meaning of omitted populations, and which lists ids must resolve into.
