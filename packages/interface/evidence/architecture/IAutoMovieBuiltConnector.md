# src/architecture/IAutoMovieBuiltConnector.ts#IAutoMovieBuiltConnector

## @evidence contracts/development/design.md#principled-representation

Building admission checks distinct resolving endpoint ids, at least two finite route points with adjacent distance above 1e-9 m, optional unit facings, exactly one usable-section spelling and finite derived route length/run/rise/slope. Optional slope agrees with atan2 of absolute net climb and summed horizontal run within 1e-6 radians; step products agree with those totals within 1e-3 m. This is route-data consistency, not a proof that modelled treads or the full carriage occupy that route.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record per run with optional facets (landings, orientations, sections, slope, steps, operation) that each default to the plain two-ended static route when absent, so a simple passage states only kind, endpoints, route, width, clearance and elements.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Slope/steps are checked claims, not geometry overrides; missing or competing section spellings refuse. Endpoint/landing space ids do not force the corresponding route points inside those volumes, orientation is authored metadata and drive is validated without animating a run. A family outside the closed set uses `other`; this relation does not certify physical passage, collision clearance or evacuation.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit, ordering, tolerance and exclusivity rule, the meaning of every optional member when absent, the one-way stop order, and the slope formula and range.
