# Meshy

Hosted API. Values were read from the linked documentation in November 2026; it owns them, so read it again when choosing.

- **Input:** text of up to 800 characters, one image of at least 512 px, or 1 to 4 images of one object under similar light, the first read as the front. Image enhancement is on by default and redraws the input; turn it off for an input to keep.
- **Prompt:** subject, material, style, then technical constraints, most important first; no negative field.
- **Stages:** a preview makes the bare mesh, and a refine textures it from a texture prompt or an image, not both; an image whose shape differs from the mesh textures poorly.
- **Settings:** A-pose or T-pose; an estimated real height and an origin at the bottom or center; material channels, off by default; removal of baked light, on by default. A face count of 100 to 300,000 and quad or triangle faces apply only when remeshing is enabled. An uploaded mesh can be remeshed or retextured alone, keeping its texture coordinates.
- **Rigging:** a textured biped GLB facing +Z with at most 380,000 triangles, at a height given in meters, 1.7 by default. It can rig to a standard skeleton such as Mixamo, Unreal, Unity or Rigify; its own default skeleton is in centimeters.
- **Seed:** none.
- **Records:** treat the task identifier as opaque, and download results before their links expire.
- **Output terms:** free-plan outputs are CC BY 4.0 and need credit; paid plans give a private license.

Documentation: [prompting](https://docs.meshy.ai/en/webapp/guides/prompting), [text to 3D](https://docs.meshy.ai/api/text-to-3d), [image to 3D](https://docs.meshy.ai/api/image-to-3d), [multi-image to 3D](https://docs.meshy.ai/api/multi-image-to-3d), [remesh](https://docs.meshy.ai/api/remesh), [retexture](https://docs.meshy.ai/api/retexture), [rigging](https://docs.meshy.ai/api/rigging), [pricing](https://docs.meshy.ai/pricing).
