# Diffusion

A diffusion model turns a prompt or images into a mesh. This guide covers what to ask of it, what comes back and which models exist; [Conditioning](conditioning.md) takes the result into the project.

Repainting rendered frames into video is a separate lane. A generated 2D image serves as appearance reference and supplies no geometry until an image-to-geometry model turns it into a mesh.

## Request

Generating again with a better request costs less than repairing a mesh, so ask for whichever of these the model offers:

| Ask for | Otherwise expect |
| --- | --- |
| One subject per generation, alone on a plain background in an input image | Several subjects fused into one surface |
| A rest pose with the arms and legs apart, an A-pose or a T-pose, for a body that will deform | Limbs fused to the body or to each other |
| Part-aware generation or segmentation, or each part generated alone, for parts that move | Moving parts fused into one surface |
| The triangle count [Conditioning](conditioning.md#reduce) would reduce to | Far more triangles than any view needs |
| Separate material channels | Light and shadow baked into the texture |
| Several views of the subject | Invented hidden sides |

No request removes the rest: an arbitrary scale, facing and origin, melted thin parts, loose pieces, holes, inner surfaces, and a rig that is a first guess on the model's own skeleton.

## Models

Use the model or service the user chooses, local or hosted. The entries below are representative examples, not a complete or required list. Their controls, limits and terms change between releases, so the linked documentation, read when choosing, owns them.

| Model | Runs as | Input | Beyond the mesh | Documentation |
| --- | --- | --- | --- | --- |
| Meshy | Hosted API | Text, one image or several | Rest pose, triangle count and quad or triangle topology at generation; remeshing of an uploaded mesh; rigging of a textured biped humanoid, with walk and run clips | [Image to 3D](https://docs.meshy.ai/api/image-to-3d), [remesh](https://docs.meshy.ai/api/remesh), [rigging](https://docs.meshy.ai/api/rigging) |
| Tripo | Hosted API | Text, one image or several views | Segmentation into parts, retopology, texture coordinates, format conversion, a rig check with automatic rigging, animation retargeting | [Quick start](https://developers.tripo3d.com/en/docs/quick-start) |
| Rodin | Hosted API | Text, or one to five images | Quality tiers and texture resolution | [API](https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5) |
| Hunyuan3D-2.1 | Open weights, about 10 GB of GPU memory for shape and 21 GB for texture | One image | Material channels | [Repository](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1), [license](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1/blob/main/LICENSE) |
| TRELLIS.2 | Open weights under MIT, an NVIDIA GPU with 24 GB, tested on Linux | One image | Material channels with opacity | [Repository](https://github.com/microsoft/TRELLIS.2) |

Read each model's terms before adopting it: plan requirements, limits on using the output, and territory, such as the Hunyuan3D-2.1 license, which excludes the European Union, the United Kingdom and South Korea.
