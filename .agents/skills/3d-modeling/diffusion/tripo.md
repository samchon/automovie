# Tripo

Hosted API. Values were read from the linked documentation in November 2026; it owns them, so read it again when choosing.

- **Input:** text of up to 1,024 characters with a negative prompt of up to 255; one image of at least 256 px with a clean background and little occlusion; or 2 to 4 views keyed front, left, back and right of one object under the same light, the front required. It can also generate the missing views from one image.
- **Prompt:** name shape, material, style and scale; a vague prompt fails.
- **Settings:** a face limit; quad faces, which force FBX; part generation, which requires texture and material channels off; material channels, on by default; removal of baked light; an estimated real size in meters.
- **Seeds:** a model seed and a texture seed; the same seed and input repeat the mesh, so keep the model seed and change the texture seed to retexture alone.
- **Facing:** +X forward by default. Leave the export orientation unset when the mesh is processed further, because a later step can return a wrongly oriented result that still reports success; set facing in the final conversion.
- **Conversion:** bakes advanced materials into the base textures unless baking is turned off, and can place the pivot at the bottom center.
- **Beyond the mesh:** segmentation into parts, retopology that bakes the texture onto the new mesh, texture coordinates, a free rig check that reports whether and how a mesh can be rigged, automatic rigging to Mixamo, ActorCore, Unity, Unreal or VRM skeletons, and animation retargeting. A mesh the check rejects is generated again from a cleaner input without a complex pose.
- **Output terms:** read the plan's terms; the free tier's are not stated consistently.

Documentation: [quick start](https://developers.tripo3d.com/en/docs/quick-start), [text to model](https://developers.tripo3d.com/en/docs/generation-text-to-model/standard), [image to model](https://developers.tripo3d.com/en/docs/generation-image-to-model/standard), [multiview to model](https://developers.tripo3d.com/en/docs/generation-multiview-to-model/standard), [convert](https://developers.tripo3d.com/en/docs/models-convert), [rig](https://developers.tripo3d.com/en/docs/animations-rig), [rig check](https://developers.tripo3d.com/en/docs/animations-rig-check).
