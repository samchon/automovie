# src/environments/rides/createTrackedRide.ts#createTrackedRide

## @evidence contracts/development/implementation.md#principled-implementation

One spatial sampler generates the rails, resolves held station thresholds and bakes the world transform of the carrier. The model's placed threshold determines the platform polygon and the parked and moving contact frames.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit timing and the carrier at definition, then create scoped scene records and evaluate the same course as needed at placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No extrapolated route, implicit stop, model-specific affordance, simulation or instantaneous transfer is added. Stations require supported level edges and positive dwell, and times that round to an adjacent key are refused. The boarding surface and visible platform are one patch.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies both clocks and units, baked interpolation, stop and contact roles, output domains and explicit failures.

## @evidence contracts/development/implementation.md#efficient-algorithms

A binary station window bounds each travelled interval. Each crossed sample contributes at most one key per interval and each stop or parked contact takes one composed pose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The prepared course is shared across vehicles and reused by the rails, support and animation. Renderer and motion placement share the emitted clip instead of generating independent timings.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The definition retains only input snapshots and the prepared course, not placed modules, query history or external resources.
