# Rodin

Hyper3D's hosted API, Gen-2.5. Values were read from the linked documentation in November 2026; it owns them, so read it again when choosing.

- **Input:** text, or 1 to 5 images, the first of which sets the materials. A text-only request is first turned into an image.
- **Prompt:** omit it for image-to-3D; beside images it guides only orientation.
- **Settings:** an A-pose or T-pose for a human-like subject; a bounding box that sets proportions; symmetry; material as PBR, shaded with light baked in, or both; a quality tier that sets the face count, up to 200,000 in quad mode; and a seed from 0 to 65535.
- **Records:** outputs are kept for 7 days, so download them at once.
- **Output terms:** paid plans include broader export and usage rights; free-tier assets are published to the public gallery.

Documentation: [Gen-2.5 API](https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5), [rigging](https://docs.hyper3d.ai/en/api-specification/rigging.md), [data retention](https://docs.hyper3d.ai/en/legal/data-retention-policy), [pricing](https://hyper3d.ai/pricing?lang=en).
