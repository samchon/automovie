# Mesh recovery

Recover coefficients from a fixed mesh and use them to regenerate an internal model.

Recover only for required parameter control, variable resolution or a smooth lofted join. Preserve a usable mesh and rig when conditioning meets the requirements.

## Observation and fitting

The recovery package's README, public types and JSDoc own its inputs, operations, saved formats and diagnostics. Call its public API, and leave file publication and command dispatch to the project's recovery tool.

Use a frozen, normalized mesh segmented by part. Evaluate triangles under the package's unit, frame, pose and orientation contracts. Record source, components, pose and transform. Convert conventions once and keep registration fixed.

Extract observations algorithmically and fit compact coefficients that preserve parameterization, continuation and shared boundaries. Apply [Lofting](lofting.md) to section families. Exclude source defects from the fit.

## Independent generation

Reconstruct the surface and displayed construction from the saved coefficients through the recovery API and engine and interface model path. Keep the original mesh for comparison.

Recovered coefficients reproduce one shape. An asset that must vary derives shared [dimensions](construction.md#dimensions) and formulas instead.

## Comparison and correction

In the viewer, compare the reconstruction and its construction with the fixed source under matching conditions. Derive each mesh's normals from its own geometry.

Trace deviations from preparation through display under [form inspection](../inspection.md) and [correction rounds](../../visual-debugging/correction-rounds.md). Check coverage, defects and diagnostics. Limit claims to observed shapes and views.
