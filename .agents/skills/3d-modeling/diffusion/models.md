# 3D models

This page names current examples: the generators by the inputs they take and what they deliver beyond the mesh, and the models behind each shape hint technique. Take every value from the chosen model's documentation, and read its terms for whether its output may be used.

## Generators

Meshy, Tripo and Rodin are hosted services; Hunyuan3D and TRELLIS.2 are open weights, TRELLIS.2 under MIT.

### Meshy

Meshy takes text, or up to four views with the front first, and an uploaded mesh to remesh or retexture. Beyond the mesh it delivers a rest pose, remeshing to a face count and topology when enabled, an estimated size, and rigging of a biped onto a standard skeleton. Its documentation covers [image to 3D](https://docs.meshy.ai/api/image-to-3d) and [rigging](https://docs.meshy.ai/api/rigging).

### Tripo

Tripo takes text with a negative prompt, one image, or keyed views with the front required, and an uploaded mesh to texture. Beyond the mesh it delivers parts, retopology, model and texture seeds, an estimated size, a rig check and rigging onto standard skeletons. Its documentation starts at the [quick start](https://developers.tripo3d.com/en/docs/quick-start).

### Rodin

Rodin takes text, or up to five images, the first setting the materials. Beyond the mesh it delivers a rest pose, symmetry, quality tiers, and rigging onto a custom skeleton. Its documentation covers [Gen-2.5](https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5) and [rigging](https://docs.hyper3d.ai/en/api-specification/rigging.md).

### Hunyuan3D

Hunyuan3D takes one image, or front, left, back and right views in 2mv. Omni adds [shape conditions](#shape-techniques), and Paint textures a given mesh. Beyond the mesh it delivers material channels. Its documentation is the repositories of [2.1](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1), [2mv](https://huggingface.co/tencent/Hunyuan3D-2mv) and [Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni).

### TRELLIS.2

TRELLIS.2 takes one image, or a given mesh to texture. Beyond the mesh it delivers material channels with opacity, exported opaque until the alpha is switched on. Its documentation is its [repository](https://github.com/microsoft/TRELLIS.2).

## Shape techniques

A geometry condition is taken by [Hunyuan3D-Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni), [SpaceControl](https://github.com/spacecontrol3d/spacecontrol) and the [TRELLIS variants](https://github.com/microsoft/TRELLIS). Hunyuan3D-Omni takes point, voxel, box or pose conditions, SpaceControl works over TRELLIS, and the TRELLIS variants start from a mesh and a prompt.

Texture on the given mesh comes from [Hunyuan3D-Paint](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1), [TRELLIS.2](https://github.com/microsoft/TRELLIS.2) and [MV-Adapter](https://github.com/huanngzh/MV-Adapter), or from hosted retexturing in [Meshy](https://docs.meshy.ai/en/api/retexture) or [Tripo](https://developers.tripo3d.com/en/docs/models-texture).

Refinement of the given mesh comes from [UltraShape](https://github.com/PKU-YuanGroup/UltraShape-1.0) and [DetailGen3D](https://github.com/VAST-AI-Research/DetailGen3D).

Views rendered from the shape use [LooseControl](https://github.com/shariqfarooq123/LooseControl) for depth control from boxes, and [StableGen](https://github.com/sakalond/StableGen) for projection in Blender.

Bodies use the pose condition of [Hunyuan3D-Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni), [Rodin rigging](https://docs.hyper3d.ai/en/api-specification/rigging.md) with a custom bone hierarchy, and [UniRig](https://github.com/VAST-AI-Research/UniRig).

## Terms

A hosted service's output license depends on the plan, such as a free plan's attribution or public gallery, and its download links and stored outputs expire. Open weights may exclude regions or large services, as the Hunyuan3D license excludes the European Union, the United Kingdom and South Korea.
