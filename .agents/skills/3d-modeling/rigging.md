# Rigging

Define the rig's rest state, joints, weights, attachments and limits. Verify them in the poses the asset uses. [Motion](../motion/SKILL.md) owns time-dependent behavior.

Read the required use, retained source and package contracts for import, model, skinning and viewing. Accept a generated rig after its consumer deforms it correctly.

## Rig choice

| The asset | Rig |
| --- | --- |
| Rigid parts on pivots | One node per part on its real pivot |
| A humanoid | Skin bound to the installed motions' humanoid joints |
| Other deforming body | Skin bound to the joints its motion drives |

Add no joint that nothing drives.

Align added detail to the accepted skeleton's rest pose and joints. Changing the character's proportions requires the user's choice and retargeting.

## Characterization

### Fixed inputs

Freeze mesh, skeleton, textures, source pose and transforms. Record units, handedness, up and forward axes, local and world transforms, rest and bind poses, hierarchy, joint IDs, pivots and attachment owners. Verify what pose the importer displays at rest.

Inspect the required bones and every used influence, rigid accessories included.

### Binding

Map each deforming vertex to the joint palette and bind interpretation in use, and validate influence indices, finite weights, admitted sums and influence counts, parent relationships and coordinate conversion through the supported APIs.

Give a rigid prop a transform or attachment, not a skin. Keep unknown joints and extra influences; a deliberate reduction is a new derivative whose error is measured and rendered at the required poses.

## Weight sources

Bind the reduced mesh in rest pose with limbs apart. Join loose deforming pieces or make them rigid attachments. Use the first applicable weight source below. For crafted forms, evaluate weights on the [generating definition](crafting/construction.md#generating-definition).

Prove one representative export, import and deformation path before rigging many assets the same way.

### Rig carried by the source

Reuse a source rig when its joints map to the target. Request the nearest standard skeleton from a service. Check joint names, rest pose, extra joints and units.

### Transfer from a rigged body

Transfer weights from a rigged body of the same kind and pose where the nearest surface matches in position and normal. Fill remaining weights by smoothing from the transferred vertices.

### Automatic weights

Compute the weights automatically from the skeleton and the surface when the surface is one closed piece. Watch for weights crossing between touching surfaces, and for failure on open or disconnected geometry.

### Learned rigging model

Use learned rigging when no existing skeleton fits. Map its joints and retarget its motion.

## Deformation proof

### Poses to inspect

Check the rest result first, then each required control alone, then combined poses and the shot sequence, in the rounds the [correction rounds](../visual-debugging/correction-rounds.md) page sets.

Choose coverage, such as shoulder and hip bends, twisting, hands and face, attachments and returns to rest, from the asset's anatomy, promised use, silhouettes, junctions and screen scale.

| Seen | Usual cause |
| --- | --- |
| Rest mesh displaced or scattered | Wrong bind or doubled unit or axis map |
| One limb drags another or the torso follows its arm | Crossed bind weights |
| Joint pinches when twisting or bending | Linear blending's limit |
| A piece left behind or torn off | A loose piece with no weights |

Attach a loose piece to one joint. For a joint that pinches flat, add a twist joint or compare the other skinning method.

Look also for clothing or accessories passing through the body, and for normals or materials that change with the pose.

### Skinning method and variants

Check the API's linear and dual-quaternion skinning support and scale limits. Compare them in the actual consumer where the asset needs a choice.

Keep proportions and control identities stable across detail variants, and recheck weights, rig assumptions and attachments when topology or proportions change.

### What survives export

Record which DCC operations produce the required deformation and which channels the exporter, ingest profile and runtime preserve. Check the ingest profile's subset of the interchange format.

Where needed, bake evaluated results into kept channels or a supported fixed representation, preserving the original and the conversion's identity. Report required behavior the path cannot carry instead of exporting only the rest mesh.

Compare evaluated source and imported deformation at matched times and views. Cover required corrective or facial states, attachments and nonuniform scale where used. Judge visible error at the promised scale and verify the retained channels.

## Handoff

Hand accepted skeleton interpretation, controls, inputs and unresolved limits to the motion owner. Repair rig defects in the rig.

## References

These primary sources are options, not installed features, and a learned model's code, weights and data carry separate licenses to check at adoption.

The [glTF skinning tutorial](https://github.com/KhronosGroup/glTF-Tutorials/blob/main/gltfTutorial/gltfTutorial_020_Skins.md) and [specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) show how scene hierarchy, joint palette, inverse binds and current transforms differ. The [Blender armature modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/armature.html) documents that tool's deformation choices and preserve-volume behavior.

[Robust Skin Weights Transfer via Weight Inpainting](https://github.com/rin-23/RobustSkinWeightsTransferCode) transfers weights between bodies of different shape.

[UniRig](https://github.com/VAST-AI-Research/UniRig) predicts a learned skeleton, then a skin from it, so correct the skeleton before taking the skin. [Puppeteer](https://github.com/Seed3D/Puppeteer) and [RigAnything](https://arxiv.org/abs/2502.09615) predict skeleton and weights for bodies no template fits.
