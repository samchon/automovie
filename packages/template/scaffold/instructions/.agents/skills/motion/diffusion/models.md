# Motion models

These examples show how differently current motion models take a hint; they are not a complete or required list. Their documentation owns every value, and [clips](clips.md#licenses) sets how to read their licenses.

| Model | Takes | Gives | Note |
| --- | --- | --- | --- |
| [Cascadeur](https://cascadeur.com/help/category/278) | Keyframes on a humanoid rig, gaps up to 120 frames, or a reference clip's style | Its in-betweens, keeping the keys unchanged | A desktop tool; the result is not always physically accurate |
| [CondMDI](https://github.com/setarehc/diffusion-motion-inbetweening) | Keyframes of full or partial poses | 22 joint positions at 20 fps, up to 9.8 s | Trained for in-betweening; MIT code over SMPL-family data |
| [MoMask](https://github.com/EricGuo5513/momask-codes) | Text, and a clip with a time window to regenerate | 22 joint positions and BVH at 20 fps | Its foot fix sometimes fails; MIT code over SMPL-family data |
| [Kimodo](https://huggingface.co/nvidia/Kimodo-SOMA-SEED-v1) | Text with keyframe, end-effector and path constraints | SMPL-X or SOMA rotations at 30 fps, up to 10 s | An optimization step makes it hit its constraints; one checkpoint is commercial, another research-only |
| [OmniControl](https://github.com/neu-vi/OmniControl) | Text with any joint's position at any frame | 22 joint positions | MIT code over SMPL-family data |
| [EDGE](https://github.com/Stanford-TML/EDGE) | Music, with joints or frames to keep | Dance, exported to FBX | MIT |
| [HY-Motion](https://github.com/Tencent-Hunyuan/HY-Motion-1.0) | Text | SMPL-H rotations at 30 fps | No objects or partners; territory limits |
| [PHC](https://github.com/ZhengyiLuo/PHC) | A clip | The clip replayed through a simulated body | Removes floating, sliding and penetration |
