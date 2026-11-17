# Conditioning

Conditioning turns a found or generated mesh into the form its consumer expects: the project's unit and axes, the triangle count its views need, and the parts or rest pose its motion needs. Do only what the asset's use needs, because each step makes a derivative to keep and verify.

## Frozen source

Keep the source and every derivative reproducible in this order:

1. Freeze the selected file and its sidecars, with their hashes, before anything reads them.
2. Record its origin and usage terms beside it.
3. Keep the original apart from every converted, reduced or rigged derivative, and record the source each one consumes.
4. Make each derivative with a saved script and its settings, never by hand in an interactive tool.

For a generated mesh, the record also holds the model, version, seed, prompt, inputs by digest, settings, job identifier and the plan whose terms cover the output.

The frozen file is the source, because a URL, a model name or a seed does not identify it and a service's download link can expire within minutes.

## What the use needs

Every asset is [normalized](#normalization), [cleaned](#cleanup) and [reduced](#reduction). Its use adds:

| Further work | For an asset that |
| --- | --- |
| [Modularization](modularization.md) | Moves as rigid parts on pivots, such as a door or a robot |
| [Rigging](rigging.md) | Deforms, such as a creature or a clothed figure |
| [Connections](modularization.md#frames-and-connections) | Carries crafted parts, such as a held prop |
| [Variation](#variation) | Varies by a parameter |

Regular quad topology, new texture coordinates and rebaked maps serve an asset that is subdivided, edited further or seen close; do them when that use or the user asks. A remesh replaces the surface, so a textured asset then needs new texture coordinates and a bake from the frozen source.

## Steps for every asset

### Normalization

Finish every service step, such as a remesh or a rig, on the service's own output first, with the mesh facing as that service requires, because a service can return a wrongly oriented result that still reports success.

Then convert the source to the project's unit, axes and handedness in one named step, and check the result against a known real dimension, such as a figure's height. Put the origin where the asset meets the ground, under its center.

### Cleanup

Remove a defect at the first of these places that can remove it, listed from least work to most:

| Place | Removes |
| --- | --- |
| The request, generated again | Whatever the diffusion request page says to ask for |
| The generation service | Excess triangles, a wrong format or size and fused parts |
| A mesh library script | Duplicate vertices, pieces too small to see, excess triangles and unused data |
| A repair tool | Holes, inner surfaces and irregular triangles |

The generation service works on its own or an uploaded mesh, through the [models](diffusion/models.md) that remesh, convert or segment. The script uses a mesh library in the project's own language, such as [glTF Transform](https://gltf-transform.dev/functions) with [meshoptimizer](https://github.com/zeux/meshoptimizer). The repair tool is one such as [PyMeshLab](https://github.com/cnr-isti-vclab/PyMeshLab), or a digital content creation tool run from the command line, such as [Blender](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html). These are examples, not installed dependencies.

Correct a texture's baked light and shadow only where it shows wrong in the render.

### Reduction

Reduce to the triangle count the asset's closest required view needs, at one of the places [Cleanup](#cleanup) lists. Merge duplicate vertices first, within a tolerance that keeps texture seams, because a simplifier cannot collapse an edge across split vertices. Reduce before rigging, because weights belong to the final vertices and tools differ in whether a later simplification carries them.

Reduce any other cost only when [measurement](../visual-debugging/rendering-cost.md) shows it limits the render:

| Measured cost | Remedy |
| --- | --- |
| Triangles of far or repeated copies | Levels of detail, a flat card for the farthest, one instanced mesh for repeats |
| Draw calls | Merged meshes that share a material, with duplicate materials and textures removed |
| Texture memory | Lower resolution, an atlas for small textures, and a GPU-compressed format |
| Skinning | Fewer joints or influences per vertex |
| File size and loading time | Quantized vertex attributes and a compressed mesh |
| Triangles no view reaches | Their removal |

Lower each texture only to the resolution its closest view resolves. Fewer joints or influences make a derivative that [Rigging](rigging.md#binding) measures.

## Variation

What the parameter changes decides whether the mesh can stay:

| The parameter changes | Do |
| --- | --- |
| The size or placement of the whole or of one part | Transform that part |
| The proportions of a rigged body | Change the bone lengths and let the skin follow |
| Bulk or bend, smoothly | Deform the mesh through a coarse lattice the parameter drives |
| A count, the structure, or one dimension while the others hold | Give the form a generating definition |
| A person's build | Use the parametric figure the installed packages provide |

Hand a change of bone lengths to [motion](../motion/SKILL.md). The generating definition comes from [Crafting](crafting/SKILL.md), or from [mesh recovery](crafting/recovery.md) with the mesh as its source.

A few fixed variants need no parameter: generate or fetch each as its own frozen source, accepting that their shared features will not match exactly.

## Final check

Load the conditioned derivative through its consumer and judge it under [form inspection](inspection.md), beside the frozen source, at the views and motion it is used for.
