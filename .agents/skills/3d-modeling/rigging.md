# Rigging

Use this guide when an asset needs a new or changed skeleton, skin, attachment or deformation control. Read the asset's required use, its retained source, and the import, model, skinning and viewer contracts of the packages it uses.

Rigging owns the rest state: where the joints sit, which vertices follow them, the attachments, the limits and the still poses that test them. Anything over time, such as clips, retargeting, inverse kinematics and the laws that generate motion, belongs to [motion](../motion/SKILL.md).

A generated surface is not a rig, and a generated rig is a candidate until its actual consumer deforms it correctly.

## Rig choice

| The asset | Rig |
| --- | --- |
| Rigid parts on pivots, such as a door, a vehicle or a robot | No skin. Each part is a node with its pivot on the real axis, under [Modularization](modularization.md) |
| A humanoid | A skin bound to the humanoid joint set the installed packages' motion performs on |
| Another deforming body, such as an animal or a cloak | A skin bound to the joints its motion drives |

A joint nothing drives costs binding and inspection and changes no frame.

When a detailed mesh replaces a body whose skeleton and proportions are already accepted, align the mesh to that skeleton's rest pose and joint positions. Adopting the mesh's own proportions instead changes the character and sends its motion back through retargeting, so that choice is the user's.

## Characterize before binding

### Fixed inputs

Keep the exact mesh, skeleton, textures, source pose and transforms as fixed inputs. Identify units, handedness, up and forward axes, local and world transforms, the rest and bind pose, hierarchy, joint identifiers, pivots and attachment ownership. An exported rest pose, an animation's first frame and the display's zero pose need not coincide.

Inspect the required bones and every used influence, rigid accessories included; a successful import cannot supply a missing control.

### Binding

Map each deforming vertex to the actual joint palette and bind interpretation. Validate influence indices, finite weights, admitted sums and influence counts, parent relationships and coordinate conversion through the supported APIs.

Give a rigid prop its transform or attachment rather than a skin. Keep unknown joints and extra influences; a deliberate reduction is a new derivative whose error is measured and rendered at the required poses.

## Get the weights

Bind a mesh that [Conditioning](conditioning.md) has finished reducing, in a rest pose with the limbs apart, with each loose piece either joined to the surface or set aside as a rigid attachment.

Take the weights from the first of these the asset allows, listed from least work to most:

| Source of weights | Fits when | Watch for |
| --- | --- | --- |
| The rig the source carries, from a generation service or the asset's author | Its joints map onto the target joint set | Its own joint names, rest pose and extra joints |
| Transfer from an already rigged body of the same kind and pose | Such a body exists, such as the project's own figure | Copy only where the nearest surface matches in position and normal, and fill the rest by smoothing from those vertices |
| Automatic weights computed from the skeleton and the surface | The surface is one closed piece | Weights crossing between touching surfaces, and failure on open or disconnected geometry |
| A learned rigging model that predicts skeleton and weights | No existing skeleton fits, such as an unusual creature | Its skeleton is its own, so it needs a joint mapping and its motion needs retargeting |

A crafted form evaluates its weights on its [generating definition](crafting/SKILL.md#generating-definition) instead.

Prove one representative export, import and deformation path before rigging many assets the same way.

## Deformation proof

### Poses to inspect

Check the rest result first, then each required control alone, then combined poses and the actual shot sequence. Choose coverage from the asset's anatomy, promised use, silhouettes, junctions and screen scale, and inspect shoulder and hip bends, elbow and knee flexion, twisting, hands, face and other required regions, attachments, and returns to rest.

| Seen | Usual cause |
| --- | --- |
| The mesh displaced or scattered at rest | A bind pose that does not match the skeleton, or a unit or axis conversion applied twice |
| One limb dragging another, or the torso following an arm | Weights that crossed between surfaces touching at bind |
| A joint pinching flat when it twists or bends far | The limit of linear blending rather than a binding error; add a twist joint or compare the other skinning method |
| A piece left behind or torn off | A loose piece with no weights; attach it to one joint |

Look also for penetrating clothing or accessories, and changing normals or materials.

[Visual debugging](../visual-debugging/SKILL.md) owns the observation round and matching comparisons.

### Skinning method and variants

Read the current API before choosing linear or dual-quaternion skinning and its scale constraints, and compare their actual results where the asset needs that choice. The preserve-volume preview of a DCC, a digital content creation tool such as Blender or Maya, shows the DCC, not the imported consumer.

Keep proportions and control identities stable across detail variants, and recheck weights, rig assumptions and attachments when topology or proportions change.

### What survives export

A DCC's constraints, drivers, corrective shapes and modifier stack are evaluated behavior, not portable controls. List which operations produce the promised deformation and which channels the exporter, ingest profile and runtime keep. An interchange format such as glTF defines animation and skin semantics, and the ingest profile in use can accept a narrower subset.

Where needed, bake evaluated results into kept channels or a supported fixed representation, preserving the original and the conversion identity. Report required behavior the path cannot carry instead of exporting only the rest mesh.

Compare the source's evaluated deformation with the imported result at matched times and views, including required corrective or facial states, attachments and nonuniform scale where used. The kept channels and the visible error show whether the deformation is the same; matching bone names or key counts do not. Cover the promised screen-scale performance without requiring unused controls.

## Hand off

Hand the admitted skeleton interpretation, controls, source identities and unresolved limits to the owner of the asset's performance under [motion](../motion/SKILL.md), so every rig repair stays with the rig rather than inside a shot. A pose screenshot, a finished auto-rig job or a low fitting residual covers only what it shows.

## References

These primary sources inform the choices above. They are options, not installed features, and a learned model's code, weights and data carry separate licenses to check at adoption.

| Source | Informs |
| --- | --- |
| [glTF skinning tutorial](https://github.com/KhronosGroup/glTF-Tutorials/blob/main/gltfTutorial/gltfTutorial_020_Skins.md) and [specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) | How scene hierarchy, joint palette, inverse binds and current transforms differ |
| [Blender armature modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/armature.html) | Deformation choices and preserve-volume behavior in that tool |
| [Robust Skin Weights Transfer via Weight Inpainting](https://github.com/rin-23/RobustSkinWeightsTransferCode) | Transfer between bodies of different shape, copying where the match is reliable and filling the rest |
| [UniRig](https://github.com/VAST-AI-Research/UniRig) | A learned skeleton, then a skin predicted from it, so correct the skeleton before taking the skin |
| [Puppeteer](https://github.com/Seed3D/Puppeteer) and [RigAnything](https://arxiv.org/abs/2502.09615) | Skeleton and weight prediction for bodies no template fits |
