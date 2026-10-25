# Asset workflows

Choose an asset workflow from what the production needs to show and control. A short scene can use a ready asset with a few placements; a recurring character may need editable proportions, expressions, and motion across many scenes. A standalone modeling task can define its required views and controls without a screenplay.

## Start with programmed control

For newly authored 3D work, build stick figures, coarse block forms or simple frames first. Keep actor/object identity, meaningful dimensions, pivots, attachments and control interfaces independent of surface shape and tessellation. Expose actual project-owned representation/detail options and per-instance overrides where needed; do not claim an installed Human switch without its current API. Verify the coarse form and promised controls. For animated work, [motion](../motion/SKILL.md) owns choreography, timing and physical feedback, including the complete low-cost motion sequence before visual upgrades. Retained assets already meeting the task need no gratuitous rebuild.

After the coarse representation and any commissioned motion work, upgrade only objects whose visible role needs it, retaining the controls and measured host budget. This applies to mixed-detail diffusion hints and requested finished direct 3D films. Human is an optional identity/expression representation, not a prerequisite for correct performance. Important hint objects can remain coarse frames; an unimportant object can remain screenplay description when the chosen conditioning does not need to show it. Record these choices through [production decisions](../production/profile.md).

## Choose A Source And Representation

| Workflow | When it fits | Production responsibility |
| --- | --- | --- |
| Construct from dimensions, curves, lofted sections, primitives, or procedural rules | Shape or variation needs direct authoring control | Keep meaningful parameters and the construction that generates the surface |
| Recover a fixed mesh or supported image observations | The source supplies a shape whose recovered representation needs editing or regeneration | Preserve acquisition and registration, save recovered coefficients, and judge the independent reconstruction |
| Use an existing or generated asset directly | Its supported geometry, materials, rig, and clips already meet the task | Preserve the admitted bytes and adapt placement, performance, and appearance through supported controls |

A generated or supplied 2D image can provide appearance reference or a supported conditioning asset; it does not replace coded main-scene motion and the whole assembled video when that hint is commissioned. When detailed 3D is needed, choose a supported generated mesh, multiview acquisition with recovery/postprocessing, or a 3D service according to the control requirement. Recover lofting curves or another editable representation only where motion, deformation or code ownership needs that control. These workflows can coexist in one assembly. A generated mesh can be used directly, recovered, or replaced by a crafted part according to its required edits. Recovery is useful when its supported representation supplies the needed control; it is not a prerequisite for placing an external asset. Check the installed import and rendering capabilities before committing to a source format or extension.

Freeze selected external bytes and their sidecars with hashes, source identity, acquisition settings, and applicable usage terms. A URL, model name, or seed alone does not identify the asset actually used. Preserve the original separately from converted, simplified, or recovered derivatives, and record which source each derivative consumes.

## Construct And Assemble

Use named dimensions and local frames for authored shapes. For a loft, keep sections, guides, and their parameter directions related through one generating definition; for another representation, retain its corresponding sketches, fields, or procedural structure. Keep defining shape independent of tessellation so a detail setting does not silently change identity or dimensions.

Give each part, placement, shared boundary, and motion driver one owner. Assemble through parent frames and shared attachment definitions so a proportion or pivot edit carries dependent parts with it. Rigid objects can move through transforms; deforming objects need the supported rig or deformation controls their performance requires. Reusing a supplied rig can be more appropriate than reconstructing a surface and losing its existing animation behavior.

Read the installed Human package's current public surface before using it. Choose an abstraction and detail level that preserves the production's silhouette, identity, timing, and necessary motion. Use a stick figure, a lower detail model, or a supported detail option when it fits the task and is available; a planned package feature is not an installed capability. Keep project-authored alternatives explicit rather than presenting them as package options.

## Recover Independently

Read the installed Recovery documentation for supported observations, registration, units, saved representations, and diagnostic meanings. Bind the observation to exact source bytes, selected components, evaluated pose, and the applied transform; convert coordinate conventions at a named boundary. Keep that registration fixed while judging the result.

Save the recovered coefficients and relationships, then reconstruct from those saved artifacts alone. Derive the reconstructed surface and displayed construction from the same representation. Original vertices, faces, and normals cannot serve as an undisclosed fallback for a claim of independent reconstruction; retaining the original as a directly used asset is a separate valid choice.

Compare the source and reconstruction under matched camera, scale, pose, and lighting conditions. Distinguish a reconstructed surface from lines displayed over the original source. Inspect diagnostics and uncovered regions alongside the render, because a completed observation or a small fitting residual does not establish usable appearance or motion. Limited observations justify only the shape and views they support.

Use [rendered-use inspection](inspection.md) to verify the chosen representation through its actual consumer.


## Conditioning and acquisition references

[ControlNet](https://github.com/lllyasviel/ControlNet) demonstrates pose and depth conditioning. Treat this as a reason to verify the selected model's actual input contract, not a guarantee that an arbitrary render or skeletal style is admitted. [Wan-Animate preprocessing](https://github.com/Wan-Video/Wan2.2/blob/main/wan/modules/animate/preprocess/UserGuider.md) extracts reference-video skeletons and discusses retargeting for differing proportions; inspect the extracted/retargeted skeleton over the affected sequence before trusting it. This compatibility check does not promise that diffusion repairs bad source motion.

[Hunyuan3D](https://github.com/Tencent-Hunyuan/Hunyuan3D-2) documents image-to-shape and multiview shape workflows. A generated mesh remains an optional fixed source: inspect its usable geometry and controls before direct use, and recover only the representation the requested edits need. These external workflows establish no installed AutoMovie feature or automatic rigging capability.
