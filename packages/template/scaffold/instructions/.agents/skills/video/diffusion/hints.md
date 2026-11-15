# Hints

A video model takes the motion hint in one of a few ways, and the chosen model decides which; [video models](models.md) shows examples. Each way keeps a different part of the hint:

| Way | Keeps | Prefer when | Watch for |
| --- | --- | --- | --- |
| Editing or restyling the hint video | Positions, timing and camera closely, while the model repaints the surfaces | The film must follow the hint closely | An edit can recompose the frame, zooming or recentering it; say that the framing holds, and check by overlay |
| The hint as a reference video | Motion and camera loosely, in a new generation | The look matters more than exact positions | The wording decides whether a video is edited or referenced; a reference supplies only what the prompt says it supplies |
| A gray-layout adapter | The camera path and the placement of each form, while it replaces the forms | The hint's forms are plain blockout | Shapes still drift; some need a first frame made from the hint, and the prompt describes the finished shot, never "clay" or "3D" |
| Control passes through adapters | Each pass at its own strength, optionally masked over frames and regions | Contacts and positions must hold exactly | A dense pass keeps the coarse shape, as [dense passes](../../motion/control-channels.md#dense-passes) sets; some adapters take one pass per run, so combine passes only where the model's documentation allows |
| Still frames | Only the pose and camera of the frames given | The model takes no video | The motion between frames is the model's, so [still frames](prompts.md#still-frames) sets how to prompt it |
| Motion transfer onto a character image | One figure's body motion | A single performer | It follows only the most prominent figure, and a cut or camera move in the motion video can cut the take short |

Hosted models take a camera from the hint video, the prompt or a few preset moves. Some research models take camera parameters together with human motion, but the hint video stays the simplest carrier of both.

Keep the hint bare, because surface detail in it competes with the references: plain forms, no textures, no lettering, and no [inspection overlays](../../motion/control-channels.md#render-what-the-receiver-takes).

Sources: [LTX Layout-To-Render](https://docs.ltx.io/open-source-model/vfx-post-production/layout-to-render.md), [LTX IC-LoRA](https://docs.ltx.io/open-source-model/usage-guides/ic-lo-ra.md), [Luma editing](https://docs.agents.lumalabs.ai/guides/videos/editing), [Seedance prompting](https://docs.byteplus.com/docs/en/modelark/seedance-2-5-prompt-guide.md), [Kling guide](https://kling.ai/quickstart/kling-4-model-user-guide), [Kling Motion Control](https://kling.ai/quickstart/motion-control-user-guide), [fal H3 Max](https://fal.ai/models/minimax/h3-max/3d-to-video/llms.txt), [Uni3C](https://arxiv.org/abs/2504.14899), [VACE](https://github.com/ali-vilab/VACE/blob/main/UserGuide.md), [clay render to action short](https://blog.fal.ai/from-clay-3d-render-to-a-real-action-short-a-3d-to-ai-pipeline-with-total-control/), [Blender for AI filmmaking](https://flick.art/blog/blender-ai-filmmaking).
