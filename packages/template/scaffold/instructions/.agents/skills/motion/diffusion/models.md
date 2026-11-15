# Motion models

These tables show current motion generators and pose estimators as examples, not a required list, and the user may choose any other. A model's own documentation holds every value, and [clips](clips.md#licenses) sets how to read its license.

## Generators

| Model | Takes | Gives | Note |
| --- | --- | --- | --- |
| [CondMDI](https://github.com/setarehc/diffusion-motion-inbetweening) | Keyframes of full or partial poses | 22 joint positions at 20 fps, up to 9.8 s | Trained for in-betweening; MIT code over SMPL-family data |
| [MoMask](https://github.com/EricGuo5513/momask-codes) | Text, and a clip with a time window to regenerate | 22 joint positions and BVH at 20 fps | Its foot fix sometimes fails; MIT code over SMPL-family data |
| [Kimodo](https://huggingface.co/nvidia/Kimodo-SOMA-SEED-v1) | Text with keyframe, end-effector and path constraints | SMPL-X or SOMA rotations at 30 fps, up to 10 s | An optimization step makes it hit its constraints; one checkpoint is commercial, another research-only |
| [OmniControl](https://github.com/neu-vi/OmniControl) | Text with any joint's position at any frame | 22 joint positions | MIT code over SMPL-family data |
| [EDGE](https://github.com/Stanford-TML/EDGE) | Music, with joints or frames to keep | Dance, exported to FBX | MIT |
| [HY-Motion](https://github.com/Tencent-Hunyuan/HY-Motion-1.0) | Text | SMPL-H rotations at 30 fps | No objects or partners; territory limits |

## Pose estimators

| Estimator | Takes | Note |
| --- | --- | --- |
| [GVHMR](https://github.com/zju3dv/GVHMR) | Video, static or moving camera | World-grounded body; research-only |
| [WHAM](https://github.com/yohanshin/WHAM) | Video | World-grounded body; MIT code over SMPL |
| [GEM-X](https://github.com/NVlabs/GEM-X) | Video | On the SOMA body |
| [SAM 3D Body](https://github.com/facebookresearch/sam-3d-body) | One image at a time | On the [MHR](https://github.com/facebookresearch/MHR) body |
| [HaMeR](https://github.com/geopavlakos/hamer) | Images | Hands only |
