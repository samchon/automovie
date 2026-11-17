# Mesh recovery

Mesh recovery observes a fixed external mesh with the recovery package, saves curve or surface coefficients, and regenerates an internal model from them through the engine, interface and viewer packages.

Recover only for what a mesh cannot give: a parameter that conditioning cannot vary on the mesh, regeneration at another resolution, or a smooth join to a lofted body. Recovery is the costliest route and discards a usable rig, so nearness to the camera or motion alone is no reason for it.

## Observation and fitting

The recovery package's README, public types and JSDoc own its inputs, operations, saved formats and diagnostics. Call its public API, and leave file publication and command dispatch to the project's recovery tool.

Start from a mesh that conditioning has frozen and normalized, segmented into the asset's parts. Prepare evaluated triangles under the package's coordinate, unit, pose and face-orientation contracts. Bind the observation to the exact source bytes, selected components, evaluated pose and applied transform, convert coordinate conventions at one named boundary, and keep that registration fixed for comparison.

Extract observations algorithmically and fit compact coefficients that keep their parameterization, continuation and shared boundaries, under [Lofting](lofting.md) for section families. A source's own errors, such as a generated mesh's invented hidden sides or melted thin parts, are not targets to fit.

## Independent generation

Reconstruct from the saved representation alone, through the recovery API and the engine and interface model path, never falling back on the original positions, topology or normals. Derive the surface and its displayed construction from the same coefficients.

Recovered coefficients reproduce one shape. An asset that must vary derives shared [dimensions](construction.md#dimensions) and formulas instead.

## Comparison and correction

Load the reconstructed model and its construction in the viewer, beside the fixed source under matching view and render conditions, with each mesh's normals derived from its own geometry. Lines drawn over the source do not show an independent reconstruction.

Correct under [form inspection](../inspection.md) and its [correction rounds](../../visual-debugging/correction-rounds.md), tracing deviations through preparation, observation, fitting, correspondence, generation and display. Judge the reconstructed result itself, including missing and uncovered regions and visible defects, alongside the package's diagnostics, because a numerical fit does not establish fidelity. Limited observations justify only the shape and views they support.
