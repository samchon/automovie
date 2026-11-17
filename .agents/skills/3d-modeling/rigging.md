# Rigging

Rigging owns an asset's rest state: where the joints sit, which vertices follow them, its attachments, its limits and the still poses that test them. Anything over time, such as clips, retargeting, inverse kinematics and the laws that generate motion, belongs to [motion](../motion/SKILL.md).

Before changing a skeleton, skin, attachment or deformation control, read the asset's required use, its retained source, and the import, model, skinning and viewer contracts of the packages it uses. A generated rig is a candidate until its consumer deforms it correctly.

## Rig choice

| The asset | Rig |
| --- | --- |
| Rigid parts on pivots, such as a door or a robot | No skin; a node per part, pivoted on the real axis |
| A humanoid | A skin bound to the humanoid joint set the installed packages' motion performs on |
| Another deforming body, such as an animal or a cloak | A skin bound to the joints its motion drives |

Rigid parts get their nodes and pivots when the asset is modularized.

Add no joint that nothing drives.

When a detailed mesh replaces a body whose skeleton and proportions are already accepted, align the mesh to that skeleton's rest pose and joint positions. Adopting the mesh's own proportions instead changes the character and sends its motion back through retargeting, so that choice is the user's.

## Characterization

### Fixed inputs

Keep the exact mesh, skeleton, textures, source pose and transforms as fixed inputs, and identify their units, handedness, up and forward axes, local and world transforms, rest and bind pose, hierarchy, joint identifiers, pivots and attachment ownership. An exported rest pose, an animation's first frame and the display's zero pose need not coincide.

Inspect the required bones and every used influence, rigid accessories included.

### Binding

Map each deforming vertex to the joint palette and bind interpretation in use, and validate influence indices, finite weights, admitted sums and influence counts, parent relationships and coordinate conversion through the supported APIs.

Give a rigid prop a transform or attachment, not a skin. Keep unknown joints and extra influences; a deliberate reduction is a new derivative whose error is measured and rendered at the required poses.

## Weight sources

Bind a mesh whose conditioning has finished reducing it, in a rest pose with the limbs apart, with each loose piece joined to the surface or set aside as a rigid attachment. Take the weights from the first of the four sources below that the asset allows; they run from least work to most. A crafted form evaluates its weights on its [generating definition](crafting/construction.md#generating-definition) instead.

Prove one representative export, import and deformation path before rigging many assets the same way.

### Rig carried by the source

Use the rig the source carries, from a generation service or the asset's author, when its joints map onto the target joint set. Request the service's standard skeleton nearest that set. Watch for its own joint names, rest pose, extra joints and unit.

### Transfer from a rigged body

Transfer the weights from an already rigged body of the same kind and pose when one exists, such as the project's own figure. Copy only where the nearest surface matches in position and normal, and fill the rest by smoothing from those vertices.

### Automatic weights

Compute the weights automatically from the skeleton and the surface when the surface is one closed piece. Watch for weights crossing between touching surfaces, and for failure on open or disconnected geometry.

### Learned rigging model

Use a learned rigging model that predicts skeleton and weights when no existing skeleton fits, such as for an unusual creature. Its skeleton is its own, so it needs a joint mapping and its motion needs retargeting.

## Deformation proof

### Poses to inspect

Check the rest result first, then each required control alone, then combined poses and the shot sequence, in the rounds the [correction rounds](../visual-debugging/correction-rounds.md) page sets.

Choose coverage, such as shoulder and hip bends, twisting, hands and face, attachments and returns to rest, from the asset's anatomy, promised use, silhouettes, junctions and screen scale.

| Seen | Usual cause |
| --- | --- |
| The mesh displaced or scattered at rest | A bind pose not matching the skeleton, or a unit or axis converted twice |
| One limb dragging another, or the torso following an arm | Weights that crossed between surfaces touching at bind |
| A joint pinching flat when it twists or bends far | The limit of linear blending, not a binding error |
| A piece left behind or torn off | A loose piece with no weights |

Attach a loose piece to one joint. For a joint that pinches flat, add a twist joint or compare the other skinning method.

Look also for clothing or accessories passing through the body, and for normals or materials that change with the pose.

### Skinning method and variants

Read the current API before choosing linear or dual-quaternion skinning and its scale constraints, and compare their results where the asset needs that choice. The preserve-volume preview of a digital content creation (DCC) tool, such as Blender or Maya, shows that tool, not the imported consumer.

Keep proportions and control identities stable across detail variants, and recheck weights, rig assumptions and attachments when topology or proportions change.

### What survives export

A DCC's constraints, drivers, corrective shapes and modifier stack are evaluated behavior, not portable controls. List which operations produce the promised deformation and which channels the exporter, ingest profile and runtime keep: an interchange format such as glTF defines animation and skin semantics, and the ingest profile in use can accept a narrower subset.

Where needed, bake evaluated results into kept channels or a supported fixed representation, preserving the original and the conversion's identity. Report required behavior the path cannot carry instead of exporting only the rest mesh.

Compare the source's evaluated deformation with the imported result at matched times and views, including required corrective or facial states, attachments and nonuniform scale where used. The kept channels and the visible error show whether the deformation is the same; matching bone names or key counts do not. Cover the promised screen-scale performance without requiring unused controls.

## Handoff

Hand the admitted skeleton interpretation, controls, source identities and unresolved limits to the owner of the asset's performance under the motion skill, so every rig repair stays with the rig rather than inside a shot. A pose screenshot, a finished auto-rig job or a low fitting residual covers only what it shows.

## References

These primary sources are options, not installed features, and a learned model's code, weights and data carry separate licenses to check at adoption.

The [glTF skinning tutorial](https://github.com/KhronosGroup/glTF-Tutorials/blob/main/gltfTutorial/gltfTutorial_020_Skins.md) and [specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) show how scene hierarchy, joint palette, inverse binds and current transforms differ. The [Blender armature modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/armature.html) documents that tool's deformation choices and preserve-volume behavior.

[Robust Skin Weights Transfer via Weight Inpainting](https://github.com/rin-23/RobustSkinWeightsTransferCode) transfers weights between bodies of different shape.

[UniRig](https://github.com/VAST-AI-Research/UniRig) predicts a learned skeleton, then a skin from it, so correct the skeleton before taking the skin. [Puppeteer](https://github.com/Seed3D/Puppeteer) and [RigAnything](https://arxiv.org/abs/2502.09615) predict skeleton and weights for bodies no template fits.
