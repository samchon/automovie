# 3D models

These examples show how differently current text- and image-to-3D models take a hint; they are not a complete or required list. Their documentation, read when choosing, owns every value, and their terms decide whether the output may be used.

| Model | Runs as | Takes | Beyond the mesh | Documentation |
| --- | --- | --- | --- | --- |
| Meshy | Hosted | Text, or up to four views with the front first; an uploaded mesh to remesh or retexture | A rest pose, remeshing to a face count and topology when enabled, an estimated size, and rigging of a biped onto a standard skeleton | [Image to 3D](https://docs.meshy.ai/api/image-to-3d), [rigging](https://docs.meshy.ai/api/rigging) |
| Tripo | Hosted | Text with a negative prompt, one image, or keyed views with the front required; an uploaded mesh to texture | Parts, retopology, model and texture seeds, an estimated size, a rig check and rigging onto standard skeletons | [Quick start](https://developers.tripo3d.com/en/docs/quick-start) |
| Rodin | Hosted | Text, or up to five images, the first setting the materials | A rest pose, symmetry, quality tiers, and rigging onto a custom skeleton | [Gen-2.5](https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5), [rigging](https://docs.hyper3d.ai/en/api-specification/rigging.md) |
| Hunyuan3D | Open weights | One image; Omni adds point, voxel, box or pose conditions; Paint textures a given mesh | Material channels | [2.1](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1), [Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni) |
| TRELLIS.2 | Open weights under MIT | One image, or a given mesh to texture | Material channels with opacity | [Repository](https://github.com/microsoft/TRELLIS.2) |

A hosted service's output license depends on the plan, such as a free plan's attribution or public gallery, and its download links and stored outputs expire. Open weights may exclude regions or large services, as the Hunyuan3D license excludes the European Union, the United Kingdom and South Korea.
