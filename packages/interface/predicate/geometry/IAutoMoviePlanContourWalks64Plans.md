# src/geometry/IAutoMoviePlanContourWalks64Plans.ts#IAutoMoviePlanContourWalks64Plans

## @evidence contracts/development/common.md#meaningful-documentation

The type describes the required phase order and which walk and owner references survive between calls.

## @evidence contracts/development/design.md#principled-representation

Preparation keys walks by ordered ring IDs and caches each slit choice. Resolution prevents future preparation and walks each owner's identity map to include registered later knots.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The returned closures preserve one planning state and share original rings. The caller controls ring admission, mutation and source insertion.

# src/geometry/IAutoMoviePlanContourWalks64Plans.ts#IAutoMoviePlanContourWalks64Plans.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Two or more caller-admitted local indices build one walk. Repeating the ordered IDs reuses it. Synchronous insertion can already have mutated shared state if a callback fails.

# src/geometry/IAutoMoviePlanContourWalks64Plans.ts#IAutoMoviePlanContourWalks64Plans.resolve

## @evidence contracts/development/common.md#meaningful-documentation

The first attempt closes preparation. A singleton returns its original point array and a prepared branch allocates a refreshed one borrowing the point tuples.
