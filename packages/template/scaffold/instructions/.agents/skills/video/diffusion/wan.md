# Wan VACE and Wan Fun Control

Open weights. Values were read from the linked documentation in November 2026; it owns them, so read it again when planning.

- **Takes the hint as:** VACE takes depth, pose, scribble, optical flow, gray, box-and-trajectory layout and mask passes; Fun Control takes edge, depth, pose and line passes and trajectories.
- **Output:** Wan2.1 VACE gives 81 frames at 16 fps, a frame count of 4n+1, at 480 × 832 or 720 × 1280; the Fun Control 5B model gives 121 frames at 24 fps.
- **Adherence:** each pass's strength, and masks over frames and regions.
- **References:** up to 3 reference images for VACE, of which the ComfyUI node uses only the first; a start frame for Fun Control.
- **Prompt:** up to 512 text-encoder tokens.
- **Sound:** none.
- **Continuing a take:** VACE extends from the first or last frame or clip; its guide generates 5 s clips one by one with first-clip extension. Combining kept frames with control passes in one run is not documented.

Documentation: [VACE](https://github.com/ali-vilab/VACE), [VACE user guide](https://github.com/ali-vilab/VACE/blob/main/UserGuide.md), [Wan2.1](https://github.com/Wan-Video/Wan2.1), [VideoX-Fun](https://github.com/aigc-apps/VideoX-Fun).
