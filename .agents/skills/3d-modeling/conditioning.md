# Conditioning

## Frozen source

Keep the source and every derivative reproducible in this order:

1. Freeze the selected file and its sidecars, with their hashes, before anything reads them.
2. Record its origin and usage terms beside it.
3. Keep the original apart from every converted, reduced or rigged derivative, and record the source each one consumes.
4. Make each derivative with a saved script and its settings, never by hand in an interactive tool.

For a generated mesh, the record also holds the model, version, seed, prompt, inputs by digest, settings, job identifier and the plan whose terms cover the output.

Keep the frozen bytes locally. Service links can expire.

## What the use needs

Every asset is normalized, cleaned and reduced. Its use adds:

| Further work | For an asset that |
| --- | --- |
| [Modularization](modularization.md) | Moves as rigid parts on pivots |
| [Rigging](rigging.md) | Deforms |
| [Connections](modularization.md#frames-and-connections) | Carries crafted parts |
| Variation | Varies by a parameter |

Add quad topology, new UVs and rebaked maps for subdivision, editing, close views or user requests. After remeshing a textured asset, make new UVs and bake from the frozen source.

## Steps for every asset

### Normalization

Finish service-side remeshing or rigging in the service's required orientation. Check the returned orientation.

Convert units, axes and handedness in one named step. Check a known dimension. Put the origin below the asset's center at ground level.

### Cleanup

Remove a defect at the first of these places that can remove it, listed from least work to most:

| Place | Removes |
| --- | --- |
| The request, generated again | Whatever the diffusion request page says to ask for |
| The generation service | Excess triangles, a wrong format or size and fused parts |
| A mesh library script | Duplicate vertices, pieces too small to see, excess triangles and unused data |
| A repair tool | Holes, inner surfaces and irregular triangles |

Use a [generator](diffusion/models.md) that remeshes, converts or segments. For scripted cleanup, options include [glTF Transform](https://gltf-transform.dev/functions) with [meshoptimizer](https://github.com/zeux/meshoptimizer). Repair tools include [PyMeshLab](https://github.com/cnr-isti-vclab/PyMeshLab) and [Blender's CLI](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html).

Correct a texture's baked light and shadow only where it shows wrong in the render.

### Reduction

Reduce the mesh for its closest required view, keeping the [detail levels](crafting/construction.md#detail-levels) that view resolves. Merge duplicate vertices without losing texture seams. Reduce before rigging so weights bind to the final vertices.

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

Test a form that varies through bands at their ends, as [construction tests](crafting/construction.md#tests) set.

## Final check

Load the conditioned derivative through its consumer and judge it under [form inspection](inspection.md), beside the frozen source, at the views and motion it is used for.
