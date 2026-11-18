# 3D models

Check the chosen model's documentation for input limits, available outputs and usage terms.

## Generators

Meshy, Tripo and Rodin are hosted services; Hunyuan3D and TRELLIS.2 are open weights, TRELLIS.2 under MIT.

### Meshy

Meshy takes text, up to four front-first views or a mesh for retexturing or remeshing. It offers rest pose, triangle and topology controls, size estimates and standard biped [rigging](https://docs.meshy.ai/api/rigging). See [image to 3D](https://docs.meshy.ai/api/image-to-3d).

### Tripo

Tripo accepts text and a negative prompt, one image, keyed views with the front required, or a mesh to texture. It offers parts, retopology, seeds, size estimates and standard rigging checks. See [quick start](https://developers.tripo3d.com/en/docs/quick-start).

### Rodin

Rodin takes text or up to five images, with materials from the first. It offers rest pose, symmetry, quality tiers and custom [rigging](https://docs.hyper3d.ai/en/api-specification/rigging.md). See [Gen-2.5](https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5).

### Hunyuan3D

Hunyuan3D takes one image, or front, left, back and right views in 2mv. Omni adds shape conditions, and Paint textures a given mesh. Beyond the mesh it delivers material channels. Its documentation is the repositories of [2.1](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1), [2mv](https://huggingface.co/tencent/Hunyuan3D-2mv) and [Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni).

### TRELLIS.2

[TRELLIS.2](https://github.com/microsoft/TRELLIS.2) accepts an image or a mesh to texture. Its material output includes opacity, which must be enabled after export.

## Shape techniques

A geometry condition is taken by [Hunyuan3D-Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni), [SpaceControl](https://github.com/spacecontrol3d/spacecontrol) and the [TRELLIS variants](https://github.com/microsoft/TRELLIS). Hunyuan3D-Omni takes point, voxel, box or pose conditions, SpaceControl works over TRELLIS, and the TRELLIS variants start from a mesh and a prompt.

Texture on the given mesh comes from [Hunyuan3D-Paint](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1), [TRELLIS.2](https://github.com/microsoft/TRELLIS.2) and [MV-Adapter](https://github.com/huanngzh/MV-Adapter), or from hosted retexturing in [Meshy](https://docs.meshy.ai/en/api/retexture) or [Tripo](https://developers.tripo3d.com/en/docs/models-texture).

Refinement of the given mesh comes from [UltraShape](https://github.com/PKU-YuanGroup/UltraShape-1.0) and [DetailGen3D](https://github.com/VAST-AI-Research/DetailGen3D).

Views rendered from the shape use [LooseControl](https://github.com/shariqfarooq123/LooseControl) for depth control from boxes, and [StableGen](https://github.com/sakalond/StableGen) for projection in Blender.

Bodies use the pose condition of [Hunyuan3D-Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni), [Rodin rigging](https://docs.hyper3d.ai/en/api-specification/rigging.md) with a custom bone hierarchy, and [UniRig](https://github.com/VAST-AI-Research/UniRig).

## Terms

Check hosted plan terms and save outputs before they expire. Open weights may restrict regions or large services. The Hunyuan3D license excludes the EU, UK and South Korea.
