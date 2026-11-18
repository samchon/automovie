# Motion models

Check the chosen model's current inputs, outputs and values in its documentation. See [clips](clips.md) for license checks.

## Generators

| Model | Takes |
| --- | --- |
| [CondMDI](https://github.com/setarehc/diffusion-motion-inbetweening) | Keyframes of full or partial poses |
| [MoMask](https://github.com/EricGuo5513/momask-codes) | Text, and a clip with a time window to regenerate |
| [Kimodo](https://huggingface.co/nvidia/Kimodo-SOMA-SEED-v1) | Text with keyframe, end-effector and path constraints |
| [OmniControl](https://github.com/neu-vi/OmniControl) | Text with any joint's position at any frame |
| [EDGE](https://github.com/Stanford-TML/EDGE) | Music, with joints or frames to keep |
| [HY-Motion](https://github.com/Tencent-Hunyuan/HY-Motion-1.0) | Text |

CondMDI gives 22 joint positions at 20 fps, up to 9.8 s, and MoMask gives 22 joint positions and BVH at 20 fps. Kimodo gives SMPL-X or SOMA rotations at 30 fps, up to 10 s, and HY-Motion gives SMPL-H rotations at 30 fps. OmniControl gives 22 joint positions, and EDGE gives dance, exported to FBX.

CondMDI is trained for in-betweening, and an optimization step makes Kimodo hit its constraints. MoMask's foot fix sometimes fails. HY-Motion gives no objects or partners.

CondMDI, MoMask and OmniControl are MIT code over SMPL-family data, and EDGE is MIT. One Kimodo checkpoint is commercial and another research-only. HY-Motion has territory limits.

## Pose estimators

| Estimator | Takes |
| --- | --- |
| [GVHMR](https://github.com/zju3dv/GVHMR) | Video, static or moving camera |
| [WHAM](https://github.com/yohanshin/WHAM) | Video |
| [GEM-X](https://github.com/NVlabs/GEM-X) | Video |
| [SAM 3D Body](https://github.com/facebookresearch/sam-3d-body) | One image at a time |
| [HaMeR](https://github.com/geopavlakos/hamer) | Images |

GVHMR and WHAM give a world-grounded body; GVHMR is research-only, and WHAM is MIT code over SMPL. GEM-X works on the SOMA body, and SAM 3D Body on the [MHR](https://github.com/facebookresearch/MHR) body. HaMeR gives hands only.
