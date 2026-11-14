# Seedance 2.5

Values were read from the linked documentation in November 2026; it owns them, so read it again when planning.

- **Takes the hint as:** a video to edit or extend, or up to 10 reference videos of 2 to 30 s each and 30 s in total, at 24 to 60 fps. A task type of reference, edit, extend or auto chooses the role.
- **Output:** 4 to 30 s at 24 fps, 480p to 1080p.
- **Adherence:** an edit keeps the video as its master; a reference supplies only what the prompt says it supplies, such as camera, motion and rhythm.
- **References:** up to 30 images, 10 videos and 10 audio clips. Multi-view images serve up to 5 subjects. References with real human faces are rejected. Name each input in the prompt ("Image 1 …"), never inside the image, and send images no larger than the output resolution.
- **Hint video:** keep it clean of trajectory lines, axes and camera markers, which the model draws as objects; simple primitives work best.
- **Prompt:** no hard limit, up to 1,000 English words recommended; describe the subjects in detail even beside a gray video.
- **Sound:** generated in stereo, in 11 languages. Write each line once as `Name says: line`; a repeated line or an attached note can render as subtitles.
- **Continuing a take:** extend forward or backward, over several rounds. One request can extend one video while taking another as a reference, named by role in the prompt. Pass video in and out as `mov` to keep color and brightness across rounds.

Documentation: [model](https://docs.byteplus.com/docs/en/modelark/seedance-2-5.md), [prompting](https://docs.byteplus.com/docs/en/modelark/seedance-2-5-prompt-guide.md), [API](https://docs.byteplus.com/docs/en/modelark/create-video-generation-task-api.md).
