# Video models

These current models show how differently a model takes the motion hint, sets [adherence](../requests.md#adherence) and continues a take; the user may choose any other. Read the chosen model's values from its own documentation.

The chosen endpoint decides which channels reach the model: some services accept only RGB video and estimate controls internally, while others accept rendered depth, edge or pose videos.

Read each model's terms and usage policy before adopting it: territory limits, rejected reference content such as real faces or minors, [billing and suspension for refused jobs](https://docs.dev.runwayml.com/api-details/moderation/), revenue thresholds and labeling duties for open weights, and the price per second.

## Hint video and channels

### Video editing and reference generation

<!-- @reference [Ray 3.2 video-to-video guide](https://lumalabs.ai/learning-center/articles/ray-3-2-video-to-video) documents its motion and structure controls. -->

[Runway Aleph 2.0](https://docs.dev.runwayml.com/guides/models.md) edits or restyles one video with timed keyframe images. It has no adherence setting; its [prompt](https://help.runwayml.com/hc/en-us/articles/52150503729171-Aleph-2-0-Prompting-Guide) names what changes. Continue from a chain frame used as the first keyframe.

[Seedance](https://docs.byteplus.com/docs/en/modelark/seedance-2-5.md) takes a video to edit or extend, or several reference videos. Its task type and [prompt](https://docs.byteplus.com/docs/en/modelark/seedance-2-5-prompt-guide.md) distinguish those roles and say what each reference supplies. It can extend one video while another remains a reference.

[Kling Omni](https://kling.ai/document-api/api/video/4-0/video-omni) edits a base video beside reference videos and images. Input type and wording decide whether the base is edited or referenced; continuation beside the hint is not documented. Its [guide](https://kling.ai/quickstart/kling-4-model-user-guide) and [elements](https://kling.ai/document-api/api/video/4-0/elements.md) describe reference binding.

[Gemini Omni](https://aistudio.google.com/docs/omni) edits video with reference images and a first or last frame. Wording sets adherence, and further turns extend the take.

[Luma Ray](https://docs.agents.lumalabs.ai/guides/videos/editing) edits one video with keyframes, strength presets and per-signal controls for pose, depth, normals, trajectory and face. Continue from a chain frame used as the first keyframe.

### Layout and structural control

[LTX](https://docs.ltx.io/open-source-model/vfx-post-production/layout-to-render.md) uses a gray RGB layout and an art-directed first frame. [IC-LoRA](https://docs.ltx.io/open-source-model/usage-guides/ic-lo-ra.md) accepts depth, edges, pose or tracks with masked strength. [Character LoRA](https://ltx.io/blog/how-to-train-a-character-lora) guides appearance. Guided extension is undocumented.

[fal H3 Max](https://fal.ai/models/minimax/h3-max/3d-to-video/llms.txt) takes up to 15 seconds, 32 shots and eight appearance references, with no first frame. It follows camera, paths, timing and cuts approximately. No adherence setting or documented continuation. End at a cut.

[Wan VACE (open weights)](https://github.com/ali-vilab/VACE) takes depth, pose, scribble, flow, layout or mask channels, with channel strengths and masks. The [Wan2.1 implementation](https://github.com/Wan-Video/Wan2.1) extends from a previous clip's first or last frames.

[Cosmos Transfer 2.5](https://github.com/nvidia-cosmos/cosmos-transfer2.5), superseded by [Cosmos 3](https://github.com/NVIDIA/Cosmos), combines segmentation, depth, edge and blur. Weighting by frame and region depends on backend. Continue from the previous output's frame.

A compatible image checkpoint and [AnimateDiff SDXL](https://github.com/guoyww/AnimateDiff/blob/sdxl/README.md) can use a matching character LoRA. Run locally or through [ComfyUI](https://docs.comfydeploy.com/docs/api/inputs). Verify under [first path](../generation.md#first-path).

### Geometry and material channels

[DiffusionRenderer (open weights)](https://github.com/nv-tlabs/diffusion-renderer) takes base color, normal, depth, roughness and metallic channels, with an HDR environment map for light. It keeps those channels and computes lighting, with no adherence setting or documented continuation.

## Still-frame generation

[Veo](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/veo/3-1-generate) takes a first frame, or first and last frames, with asset images for identity. It keeps those frames rather than the motion hint, as its [best practices](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/best-practice) describe. Its [extension](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/extend-a-veo-video) uses a prompt alone and returns the input joined to the new footage.

## Other roles

[Kling Motion Control](https://kling.ai/quickstart/motion-control-user-guide) transfers the largest person, or none for similarly sized people. Match video orientation to preserve camera and facing and bind an element. Image orientation takes camera from the prompt. Continue with a chain frame as character image.

[Wan2.2](https://github.com/Wan-Video/Wan2.2) provides S2V from audio and pose video and Animate from a performer video. [InfiniteTalk](https://github.com/MeiGen-AI/InfiniteTalk) resyncs one face. [MultiTalk](https://github.com/MeiGen-AI/MultiTalk) binds several speakers to separate audio tracks.
