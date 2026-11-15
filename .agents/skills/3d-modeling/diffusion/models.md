# 3D models

Text- and image-to-3D models differ in how many views they take, whether they accept a shape, and what they deliver beyond the mesh. The tables sample current ones for comparison; read the chosen model's documentation for every value, and its terms for whether the output may be used.

## Generators

| Model | Runs as | Takes | Beyond the mesh | Documentation |
| --- | --- | --- | --- | --- |
| Meshy | Hosted | Text, or up to four views with the front first; an uploaded mesh to remesh or retexture | A rest pose, remeshing to a face count and topology when enabled, an estimated size, and rigging of a biped onto a standard skeleton | [Image to 3D](https://docs.meshy.ai/api/image-to-3d), [rigging](https://docs.meshy.ai/api/rigging) |
| Tripo | Hosted | Text with a negative prompt, one image, or keyed views with the front required; an uploaded mesh to texture | Parts, retopology, model and texture seeds, an estimated size, a rig check and rigging onto standard skeletons | [Quick start](https://developers.tripo3d.com/en/docs/quick-start) |
| Rodin | Hosted | Text, or up to five images, the first setting the materials | A rest pose, symmetry, quality tiers, and rigging onto a custom skeleton | [Gen-2.5](https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5), [rigging](https://docs.hyper3d.ai/en/api-specification/rigging.md) |
| Hunyuan3D | Open weights | One image; Omni adds point, voxel, box or pose conditions; Paint textures a given mesh | Material channels | [2.1](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1), [Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni) |
| TRELLIS.2 | Open weights under MIT | One image, or a given mesh to texture | Material channels with opacity | [Repository](https://github.com/microsoft/TRELLIS.2) |

## Shape techniques

| [Shape hint](shape-hints.md) | Examples |
| --- | --- |
| Geometry condition | [Hunyuan3D-Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni), with point, voxel, box or pose conditions; [SpaceControl](https://github.com/spacecontrol3d/spacecontrol), over TRELLIS; [TRELLIS variants](https://github.com/microsoft/TRELLIS), from a mesh and a prompt |
| Texture on the given mesh | [Hunyuan3D-Paint](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1), [TRELLIS.2](https://github.com/microsoft/TRELLIS.2), [MV-Adapter](https://github.com/huanngzh/MV-Adapter); hosted retexturing in [Meshy](https://docs.meshy.ai/en/api/retexture) or [Tripo](https://developers.tripo3d.com/en/docs/models-texture) |
| Refinement of the given mesh | [UltraShape](https://github.com/PKU-YuanGroup/UltraShape-1.0), [DetailGen3D](https://github.com/VAST-AI-Research/DetailGen3D) |
| Views rendered from the shape | [LooseControl](https://github.com/shariqfarooq123/LooseControl), depth control from boxes; [StableGen](https://github.com/sakalond/StableGen), projection in Blender |
| Bodies | The pose condition of [Hunyuan3D-Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni); [Rodin rigging](https://docs.hyper3d.ai/en/api-specification/rigging.md) with a custom bone hierarchy; [UniRig](https://github.com/VAST-AI-Research/UniRig) |

## Terms

A hosted service's output license depends on the plan, such as a free plan's attribution or public gallery, and its download links and stored outputs expire. Open weights may exclude regions or large services, as the Hunyuan3D license excludes the European Union, the United Kingdom and South Korea.
