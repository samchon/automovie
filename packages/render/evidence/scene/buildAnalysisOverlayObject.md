# src/scene/buildAnalysisOverlayObject.ts#buildAnalysisOverlayObject

## @evidence contracts/development/implementation.md#principled-implementation

Requires a solved run, present nongapped metric and its spatial samples, then maps metric values linearly into a clamped blue/green/red ramp and Float32 point attributes; engine artifacts supply finite sample coordinates/values and meaningful units. Flat domains map to the middle; extreme finite domain subtraction and spread-argument limits remain unsupported numeric/population cases.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds one Points object directly from the analysis artifact and attaches run/metric/unit/domain identity; the portable artifact owns measurement, while this declaration owns visualization and distinguishes borrowed from created point material.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses missing analysis/metric/field instead of manufacturing a successful image; ramp midpoint for a zero span is an explicit scale convention, and no fixture ids or foreign method replacement affect admission or color.

## @evidence contracts/development/common.md#meaningful-documentation

Documents solved-field admission, sample/pinned domain scaling, point size metres, flat-field convention and the borrowed-material option; disposal API states exactly which resources this object owns.

## @evidence contracts/development/implementation.md#efficient-algorithms

Finds one metric and filters S run samples, then performs linear range/attribute construction for N selected samples; retains two 3N Float32 attributes and N sample references. The intermediate value list and variadic min/max impose an argument-count limitation for very large fields.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the artifact's completed measurement without rerunning its solver; each overlay has independent mutable geometry/material lifetime, and pinned versus automatic domains change colors so no artifact-id-only visualization cache is valid.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns one geometry and only its default material, released by returned dispose; borrowed material remains caller-owned and the selected sample array stays reachable through count. Disposal is not memoized and a geometry-dispose failure skips default-material release; partial-construction rollback is not guaranteed.
