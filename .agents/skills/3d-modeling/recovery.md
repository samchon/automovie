# Mesh Recovery

Use the recovery package to observe a fixed external mesh, save its curve or surface coefficients, and regenerate an internal model through the engine, interface and viewer packages. Recover when the asset needs editing or regeneration its source cannot supply; using an admitted original directly remains a separate valid choice.

## Observe And Save

Read the recovery package's README, public types and JSDoc for inputs, supported operations, saved formats and diagnostic meanings. Run through its public API; file publication and command dispatch belong to the project's own command, which its README documents.

Prepare evaluated triangles under the package's coordinate, unit, pose and face-orientation contracts. Bind the observation to the exact source bytes, selected components, evaluated pose and applied transform, converting coordinate conventions at one named boundary, and keep that registration fixed for comparison.

Extract observations algorithmically and fit compact coefficients, preserving their parameterization, continuation and shared boundary relationships. Follow [Lofting](lofting.md) for section families.

## Generate Independently

Reconstruct from the saved representation alone through the recovery API and the engine and interface model path. Never use original positions, topology or normal fields as a reconstruction fallback. Derive the surface and displayed construction from the same coefficients.

## Compare And Correct

Load the newly reconstructed model and its generating construction in the actual viewer. Show the fixed source and result side by side under matching view and render conditions, deriving each mesh's normals from its own geometry. Lines drawn over the source do not show an independently reconstructed surface.

Follow [Visual Debugging](visual-debugging.md) for inspection and correction rounds. Trace deviations through preparation, observation, fitting, correspondence, generation and display, then correct their causes. Judge the actual reconstructed result, including missing and uncovered regions and visible defects, alongside package diagnostics; a completed command or numerical fit alone does not establish fidelity. Limited observations justify only the shape and views they support.
