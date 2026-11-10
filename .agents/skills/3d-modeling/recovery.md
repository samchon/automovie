# Mesh recovery

Use the recovery package to observe a fixed external mesh, save its curve or surface coefficients, and regenerate an internal model through the engine, interface and viewer packages.

Recover only for what a mesh cannot give: a parameter that [Conditioning](conditioning.md#variation) cannot vary on the mesh, regeneration at another resolution, or a smooth join to a lofted body. Nearness to the camera or motion alone is no reason to recover, because recovery is the costliest route and discards a usable rig.

## Observe and save

Read the recovery package's README, public types and JSDoc for inputs, supported operations, saved formats and diagnostic meanings. Run through its public API; file publication and command dispatch belong to the project's own recovery command.

Start from a mesh frozen and normalized under [Conditioning](conditioning.md) and segmented into the asset's parts.

Prepare evaluated triangles under the package's coordinate, unit, pose and face-orientation contracts. Bind the observation to the exact source bytes, selected components, evaluated pose and applied transform, converting coordinate conventions at one named boundary, and keep that registration fixed for comparison.

Extract observations algorithmically and fit compact coefficients, preserving their parameterization, continuation and shared boundary relationships. Follow [Lofting](lofting.md) for section families.

## Generate independently

Reconstruct from the saved representation alone through the recovery API and the engine and interface model path. Never use original positions, topology or normal fields as a reconstruction fallback. Derive the surface and displayed construction from the same coefficients.

Recovered coefficients reproduce one shape. When the asset must vary, derive its shared dimensions and formulas under [Crafting](crafting.md).

## Compare and correct

Load the newly reconstructed model and its generating construction in the actual viewer. Show the fixed source and result side by side under matching view and render conditions, deriving each mesh's normals from its own geometry. Lines drawn over the source do not show an independently reconstructed surface.

Follow [Visual Debugging](visual-debugging.md) for inspection and correction rounds. Trace deviations through preparation, observation, fitting, correspondence, generation and display, then correct their causes. Judge the actual reconstructed result, including missing and uncovered regions and visible defects, alongside package diagnostics; a completed command or numerical fit alone does not establish fidelity. Limited observations justify only the shape and views they support.

A source's own errors, such as a generated mesh's invented hidden sides or melted thin parts, are not targets to fit.
