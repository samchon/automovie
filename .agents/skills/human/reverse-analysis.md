# Reverse Analysis And Reverse Rendering

Recover a compact curve-and-formula representation from fixed reference meshes and establish its behavior on unseen shapes and changed independent measurements. Read [References](references.md), [Lofting](../3d-modeling/lofting.md), [Visual Debugging](../3d-modeling/visual-debugging.md) and the existing research before choosing a method. Apply Human's author workflow, supervision and reporting to this work.

## Freeze The Experiment

Commit the generating source and its dependency closure before comparison. Freeze the reference inputs, observation protocol, units, registration, cameras and output directory in a manifest with byte hashes. Bind the actual loaded source, curves, generated surface and capture to that manifest; a later commit cannot retroactively establish a missing generating snapshot.

Read immutable inputs and publish each candidate into a new version directory. Changing an input while a run reads it invalidates that round. Preserve the last valid artifacts and record failed or mixed-input runs explicitly.

## Establish Correspondence

Register units, origin, handedness, scale, posture and local anatomical frames before fitting. Treat rig markers, heuristic extrema and clinical landmarks as different observations. Preserve uncertainty, absent observations and source defects rather than joining gaps or assigning an unsupported anatomical name.

Extract physical section families, longitudinal guides, oblique cuts, silhouettes and feature boundaries for each region and its neighbors. Retain the cutting plane, selected arc, orientation witness and selection grounds so another operator can reproduce the observation. Reconcile section-guide intersections in the same frame before interpolating them.

Locate contour births, deaths, splits, merges, cavity changes and contacts. Equal loop counts can conceal a topology event. For a piecewise linear source, inspect critical levels and incident contours on both sides instead of relying only on regularly spaced cuts. Keep genuine apertures and source self-contact distinct from projection crossings or reconstruction faults.

## Identify Shared Equations

Name the independent lengths, breadths, depths, girths, positions and asymmetries that determine each curve family. Express stations in physical units and shape rules in appropriate local frames. State which quantities are measured, derived, fitted or conventional, including dependencies and admissible combinations.

Fit a small shared coefficient set to corresponding observables across many reference identities. Preserve independently authored measurements rather than compensating for a wrong junction, registration or surface operator with another dimension. Judge candidate representations by observable error, complexity, identifiability and stability under parameter changes.

Use curvature and feature correspondence to choose a compact spline or analytic basis, with compatible joins and explicit creases. Report the number of free coefficients, spans and constraints alongside residuals. Giving each source edge a cubic or each sampled point its own control merely re-encodes the mesh; it does not identify a useful formula. Dense exact contour replay can localize a fault but remains a diagnostic baseline.

Separate observation, curve-fitting, correspondence, surface interpolation and display errors through controlled comparisons. Hold the observations fixed when comparing operators, and hold the operator fixed when comparing representations. Change the responsible stage instead of hiding downstream loss in fitted shape coefficients.

## Cover Variation And Reserve Evidence

Plan distinct reference identities across the independent dimensions, proportions, local shape, asymmetry and relevant combinations. Include ordinary interiors, supported extremes and transition regions, then expand where uncertainty or residuals are concentrated. More cuts on the same people improve observation density, not population coverage.

Reserve identities, section locations, oblique directions and parameter combinations before fitting. Keep the split fixed through a correction round. Samples evaluated from a fitted source curve are not independent held-out evidence. Use subject-level validation to expose identity memorization and interaction failures; a small seed set cannot establish a population equation.

Measure each candidate on the reserved shapes and on independent parameter changes, their interactions and a return to the starting values. Check that named measurements retain their meanings and that neighboring boundaries remain compatible. State unsupported regions and extrapolations; finite observations do not establish every possible parameter combination.

## Generate The Reverse Surface

Express the experiment through the repository's interface contracts, evaluate curves and generate surfaces through its engine, and render and capture through its viewer. Reuse the existing operators and extend their owning layer when a general capability is missing. Record the actual consumed contracts and operators; wrapping an externally generated mesh in a typed document does not establish engine generation.

Make the reconstruction consumer read only the saved curve/formula representation, independent measurements and declared boundary or topology relationships. Generate new vertices and faces from that representation. Original mesh vertices, indices, topology and copied vertex-normal fields must not supply the reconstructed surface or conceal an unsupported region.

Trace each claimed region from its observations through fitted spans and guides into the actual surface operator. Record unconsumed families explicitly. Derive the displayed construction from the same representation that generated the judged surface, distinguishing control points, interpolation waypoints and evaluated points. A missing reconstruction fails visibly rather than falling back to the reference mesh.

## Render And Compare

Make the primary evidence a side-by-side reference render and independently reconstructed surface render, with matching cameras, framing, lighting, material and resolution. Use normals derived from each mesh's own geometry, disable fine material relief and inspect under raking light. Copied source shading is a separate diagnostic and cannot establish reconstructed form.

Follow Visual Debugging's complete view and scale coverage, showing the generating construction over the reconstruction and alone as additional views. A line overlay on the original mesh demonstrates observations only; it is never a reverse render. Record the actual hardware renderer, loaded artifact hashes, source commit and capture time.

Measure omitted and added surface separately and localize their distributions across regions, junctions, apertures and thin parts. Distinguish a sampled maximum from a full-surface bound and a curve-fit certificate from a surface-error guarantee. Inspect orientation, seams, folds, closures and self-intersections alongside silhouettes and geometric residuals; an aggregate improvement cannot conceal a local regression.

Apply the complete correction rounds and representation-change rule in [Verification](verification.md). Accept a round only after its author has inspected the current reconstructed surface against the reference across the affected population and views, accounted for the recorded defects and completed self-review. Numerical fit or additional curve count alone establishes no visual result.

## Parallel Ownership And Audit

Assign region authors and a single owner for each shared frame, boundary, schema, fitting operator, surface consumer and viewer. Give each run immutable inputs, an isolated entry graph, an owned output directory and a separate capture page. Integrate versioned artifacts through explicit manifests rather than shared live files. Keep source-copy and compiler leases short and separate from long read-only rendering or measurement runs.

Isolate mutable emission without duplicating equivalent immutable compiler or plugin work. Use supported cache ownership and reuse, measure cold-build costs and bound concurrent worker pools. Never remove required compiler guards to conceal a coordination problem.

At each scheduled audit, compare the current method with alternatives that could remove observed causes more directly. State the hypothesis, evidence, remaining uncertainty, responsible author and next discriminating experiment. Include the primary reference-versus-reconstruction images, capture and source identities, regional inspection evidence and unresolved compliance findings under Human's reporting schedule.
