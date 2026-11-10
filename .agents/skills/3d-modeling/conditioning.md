# Conditioning

Conditioning turns a found or generated mesh into the form its consumer expects: the project's unit and axes, the triangle count its views need, and the parts or rest pose its motion needs. It applies alike to a mesh from [Sources](sources.md) and from [Diffusion](diffusion.md).

Do only what the asset's use needs. Each step makes a derivative to keep and verify, and work no view shows buys nothing.

## Freeze the source

1. Freeze the selected file and its sidecars with their hashes before anything reads them.

   The frozen file is the reproducible source. A URL, a model name or a seed does not identify it, and a service's download link can expire within minutes.

2. Record its origin and usage terms beside it, and for a generated mesh the model, version, seed, prompt, inputs and settings.
3. Keep the original apart from every converted, reduced or rigged derivative, and record which source each derivative consumes.
4. Make each derivative by a saved script with its settings, never by hand in an interactive tool, so it can be made again from the frozen source.

## What the use needs

Every asset is [normalized](#normalize), [cleaned](#clean) and [reduced](#reduce). Its use adds:

| The asset | Further work |
| --- | --- |
| Moves as rigid parts on pivots, such as a door, a vehicle or a robot | Cut it into those parts under [Modularization](modularization.md) |
| Deforms, such as a creature or a clothed figure | [Rigging](rigging.md) |
| Carries crafted parts, such as a generated figure holding a crafted prop | Define each [connection](modularization.md#frames-and-connections) once for both sides |
| Varies by a parameter | [Variation](#variation) |

Regular quad topology, new texture coordinates and rebaked maps serve an asset that is subdivided, edited further or seen close. Do them when that use or the user asks for them.

## Normalize

Convert the source to the project's unit, axes and handedness in one named step, because a generated mesh arrives at an arbitrary scale and facing. Check the result against a known real dimension, such as a figure's height or a door's width.

Put the origin where the asset meets the ground, under its center, so placing it on a floor needs no offset.

## Clean

Remove a defect at the first of these places that can remove it, listed from least work to most:

| Place | Removes | Examples |
| --- | --- | --- |
| The request, generated again | What [Diffusion](diffusion.md#request) says to ask for | |
| The generation service | Excess triangles, a wrong format or size and fused parts, in its own or an uploaded mesh | The [models](diffusion.md#models) that remesh, convert or segment |
| A script over a mesh library in the project's own language | Duplicate vertices, pieces too small to see, excess triangles and unused data | [glTF Transform](https://gltf-transform.dev/functions) with [meshoptimizer](https://github.com/zeux/meshoptimizer) |
| A mesh repair tool, or a digital content creation tool run from the command line | Holes, inner surfaces and irregular triangles | [PyMeshLab](https://github.com/cnr-isti-vclab/PyMeshLab), [Blender](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html) |

The examples are neither a complete list nor installed dependencies.

Correct a texture's baked light and shadow only where it shows wrong in the actual render.

## Reduce

Reduce to the triangle count the asset's closest required view needs, at one of the places [Clean](#clean) lists. Merge duplicate vertices first, because a simplifier cannot collapse an edge across split vertices, and reduce before rigging, because weights belong to the final vertices and tools differ in whether a later simplification carries them.

Reduce any other cost only when [measurement](visual-debugging.md#cost) shows it limits the render:

| Measured cost | Remedy |
| --- | --- |
| Triangles of distant or repeated copies | Use levels of detail, a flat card for the farthest copies, and one instanced mesh for the repeats |
| Draw calls | Merge meshes that share a material, and remove duplicate materials and textures |
| Texture memory | Lower each texture to the resolution its closest view resolves, pack small ones into an atlas, and store them in a GPU-compressed format |
| Skinning | Cut joints or influences per vertex, as a derivative [Rigging](rigging.md#binding) measures |
| File size and loading time | Quantize vertex attributes and compress the mesh |
| Triangles no view reaches | Remove them |

## Variation

What the parameter changes decides whether the mesh can stay:

| The parameter changes | Do |
| --- | --- |
| The size or placement of the whole or of one part | Transform that part |
| The proportions of a rigged body | Change the bone lengths, let the skin follow, and hand the change to [motion](../motion/SKILL.md) |
| Bulk or bend, smoothly | Deform the mesh through a coarse lattice the parameter drives |
| A count, the structure, or one dimension while the others hold | Give the form a generating definition, by [Crafting](crafting.md) or by [Recovery](recovery.md) with the mesh as its source |
| A person's build | Use the parametric figure the installed packages provide |

A few fixed variants need no parameter. Generate or fetch each as its own frozen source, accepting that their shared features will not match exactly.

## Check

Load the conditioned derivative through the actual consumer and judge it under [Visual debugging](visual-debugging.md), beside the frozen source, at the views and motion it is used for.
