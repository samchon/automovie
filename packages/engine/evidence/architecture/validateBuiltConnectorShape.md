# src/architecture/validateBuiltConnectorShape.ts#validateBuiltConnectorShape

## @evidence contracts/development/implementation.md#principled-implementation

Compares stated slope/steps with the shared route metrics under fixed `1e-6` rad / `1e-3` m discrepancies, without assuming a universal authoring precision. Refuses non-finite computed length/run/rise/slope before comparisons; coincident routes have no measurable travel. Finite source coordinates alone need not produce finite derived metrics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shape section of connector validation, separated from `validateBuiltEnvironment`; route measurement is delegated to `builtConnectorGeometry`, the query every consumer reads, instead of a private copy of its formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No connector kind is special-cased; a record whose id repeats an earlier one is not measured, because the duplicate is reported on its own path and the id-addressed measurement would describe the other record.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states every station, facing, section, slope and step rule, the units and tolerances, when the route is measured and why, and the path.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans route stations, facings and sections, then pays full `builtConnectorGeometry`: connector-id lookup, route folds and a route walk for each landing sample. Thus measurement includes connector count and landing-count times route-size terms, not only one linear station scan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A check of one connector per call; each connector is measured at most once per validation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The route measurement is released on return; a bounded number of violations per station, facing and section is appended to the caller's collector.
