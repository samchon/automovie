# Mesh Recovery

Use `@automovie/recovery` to observe a fixed external mesh, save its curve or surface coefficients, and regenerate an internal model through AutoMovie's engine, interface and viewer.

## Observe And Save

Read the installed `@automovie/recovery` README, public types and JSDoc for inputs, supported operations and saved formats. Run through its public API or the installed `automovie-recovery` commands, using `--help` for invocation.

Prepare evaluated triangles under the package's coordinate, unit, pose and face-orientation contracts. Keep the source and registration fixed for comparison.

Extract observations algorithmically and fit compact coefficients, preserving their parameterization, continuation and shared boundary relationships. Follow [Lofting](lofting.md) for section families.

## Generate Independently

Reconstruct from the saved representation alone through the installed recovery API and AutoMovie's engine/interface model path. Never use original positions, topology or normal fields as a reconstruction fallback. Derive the surface and displayed construction from the same coefficients.

## Compare And Correct

Load the newly reconstructed model and its generating construction in the actual viewer. Show the fixed source and result side by side under matching view and render conditions, deriving each mesh's normals from its own geometry. Lines drawn over the source do not show an independently reconstructed surface.

Follow [Visual Debugging](visual-debugging.md) for inspection and correction rounds. Trace deviations through preparation, observation, fitting, correspondence, generation and display, then correct their causes. Judge the actual reconstructed result, including missing regions and visible defects, alongside package diagnostics; a completed command or numerical fit alone does not establish fidelity.
