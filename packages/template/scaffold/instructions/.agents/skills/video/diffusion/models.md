# Video models

These examples show how differently current models take a motion hint; they are not a complete or required list, and any model the user prefers or a newer release can serve. Their documentation, read when planning, owns every value, as [read the model](SKILL.md#read-the-model) sets.

| Model | Takes the hint as | Sets [adherence](../requests.md#adherence) by | Continues a take by | Documentation |
| --- | --- | --- | --- | --- |
| Runway Aleph | One video to edit or restyle, with timed keyframe images | No setting; it keeps what the prompt does not ask to change | Its last frame as the first keyframe | [Models](https://docs.dev.runwayml.com/guides/models.md), [prompting](https://help.runwayml.com/hc/en-us/articles/52150503729171-Aleph-2-0-Prompting-Guide) |
| Kling Omni | A base video to edit beside other videos and images as references | Wording or input type: editing the base video or referencing it | A feature reference beside the hint, a pairing its documentation does not show | [API](https://kling.ai/document-api/api/video/4-0/video-omni), [guide](https://kling.ai/quickstart/kling-4-model-user-guide) |
| Kling Motion Control | One figure's body motion, the most prominent person's | An orientation setting: follow the video's camera, or the image's | Its last frame as the character image | [Guide](https://kling.ai/quickstart/motion-control-user-guide) |
| Seedance | A video to edit or extend, or several reference videos | A task type: edit, extend or reference, and wording that says what a reference supplies | Extending one video while another is a reference | [Model](https://docs.byteplus.com/docs/en/modelark/seedance-2-5.md), [prompting](https://docs.byteplus.com/docs/en/modelark/seedance-2-5-prompt-guide.md) |
| Veo | Still frames only: a first frame, or a first and last frame | None; it keeps only the frames | An extension from a prompt alone, without references | [Model](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/veo/3-1-generate), [best practices](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/best-practice) |
| Luma Ray | One video to edit, with keyframes | Strength presets and per-signal controls for pose, depth and face | Its last frame as the first keyframe | [Editing](https://docs.agents.lumalabs.ai/guides/videos/editing) |
| LTX, open weights | The RGB hint through a gray-layout adapter with a first frame, or one depth, edge or pose pass | Adapter strength from 0 to 1, masked over frames and regions | No documented extension beside a control pass | [Layout-To-Render](https://docs.ltx.io/open-source-model/vfx-post-production/layout-to-render.md), [IC-LoRA](https://docs.ltx.io/open-source-model/usage-guides/ic-lo-ra.md) |
| Wan VACE, open weights | Depth, pose, scribble, flow, layout or mask passes | Each pass's strength and masks | Extension from the previous clip's first or last frames | [VACE](https://github.com/ali-vilab/VACE), [Wan2.1](https://github.com/Wan-Video/Wan2.1) |

Proprietary models take the hint as RGB video at most and derive any structure from it themselves. Open models with control adapters take depth, edge or pose videos directly, so choose one when exact positions, contacts and camera outweigh its setup cost.

Read each model's terms before adopting it: territory limits, rejected reference content such as real human faces or minors, revenue thresholds and labeling duties for open weights, and price per second.
