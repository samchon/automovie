# Assets

Choose an asset workflow from what the production needs to show and control. A short scene can use a ready asset with a few placements; a recurring character may need editable proportions, expressions, and motion across many scenes. A standalone modeling task can define its required views and controls without a screenplay.

## Choose A Source And Representation

| Workflow | When it fits | Production responsibility |
| --- | --- | --- |
| Construct from dimensions, curves, lofted sections, primitives, or procedural rules | Shape or variation needs direct authoring control | Keep meaningful parameters and the construction that generates the surface |
| Recover a fixed mesh or supported image observations | The source supplies a shape whose recovered representation needs editing or regeneration | Preserve acquisition and registration, save recovered coefficients, and judge the independent reconstruction |
| Use an existing or generated asset directly | Its supported geometry, materials, rig, and clips already meet the task | Preserve the admitted bytes and adapt placement, performance, and appearance through supported controls |

These workflows can coexist in one assembly. A generated mesh can be used directly, recovered, or replaced by a crafted part according to its required edits. Recovery is useful when its supported representation supplies the needed control; it is not a prerequisite for placing an external asset. Check the installed import and rendering capabilities before committing to a source format or extension.

Freeze selected external bytes and their sidecars with hashes, source identity, acquisition settings, and applicable usage terms. A URL, model name, or seed alone does not identify the asset actually used. Preserve the original separately from converted, simplified, or recovered derivatives, and record which source each derivative consumes.

## Construct And Assemble

Use named dimensions and local frames for authored shapes. For a loft, keep sections, guides, and their parameter directions related through one generating definition; for another representation, retain its corresponding sketches, fields, or procedural structure. Keep defining shape independent of tessellation so a detail setting does not silently change identity or dimensions.

Give each part, placement, shared boundary, and motion driver one owner. Assemble through parent frames and shared attachment definitions so a proportion or pivot edit carries dependent parts with it. Rigid objects can move through transforms; deforming objects need the supported rig or deformation controls their performance requires. Reusing a supplied rig can be more appropriate than reconstructing a surface and losing its existing animation behavior.

Read the installed Human package's current public surface before using it. Choose an abstraction and detail level that preserves the production's silhouette, identity, timing, and necessary motion. Use a stick figure, a lower detail model, or a supported detail option when it fits the task and is available; a planned package feature is not an installed capability. Keep project-authored alternatives explicit rather than presenting them as package options.

## Recover Independently

Read the installed Recovery documentation for supported observations, registration, units, saved representations, and diagnostic meanings. Bind the observation to exact source bytes, selected components, evaluated pose, and the applied transform; convert coordinate conventions at a named boundary. Keep that registration fixed while judging the result.

Save the recovered coefficients and relationships, then reconstruct from those saved artifacts alone. Derive the reconstructed surface and displayed construction from the same representation. Original vertices, faces, and normals cannot serve as an undisclosed fallback for a claim of independent reconstruction; retaining the original as a directly used asset is a separate valid choice.

Compare the source and reconstruction under matched camera, scale, pose, and lighting conditions. Distinguish a reconstructed surface from lines displayed over the original source. Inspect diagnostics and uncovered regions alongside the render, because a completed observation or a small fitting residual does not establish usable appearance or motion. Limited observations justify only the shape and views they support.

## Plan And Inspect The Rendered Use

Select inspection conditions from the intended use and the change's reach. A static background prop and a reusable articulated character need different coverage. Include the affected shot cameras, visible details, assembled neighbors, and any additional view needed to expose a suspected shape or junction defect. Broader reuse requires broader view and motion coverage; a shot-specific result should say which use was checked.

When changing shape, inspect the actual generating construction alongside the surface to trace defects to their cause. Check form under light that exposes it, then judge materials and lighting in the intended presentation. For moving assemblies, inspect relevant intermediate poses, extremes, contacts, and returns, including combinations affected by changed proportions or attachments.

Capture current output from the real consumer with the source revision, asset identities, time or pose, camera, renderer, and detail settings needed to repeat the observation. Compare changes under matching conditions. A blank frame, stale capture, or output nobody inspected remains unverified.

Measure rendering cost at the intended resolution, asset population, and motion load. If a lower specification host is a requirement, observe that host or report the untested limitation; a coarser mesh alone does not establish acceptable memory or frame time. Keep measured budgets and accepted visual compromises with the production decisions.

Complete each inspection round before editing: collect every affected render, measurement, diagnostic, and failure; relate each phenomenon to its cause and contributing conditions; then correct all identified causes together. Repeat the original conditions across all affected consumers and inspect regressions before accepting the change. Use the [asset questions](../../.agents/skills/contracts/assets.md) for review; the [contracts guide](contracts.md) owns formal adoption and respondent selection.
